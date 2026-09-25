import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// Global state to hold socket, credentials and locks across hot reloads in Next.js
declare global {
  var waSockets: Record<string, any>;
  var waQrs: Record<string, string | null>;
  var waStatuses: Record<string, string>;
  var waStores: Record<string, any>;
  var waConnectionLocks: Record<string, boolean>;
  var waReconnectCounters: Record<string, number>;
}

if (!global.waSockets) {
  global.waSockets = {};
  global.waQrs = {};
  global.waStatuses = {};
  global.waStores = {};
  global.waConnectionLocks = {};
  global.waReconnectCounters = {};
}

const logger = pino({ level: 'silent' });

const isValidCreds = (c: any) => !!(c?.me?.id || (c?.registered && c?.me));

/**
 * Backup auth credentials to a persistent secondary backup folder
 */
function backupSessionFolder(authFolder: string, backupFolder: string) {
  try {
    const credsFile = `${authFolder}/creds.json`;
    if (fs.existsSync(credsFile)) {
      const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
      if (isValidCreds(creds)) {
        if (!fs.existsSync(backupFolder)) {
          fs.mkdirSync(backupFolder, { recursive: true });
        }
        fs.cpSync(authFolder, backupFolder, { recursive: true });
      }
    }
  } catch (err) {
    console.warn("Session backup error:", err);
  }
}

/**
 * Restore credentials from backup or existing registered folders if primary is missing
 */
function restoreSessionIfAvailable(authFolder: string, backupFolder: string) {
  const primaryCreds = `${authFolder}/creds.json`;
  if (fs.existsSync(primaryCreds)) {
    try {
      const c = JSON.parse(fs.readFileSync(primaryCreds, 'utf-8'));
      if (isValidCreds(c)) return true;
    } catch {}
  }

  // 1. Check backup folder
  const backupCreds = `${backupFolder}/creds.json`;
  if (fs.existsSync(backupCreds)) {
    try {
      const c = JSON.parse(fs.readFileSync(backupCreds, 'utf-8'));
      if (isValidCreds(c)) {
        console.log(`Restoring WhatsApp credentials from backup folder ${backupFolder} to ${authFolder}...`);
        fs.cpSync(backupFolder, authFolder, { recursive: true });
        return true;
      }
    } catch {}
  }

  // 2. Scan disk for any valid registered baileys auth folders
  try {
    const cwdFiles = fs.readdirSync(process.cwd());
    const candidateFolders = cwdFiles.filter((f) => f.startsWith('baileys_auth_info') && f !== authFolder);
    for (const candidate of candidateFolders) {
      const candidateCreds = `${candidate}/creds.json`;
      if (fs.existsSync(candidateCreds)) {
        try {
          const cData = JSON.parse(fs.readFileSync(candidateCreds, 'utf-8'));
          if (isValidCreds(cData)) {
            console.log(`Found registered session in ${candidate}. Adopting into ${authFolder}...`);
            fs.cpSync(candidate, authFolder, { recursive: true });
            return true;
          }
        } catch {}
      }
    }
  } catch (scanErr) {
    console.warn("Error scanning candidate sessions:", scanErr);
  }

  return false;
}

export async function connectToWhatsApp(userId: string) {
  if (!userId) return;

  // 1. If an active socket with authenticated user already exists, don't recreate
  if (global.waSockets[userId]?.user) {
    global.waStatuses[userId] = 'connected';
    return;
  }

  // 2. Mutex Lock: Prevent concurrent connecting attempts that trigger multi-device conflicts
  if (global.waConnectionLocks[userId]) {
    console.log(`Connection attempt already in-flight for user ${userId}. Skipping duplicate.`);
    return;
  }
  global.waConnectionLocks[userId] = true;

  const authFolder = `baileys_auth_info_${userId}`;
  const backupFolder = `baileys_auth_info_backup_${userId}`;
  const storeFile = `baileys_store_${userId}.json`;

  try {
    // Restore session if available
    restoreSessionIfAvailable(authFolder, backupFolder);

    let state, saveCreds;
    try {
      const authResult = await useMultiFileAuthState(authFolder);
      state = authResult.state;
      saveCreds = authResult.saveCreds;
    } catch (err) {
      console.error("Failed to load auth state, attempting recovery...", err);
      restoreSessionIfAvailable(authFolder, backupFolder);
      const authResult = await useMultiFileAuthState(authFolder);
      state = authResult.state;
      saveCreds = authResult.saveCreds;
    }

    // Initialize custom lightweight store
    if (!global.waStores[userId]) {
      global.waStores[userId] = { chats: {}, messages: {} };
    }

    // Load store from disk
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

    // Periodic store flush (every 20s)
    const storeInterval = setInterval(() => {
      try {
        if (global.waStores[userId]) {
          fs.writeFileSync(storeFile, JSON.stringify(global.waStores[userId]));
        }
      } catch (e) {
        console.error("Failed to write store to file", e);
      }
    }, 20_000);

    // Create Baileys Socket with resilient config
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: ['ChatFlyr CRM', 'Chrome', '124.0.0.0'],
      syncFullHistory: false,
      connectTimeoutMs: 90000,
      defaultQueryTimeoutMs: 90000,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 2000,
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: true,
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
        const jid = msg.key?.remoteJid;
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
        console.log(`Connection closed for user ${userId}. StatusCode: ${statusCode}`);

        delete global.waSockets[userId];

        // Backup creds on close to preserve latest keys
        backupSessionFolder(authFolder, backupFolder);

        // Auto-reconnect with intelligent backoff
        global.waReconnectCounters[userId] = (global.waReconnectCounters[userId] || 0) + 1;
        const retryCount = global.waReconnectCounters[userId];
        const delay = statusCode === DisconnectReason.restartRequired ? 1500 : Math.min(15000, 2000 * retryCount);

        global.waStatuses[userId] = 'reconnecting';
        console.log(`Scheduling auto-reconnect for user ${userId} in ${delay}ms (Attempt #${retryCount})...`);

        setTimeout(() => {
          if (!global.waSockets[userId] && !global.waConnectionLocks[userId]) {
            connectToWhatsApp(userId);
          }
        }, delay);

      } else if (connection === 'open') {
        console.log(`WhatsApp Coexistence connected successfully for user ${userId}!`);
        global.waStatuses[userId] = 'connected';
        global.waQrs[userId] = null;
        global.waConnectionLocks[userId] = false;
        global.waReconnectCounters[userId] = 0;

        // Create fresh backup of confirmed active session
        backupSessionFolder(authFolder, backupFolder);

      } else if (connection === 'connecting') {
        if (global.waStatuses[userId] !== 'waiting_scan') {
          global.waStatuses[userId] = 'connecting';
        }
      }
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      backupSessionFolder(authFolder, backupFolder);
    });

  } catch (error) {
    console.error("Error in connectToWhatsApp:", error);
    global.waStatuses[userId] = 'disconnected';
    global.waQrs[userId] = null;
    global.waConnectionLocks[userId] = false;
    delete global.waSockets[userId];
  } finally {
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
  const backupFolder = `baileys_auth_info_backup_${userId}`;

  // Check if registered credentials exist
  const isRegistered = restoreSessionIfAvailable(authFolder, backupFolder);

  // 1. If active socket with authenticated user exists, return connected
  if (sock && sock.user) {
    global.waStatuses[userId] = 'connected';
    return {
      status: 'connected',
      qr: null,
      user: sock.user,
    };
  }

  // 2. If socket is currently waiting for QR scan
  const currentStatus = global.waStatuses[userId];
  if (currentStatus === 'waiting_scan' && global.waQrs[userId]) {
    return {
      status: 'waiting_scan',
      qr: global.waQrs[userId],
      user: null,
    };
  }

  // 3. If credentials exist and user is registered, auto-connect in background & report active/connecting
  if (isRegistered) {
    if (!sock && !global.waConnectionLocks[userId]) {
      console.log(`getStatus: Valid session exists on disk for user ${userId}. Proactively connecting...`);
      connectToWhatsApp(userId);
    }
    return {
      status: currentStatus === 'connecting' || currentStatus === 'reconnecting' ? 'connecting' : 'connected',
      qr: null,
      user: sock?.user || { id: userId, name: 'WhatsApp User' },
    };
  }

  // 4. If currently generating or connecting
  if (currentStatus === 'connecting' || currentStatus === 'generating' || currentStatus === 'reconnecting') {
    return {
      status: currentStatus,
      qr: global.waQrs[userId] || null,
      user: null,
    };
  }

  return {
    status: currentStatus || 'disconnected',
    qr: global.waQrs[userId] || null,
    user: null,
  };
}
