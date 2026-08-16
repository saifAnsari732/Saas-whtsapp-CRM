import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// Global state to hold the socket and QR across hot reloads in Next.js dev
declare global {
  var waSockets: Record<string, any>;
  var waQrs: Record<string, string | null>;
  var waStatuses: Record<string, string>;
  var waStores: Record<string, any>;
}

if (!global.waSockets) {
  global.waSockets = {};
  global.waQrs = {};
  global.waStatuses = {};
  global.waStores = {};
}

const logger = pino({ level: 'silent' });

export async function connectToWhatsApp(userId: string) {
  if (!userId) return;

  const authFolder = `baileys_auth_info_${userId}`;
  const storeFile = `baileys_store_${userId}.json`;
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  if (global.waSockets[userId]) {
    console.log(`Baileys socket already exists for user ${userId}, returning it.`);
    return;
  }

  global.waStatuses[userId] = 'generating';
  global.waQrs[userId] = null;

  // Initialize custom lightweight store
  global.waStores[userId] = { chats: {} };

  // Try to load existing store from disk
  if (fs.existsSync(storeFile)) {
    try {
      global.waStores[userId] = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
    } catch (e) {
      console.error("Failed to read store file", e);
    }
  }

  // Save store periodically
  const storeInterval = setInterval(() => {
    try {
      fs.writeFileSync(storeFile, JSON.stringify(global.waStores[userId]));
    } catch (e) {
      console.error("Failed to write store to file", e);
    }
  }, 10_000);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
  });

  global.waSockets[userId] = sock;

  // Custom Store Event Listeners
  sock.ev.on('messaging-history.set', (data) => {
    for (const chat of data.chats) {
      if (chat.id) {
        global.waStores[userId].chats[chat.id] = chat;
      }
    }
  });

  sock.ev.on('chats.upsert', (chats) => {
    for (const chat of chats) {
      if (chat.id) {
        global.waStores[userId].chats[chat.id] = chat;
      }
    }
  });

  sock.ev.on('chats.update', (chats) => {
    for (const chat of chats) {
      if (chat.id) {
        if (global.waStores[userId].chats[chat.id]) {
          Object.assign(global.waStores[userId].chats[chat.id], chat);
        } else {
          global.waStores[userId].chats[chat.id] = chat;
        }
      }
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`New QR code received for user ${userId}`);
      global.waQrs[userId] = qr;
      global.waStatuses[userId] = 'waiting_scan';
    }

    if (connection === 'close') {
      clearInterval(storeInterval);
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Connection closed for user ${userId} due to `, lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      global.waStatuses[userId] = 'disconnected';
      delete global.waSockets[userId];
      
      if (shouldReconnect) {
        connectToWhatsApp(userId);
      } else {
        // Logged out, clean up auth folder and store file
        if (fs.existsSync(authFolder)) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
        if (fs.existsSync(storeFile)) {
          fs.rmSync(storeFile, { force: true });
        }
        delete global.waStores[userId];
      }
    } else if (connection === 'open') {
      console.log(`Opened connection to WhatsApp for user ${userId}`);
      global.waStatuses[userId] = 'connected';
      global.waQrs[userId] = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

export function getStatus(userId: string) {
  if (!userId) {
    return { status: 'disconnected', qr: null, user: null };
  }

  // Auto-reconnect if folder exists but socket is not in memory (e.g. after server restart)
  const authFolder = `baileys_auth_info_${userId}`;
  if (!global.waSockets[userId] && fs.existsSync(authFolder)) {
    if (global.waStatuses[userId] !== 'generating') {
      console.log(`Found auth folder for user ${userId} but no socket. Auto-reconnecting...`);
      connectToWhatsApp(userId);
    }
    return { status: 'checking', qr: null, user: null };
  }

  return {
    status: global.waStatuses[userId] || 'disconnected',
    qr: global.waQrs[userId] || null,
    user: global.waSockets[userId]?.user || null,
  };
}
