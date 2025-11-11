/**
 * Bot Service - Enhanced with Pairing Code
 * Copyright © 2025 DarkSide Developers
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const { Bot } = require('../database/models');

const activeSockets = new Map();
const pairingCodes = new Map(); // Store active pairing codes
const SESSION_BASE_PATH = './sessions';

// Ensure session directory exists
if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

// Generate 8-digit pairing code
const generatePairingCode = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Create bot session with pairing code
const createBotSessionWithPairing = async (botId, phoneNumber) => {
    try {
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${botId}`);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        
        const logger = pino({ level: 'silent' });
        
        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS('Safari')
        });

        // Store socket reference
        activeSockets.set(botId, socket);

        // Handle connection updates
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'open') {
                console.log(`✅ Bot ${botId} connected successfully`);
                
                // Clear pairing code on successful connection
                pairingCodes.delete(botId);
                
                // Emit real-time update
                global.io.emit('bot_status_update', {
                    botId: botId,
                    status: 'connected'
                });
            } else if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                
                if (shouldReconnect) {
                    console.log(`🔄 Bot ${botId} disconnected, attempting to reconnect...`);
                    setTimeout(() => createBotSessionWithPairing(botId, phoneNumber), 5000);
                } else {
                    pairingCodes.delete(botId);
                    activeSockets.delete(botId);
                }
            }
        });

        // Handle credentials update
        socket.ev.on('creds.update', saveCreds);

        // Generate and store pairing code
        if (!socket.authState.creds.registered) {
            const pairingCode = generatePairingCode();
            pairingCodes.set(botId, {
                code: pairingCode,
                socket: socket,
                phoneNumber: phoneNumber,
                createdAt: Date.now()
            });

            // Set timeout to clear expired codes (10 minutes)
            setTimeout(() => {
                if (pairingCodes.has(botId)) {
                    pairingCodes.delete(botId);
                    console.log(`⌛ Pairing code expired for bot ${botId}`);
                }
            }, 10 * 60 * 1000);

            return pairingCode;
        }

        return null;
    } catch (error) {
        console.error('Create bot session error:', error);
        throw error;
    }
};

// Verify pairing code
const verifyPairingCode = async (botId, code) => {
    try {
        const pairingData = pairingCodes.get(botId);
        
        if (!pairingData) {
            return { success: false, message: 'Pairing code expired or invalid' };
        }

        if (pairingData.code !== code) {
            return { success: false, message: 'Invalid pairing code' };
        }

        // Code is valid - request pairing
        try {
            await pairingData.socket.requestPairingCode(pairingData.phoneNumber.replace('+', ''));
            return { success: true, message: 'Pairing successful' };
        } catch (error) {
            return { success: false, message: 'Pairing failed: ' + error.message };
        }

    } catch (error) {
        console.error('Verify pairing code error:', error);
        return { success: false, message: 'Verification failed' };
    }
};

// Get active pairing code
const getPairingCode = (botId) => {
    return pairingCodes.get(botId);
};

// Get connected bots
const getConnectedBots = () => {
    const connected = [];
    activeSockets.forEach((socket, botId) => {
        if (socket.user) {
            connected.push({
                botId,
                user: socket.user,
                connectedAt: new Date()
            });
        }
    });
    return connected;
};

module.exports = {
    createBotSessionWithPairing,
    verifyPairingCode,
    getPairingCode,
    getConnectedBots,
    getBotStatus: async (botId) => {
        const socket = activeSockets.get(botId);
        return {
            status: socket ? 'connected' : 'disconnected',
            online: !!socket,
            user: socket?.user,
            lastSeen: new Date()
        };
    }
};
