import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// Global state to hold the socket and QR across hot reloads in Next.js dev
declare global {
  var waSockets: Record<string, any>;
  var waQrs: Record<string, string | null>;
  var waStatuses: Record<string, string>;
  var waStores: Record<string, any>;
  var waConnectionLocks: Record<string, boolean>;
}

if (!global.waSockets) {
  global.waSockets = {};
  global.waQrs = {};
  global.waStatuses = {};
  global.waStores = {};
  global.waConnectionLocks = {};
}

const logger = pino({ level: 'silent' });

export async function connectToWhatsApp(userId: string) {
  if (!userId) return;

  // 1. If an active socket with authenticated user already exists, don't recreate
  if (global.waSockets[userId]?.user) {
    global.waStatuses[userId] = 'connected';
    return;
  }

  // 2. Mutex Lock: Prevent concurrent connecting attempts that trigger 440/conflict disconnect loops
  if (global.waConnectionLocks[userId]) {
    console.log(`Connection attempt already in-flight for user ${userId}. Ignoring duplicate.`);
    return;
  }
  global.waConnectionLocks[userId] = true;

  try {
    const authFolder = `baileys_auth_info_${userId}`;
    const storeFile = `baileys_store_${userId}.json`;
    
    // Automatically adopt registered session from any existing folder on disk if current authFolder is empty
    if (!fs.existsSync(`${authFolder}/creds.json`)) {
      try {
        const cwdFiles = fs.readdirSync(process.cwd());
        const candidateFolders = cwdFiles.filter((f) => f.startsWith('baileys_auth_info') && f !== authFolder);
        for (const candidate of candidateFolders) {
          const candidateCreds = `${candidate}/creds.json`;
          if (fs.existsSync(candidateCreds)) {
            try {
              const cData = JSON.parse(fs.readFileSync(candidateCreds, 'utf-8'));
              if (cData?.me?.id || (cData?.registered && cData?.me)) {
                console.log(`Found registered session in ${candidate}. Adopting into ${authFolder}...`);
                fs.cpSync(candidate, authFolder, { recursive: true });
                break;
              }
            } catch {}
          }
        }
      } catch (scanErr) {
        console.warn("Failed scanning for candidate sessions:", scanErr);
      }
    }
    
    let state, saveCreds;
    try {
      const authResult = await useMultiFileAuthState(authFolder);
      state = authResult.state;
      saveCreds = authResult.saveCreds;
    } catch (err) {
      console.error("Failed to load auth state, retrying fresh...", err);
      if (fs.existsSync(authFolder)) {
        try { fs.rmSync(authFolder, { recursive: true, force: true }); } catch (e) {}
      }
      const authResult = await useMultiFileAuthState(authFolder);
      state = authResult.state;
      saveCreds = authResult.saveCreds;
    }

    // Initialize custom lightweight store
    if (!global.waStores[userId]) {
      global.waStores[userId] = { chats: {}, messages: {} };
    }

    // Try to load existing store from disk
    if (fs.existsSync(storeFile)) {
      try {
        const diskData = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
        if (diskData?.chats) {
          global.waStores[userId].chats = { ...global.waStores[userId].chats, ...diskData.chats };
        }
      } catch (e) {
        console.error("Failed to read store file", e);
      }
    }

    // Save store periodically (every 15s)
    const storeInterval = setInterval(() => {
      try {
        if (global.waStores[userId]) {
          fs.writeFileSync(storeFile, JSON.stringify(global.waStores[userId]));
        }
      } catch (e) {
        console.error("Failed to write store to file", e);
      }
    }, 15_000);

    // Create Baileys Socket with standard stable Chrome/Ubuntu browser signature
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      retryRequestDelayMs: 3000,
      generateHighQualityLinkPreview: true,
    });

    global.waSockets[userId] = sock;

    // Custom Store Event Listeners
    sock.ev.on('messaging-history.set', (data) => {
      if (!global.waStores[userId]) global.waStores[userId] = { chats: {}, messages: {} };
      if (!global.waStores[userId].chats) global.waStores[userId].chats = {};

      for (const chat of data.chats) {
        if (chat.id) {
          global.waStores[userId].chats[chat.id] = {
            ...global.waStores[userId].chats[chat.id],
            ...chat,
            type: chat.id.endsWith('@g.us') ? 'group' : 'direct',
          };
        }
      }
      if (!global.waStores[userId].messages) {
        global.waStores[userId].messages = {};
      }
      for (const msg of data.messages || []) {
        const jid = msg.key.remoteJid;
        if (jid) {
          if (!global.waStores[userId].messages[jid]) {
            global.waStores[userId].messages[jid] = [];
          }
          global.waStores[userId].messages[jid].push(msg);
        }
      }
    });

    sock.ev.on('chats.upsert', (chats) => {
      if (!global.waStores[userId]) global.waStores[userId] = { chats: {}, messages: {} };
      if (!global.waStores[userId].chats) global.waStores[userId].chats = {};

      for (const chat of chats) {
        if (chat.id) {
          global.waStores[userId].chats[chat.id] = {
            ...global.waStores[userId].chats[chat.id],
            ...chat,
            type: chat.id.endsWith('@g.us') ? 'group' : 'direct',
          };
        }
      }
    });

    sock.ev.on('chats.update', (chats) => {
      if (!global.waStores[userId]) global.waStores[userId] = { chats: {}, messages: {} };
      if (!global.waStores[userId].chats) global.waStores[userId].chats = {};

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

    sock.ev.on('contacts.upsert', (contacts) => {
      if (!global.waStores[userId]) global.waStores[userId] = { chats: {}, messages: {} };
      if (!global.waStores[userId].chats) global.waStores[userId].chats = {};

      for (const contact of contacts) {
        if (contact.id && (contact.id.endsWith('@s.whatsapp.net') || contact.id.endsWith('@g.us'))) {
          const existing = global.waStores[userId].chats[contact.id] || {};
          const name = contact.notify || contact.name || contact.verifiedName || existing.name;
          global.waStores[userId].chats[contact.id] = {
            ...existing,
            id: contact.id,
            name: name || contact.id.split('@')[0],
            type: contact.id.endsWith('@g.us') ? 'group' : 'direct',
            conversationTimestamp: existing.conversationTimestamp || Math.floor(Date.now() / 1000),
          };
        }
      }
    });

    sock.ev.on('contacts.update', (contacts) => {
      if (!global.waStores[userId]?.chats) return;
      for (const contact of contacts) {
        if (contact.id && global.waStores[userId].chats[contact.id]) {
          const name = contact.notify || contact.name || contact.verifiedName;
          if (name) {
            global.waStores[userId].chats[contact.id].name = name;
          }
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages || []) {
        const jid = msg.key?.remoteJid;
        if (jid && (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us'))) {
          if (!global.waStores[userId]) global.waStores[userId] = { chats: {}, messages: {} };
          if (!global.waStores[userId].chats) global.waStores[userId].chats = {};

          const existing = global.waStores[userId].chats[jid] || {};
          const pushName = msg.pushName;
          const ts = typeof msg.messageTimestamp === 'number' 
            ? msg.messageTimestamp 
            : typeof msg.messageTimestamp === 'object' && msg.messageTimestamp && 'low' in msg.messageTimestamp 
              ? (msg.messageTimestamp as any).low 
              : Math.floor(Date.now() / 1000);

          global.waStores[userId].chats[jid] = {
            ...existing,
            id: jid,
            name: existing.name || pushName || jid.split('@')[0],
            conversationTimestamp: Math.max(existing.conversationTimestamp || 0, ts),
            unreadCount: (existing.unreadCount || 0) + (msg.key?.fromMe ? 0 : 1),
            type: jid.endsWith('@g.us') ? 'group' : 'direct',
          };

          if (!global.waStores[userId].messages) global.waStores[userId].messages = {};
          if (!global.waStores[userId].messages[jid]) global.waStores[userId].messages[jid] = [];
          global.waStores[userId].messages[jid].push(msg);

          // Auto-Reply Chatbot Processor (Triggered for incoming direct customer messages)
          if (!msg.key?.fromMe && jid.endsWith('@s.whatsapp.net')) {
            const rawText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (rawText.trim()) {
              (async () => {
                try {
                  const { processIncomingMessage } = await import('@/lib/chatbot/processor');
                  const result = await processIncomingMessage({
                    accountId: userId,
                    userId: userId,
                    senderJid: jid,
                    messageText: rawText,
                    senderName: pushName || undefined,
                  });

                  if (result.shouldReply && result.replyText) {
                    if (result.delayMs > 0) {
                      await new Promise((resolve) => setTimeout(resolve, result.delayMs));
                    }
                    await sock.sendMessage(jid, { text: result.replyText });
                    console.log(`[Auto-Reply Chatbot] Dispatched to ${jid} (${result.source}): "${result.replyText.substring(0, 40)}..."`);
                  }
                } catch (botErr) {
                  console.error('[Auto-Reply Chatbot] Error generating reply:', botErr);
                }
              })();
            }
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
        global.waConnectionLocks[userId] = false;

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        console.log(`Connection closed for user ${userId}. StatusCode: ${statusCode}, isLoggedOut: ${isLoggedOut}`);

        delete global.waSockets[userId];

        if (!isLoggedOut) {
          // Restart required or network hiccup: schedule reconnect with debounce
          global.waStatuses[userId] = 'reconnecting';
          const delay = statusCode === DisconnectReason.restartRequired ? 2000 : 5000;
          setTimeout(() => {
            if (!global.waSockets[userId] && !global.waConnectionLocks[userId]) {
              connectToWhatsApp(userId);
            }
          }, delay);
        } else {
          // Explicit logout from mobile WhatsApp app
          console.log(`Explicit logout detected for user ${userId}`);
          global.waStatuses[userId] = 'disconnected';
          global.waQrs[userId] = null;
          if (fs.existsSync(authFolder)) {
            try { fs.rmSync(authFolder, { recursive: true, force: true }); } catch (e) {}
          }
          if (fs.existsSync(storeFile)) {
            try { fs.rmSync(storeFile, { force: true }); } catch (e) {}
          }
          delete global.waStores[userId];
        }
      } else if (connection === 'open') {
        console.log(`Opened connection to WhatsApp for user ${userId}`);
        global.waStatuses[userId] = 'connected';
        global.waQrs[userId] = null;
        global.waConnectionLocks[userId] = false;
      } else if (connection === 'connecting') {
        if (global.waStatuses[userId] !== 'waiting_scan') {
          global.waStatuses[userId] = 'connecting';
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error("Critical error in connectToWhatsApp:", error);
    global.waStatuses[userId] = 'disconnected';
    global.waQrs[userId] = null;
    global.waConnectionLocks[userId] = false;
    delete global.waSockets[userId];
  } finally {
    // Release connection lock after 5 seconds if not closed
    setTimeout(() => {
      global.waConnectionLocks[userId] = false;
    }, 5000);
  }
}

export function getStatus(userId: string) {
  if (!userId) {
    return { status: 'disconnected', qr: null, user: null };
  }

  const sock = global.waSockets?.[userId] || Object.values(global.waSockets || {})[0];
  const authFolder = `baileys_auth_info_${userId}`;
  const credsFile = `${authFolder}/creds.json`;
  const legacyCredsFile = `baileys_auth_info/creds.json`;
  
  const isValidCreds = (c: any) => !!(c?.me?.id || (c?.registered && c?.me));

  // Check if valid credentials exist for current user
  let isRegistered = false;
  if (fs.existsSync(credsFile)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
      isRegistered = isValidCreds(creds);
    } catch {}
  }
  if (!isRegistered && fs.existsSync(legacyCredsFile)) {
    try {
      const creds = JSON.parse(fs.readFileSync(legacyCredsFile, 'utf-8'));
      if (isValidCreds(creds)) {
        isRegistered = true;
        try { fs.cpSync('baileys_auth_info', authFolder, { recursive: true }); } catch {}
      }
    } catch {}
  }
  if (!isRegistered) {
    try {
      const cwdFiles = fs.readdirSync(process.cwd());
      const candidateFolders = cwdFiles.filter((f) => f.startsWith('baileys_auth_info') && f !== authFolder);
      for (const candidate of candidateFolders) {
        const candidateCreds = `${candidate}/creds.json`;
        if (fs.existsSync(candidateCreds)) {
          try {
            const cData = JSON.parse(fs.readFileSync(candidateCreds, 'utf-8'));
            if (isValidCreds(cData)) {
              console.log(`getStatus: Found registered session in ${candidate}. Auto-adopting to ${authFolder}...`);
              fs.cpSync(candidate, authFolder, { recursive: true });
              isRegistered = true;
              break;
            }
          } catch {}
        }
      }
    } catch {}
  }

  // 1. If active socket with authenticated user exists, it is definitively connected
  if (sock && sock.user) {
    global.waStatuses[userId] = 'connected';
    return {
      status: 'connected',
      qr: null,
      user: sock.user,
    };
  }

  // 2. If socket is currently connecting or generating QR
  const currentStatus = global.waStatuses[userId];
  if (currentStatus === 'connecting' || currentStatus === 'generating' || currentStatus === 'reconnecting') {
    return {
      status: currentStatus,
      qr: global.waQrs[userId] || null,
      user: null,
    };
  }

  // 3. If credentials exist and user is registered, auto-reconnect if not already running
  if (isRegistered && !sock && !global.waConnectionLocks[userId]) {
    console.log(`Found registered credentials for user ${userId}. Reconnecting in background...`);
    connectToWhatsApp(userId);
    return {
      status: 'connecting',
      qr: null,
      user: null,
    };
  }

  return {
    status: currentStatus || 'disconnected',
    qr: global.waQrs[userId] || null,
    user: null,
  };
}
