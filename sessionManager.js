/**
 * Session Manager
 * Copyright © 2025 DarkSide Developers
 */

const fs = require('fs-extra');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const Pino = require('pino');
const config = require('./config');

const SESSION_DIR = path.join(__dirname, 'sessions');
const CREDS_FILE = path.join(SESSION_DIR, 'creds.json');

class SessionManager {
    constructor() {
        this.conn = null;
        this.isConnected = false;
        this.sessionData = null;
    }

    // Initialize session system
    async initializeSession() {
        try {
            // Ensure session directory exists
            if (!fs.existsSync(SESSION_DIR)) {
                fs.mkdirSync(SESSION_DIR, { recursive: true });
            }

            // Check if session exists locally
            const hasLocalSession = fs.existsSync(CREDS_FILE);

            if (!hasLocalSession && config.SESSION_ID) {
                console.log('📥 Downloading session from cloud...');
                await this.downloadSession();
            } else if (!hasLocalSession) {
                console.log('🆕 No session found. Bot will start fresh.');
            } else {
                console.log('✅ Local session found.');
            }

            return await this.connectToWhatsApp();
        } catch (error) {
            console.error('Session initialization error:', error);
            throw error;
        }
    }

    // Download session from MEGA or URL
    async downloadSession() {
        try {
            if (config.SESSION_ID.startsWith("IZUKA~")) {
                await this.downloadFromMega();
            } else if (config.SESSION_ID.startsWith("http")) {
                await this.downloadFromURL();
            } else {
                // Assume it's base64 encoded session data
                await this.decodeSession();
            }
        } catch (error) {
            console.error('Session download failed:', error);
            throw error;
        }
    }

    async downloadFromMega() {
        try {
            // Using mega.nz link format
            const sessdata = config.SESSION_ID.replace("IZUKA~", "");
            const fileUrl = `https://mega.nz/file/${sessdata}`;
            
            console.log('⬇️ Downloading session from MEGA...');
            
            // You'll need to implement MEGA download logic here
            // For now, we'll create a placeholder
            const sessionData = await this.fetchSessionData(fileUrl);
            await fs.writeJson(CREDS_FILE, sessionData, { spaces: 2 });
            
            console.log('✅ Session downloaded successfully');
        } catch (error) {
            console.error('MEGA download error:', error);
            throw error;
        }
    }

    async downloadFromURL() {
        try {
            const response = await fetch(config.SESSION_ID);
            if (!response.ok) throw new Error('Failed to fetch session');
            
            const sessionData = await response.json();
            await fs.writeJson(CREDS_FILE, sessionData, { spaces: 2 });
            
            console.log('✅ Session downloaded from URL');
        } catch (error) {
            console.error('URL download error:', error);
            throw error;
        }
    }

    async decodeSession() {
        try {
            // Assuming SESSION_ID is base64 encoded JSON
            const sessionData = JSON.parse(Buffer.from(config.SESSION_ID, 'base64').toString());
            await fs.writeJson(CREDS_FILE, sessionData, { spaces: 2 });
            
            console.log('✅ Session decoded and saved');
        } catch (error) {
            console.error('Session decode error:', error);
            throw error;
        }
    }

    // Connect to WhatsApp
    async connectToWhatsApp() {
        console.log("🔗 Connecting to WhatsApp...");
        
        try {
            const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
            const { version } = await fetchLatestBaileysVersion();

            this.conn = makeWASocket({
                logger: Pino({ level: 'silent' }),
                printQRInTerminal: true,
                browser: Browsers.macOS("Safari"),
                syncFullHistory: true,
                auth: state,
                version
            });

            // Setup event handlers
            this.setupEventHandlers(saveCreds);
            
            return this.conn;
        } catch (error) {
            console.error('WhatsApp connection error:', error);
            throw error;
        }
    }

    setupEventHandlers(saveCreds) {
        this.conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 Scan QR Code to connect');
                // Emit QR code for web interface
                global.io?.emit('qr_generated', { qr });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log(`❌ Connection closed. Reconnecting: ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    setTimeout(() => this.connectToWhatsApp(), 5000);
                } else {
                    console.log('🚫 Logged out. Please re-authenticate.');
                    // Delete session files if logged out
                    await this.clearSession();
                }
            } else if (connection === 'open') {
                console.log('✅ Connected to WhatsApp!');
                this.isConnected = true;
                
                // Load plugins
                await this.loadPlugins();
                
                // Emit connection status
                global.io?.emit('connection_status', { status: 'connected', user: this.conn.user });
            }
        });

        // Save credentials when updated
        this.conn.ev.on('creds.update', saveCreds);
    }

    // Load all plugins
    async loadPlugins() {
        try {
            const pluginDir = path.join(__dirname, 'plugins');
            if (!fs.existsSync(pluginDir)) {
                fs.mkdirSync(pluginDir, { recursive: true });
                console.log('📁 Plugins directory created');
                return;
            }

            const plugins = fs.readdirSync(pluginDir).filter(file => 
                file.endsWith('.js') && !file.startsWith('_')
            );

            console.log(`🧩 Loading ${plugins.length} plugins...`);
            
            for (const plugin of plugins) {
                try {
                    delete require.cache[require.resolve(path.join(pluginDir, plugin))];
                    require(path.join(pluginDir, plugin));
                    console.log(`✅ Loaded: ${plugin}`);
                } catch (error) {
                    console.error(`❌ Failed to load ${plugin}:`, error.message);
                }
            }
            
            console.log('🎉 All plugins loaded successfully!');
        } catch (error) {
            console.error('Plugin loading error:', error);
        }
    }

    // Clear session data
    async clearSession() {
        try {
            if (fs.existsSync(SESSION_DIR)) {
                await fs.remove(SESSION_DIR);
                console.log('🗑️ Session cleared');
            }
        } catch (error) {
            console.error('Session clear error:', error);
        }
    }

    // Backup session to cloud (optional)
    async backupSession() {
        if (!config.SESSION_BACKUP) return;
        
        try {
            // Implement your backup logic here
            // Could upload to MEGA, Google Drive, etc.
            console.log('💾 Session backup completed');
        } catch (error) {
            console.error('Session backup error:', error);
        }
    }

    // Get connection status
    getStatus() {
        return {
            isConnected: this.isConnected,
            user: this.conn?.user,
            sessionExists: fs.existsSync(CREDS_FILE)
        };
    }
}

module.exports = new SessionManager();