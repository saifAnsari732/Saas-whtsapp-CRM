import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// Global state to hold the socket and QR across hot reloads in Next.js dev
declare global {
  var waSockets: Record<string, any>;
  var waQrs: Record<string, string | null>;
  var waStatuses: Record<string, string>;
}

if (!global.waSockets) {
  global.waSockets = {};
  global.waQrs = {};
  global.waStatuses = {};
}

const logger = pino({ level: 'silent' });

export async function connectToWhatsApp(userId: string) {
  if (!userId) return;

  const authFolder = `baileys_auth_info_${userId}`;
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  if (global.waSockets[userId]) {
    console.log(`Baileys socket already exists for user ${userId}, returning it.`);
    return;
  }

  global.waStatuses[userId] = 'generating';
  global.waQrs[userId] = null;

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
  });

  global.waSockets[userId] = sock;

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`New QR code received for user ${userId}`);
      global.waQrs[userId] = qr;
      global.waStatuses[userId] = 'waiting_scan';
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Connection closed for user ${userId} due to `, lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      global.waStatuses[userId] = 'disconnected';
      delete global.waSockets[userId];
      
      if (shouldReconnect) {
        connectToWhatsApp(userId);
      } else {
        // Logged out, clean up auth folder
        if (fs.existsSync(authFolder)) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
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
