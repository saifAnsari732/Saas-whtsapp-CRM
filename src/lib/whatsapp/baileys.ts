import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

// Global state to hold the socket and QR across hot reloads in Next.js dev
declare global {
  var waSocket: any;
  var waQr: string | null;
  var waStatus: string;
}

if (!global.waStatus) {
  global.waStatus = 'disconnected';
  global.waQr = null;
}

const logger = pino({ level: 'silent' });

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  if (global.waSocket) {
    console.log("Baileys socket already exists, returning it.");
    return;
  }

  global.waStatus = 'generating';
  global.waQr = null;

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
  });

  global.waSocket = sock;

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('New QR code received');
      global.waQr = qr;
      global.waStatus = 'waiting_scan';
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      global.waStatus = 'disconnected';
      global.waSocket = null;
      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        // Logged out, clean up auth folder
        if (fs.existsSync('baileys_auth_info')) {
          fs.rmSync('baileys_auth_info', { recursive: true, force: true });
        }
      }
    } else if (connection === 'open') {
      console.log('Opened connection to WhatsApp');
      global.waStatus = 'connected';
      global.waQr = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

export function getStatus() {
  return {
    status: global.waStatus,
    qr: global.waQr,
  };
}
