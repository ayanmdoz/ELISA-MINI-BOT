/**
 * QUEEN-MINI Configuration
 * Copyright © 2025 DarkSide Developers
 * Owner: DarkWinzo
 * GitHub: https://github.com/DarkWinzo
 */

module.exports = {
    // SESSION CONFIGURATION
    SESSION_ID: process.env.SESSION_ID || "IZUKA~aIwknC7B#Av_3Mi-hqT_RbE2oIeUV_4fMqbNZYG3Jw0xfESwJ60Y",
    SESSION_TYPE: process.env.SESSION_TYPE || "local", // local, mega, url
    
    // MEGA.NZ CONFIG (opcional)
    MEGA_EMAIL: process.env.MEGA_EMAIL || "salimoafonso76@gmail.com",
    MEGA_PASSWORD: process.env.MEGA_PASSWORD || "djsalass1&2#",
    
    // SESSION MANAGEMENT
    AUTO_DOWNLOAD_SESSION: true,
    SESSION_BACKUP: true,
    // Application Settings
    APP_NAME: 'QUEEN-MINI',
    APP_VERSION: '2.0.0',
    APP_DESCRIPTION: 'Advanced WhatsApp Bot Management System',
    
    // Server Configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Database Configuration
    DATABASE_URL: "local", // Change to PostgreSQL URL for cloud database
    
    // JWT Configuration
    JWT_SECRET: 'queen-mini-jwt-secret-key-2025-darkside-developers',
    JWT_EXPIRES_IN: '7d',
    
    // Email Configuration (Nodemailer)
    EMAIL_HOST: 'smtp.gmail.com',
    EMAIL_PORT: 587,
    EMAIL_USER: 'ayanmodz503@gmail.com',
    EMAIL_PASS: 'djsalass',
    EMAIL_FROM: 'QUEEN-MINI <noreply@queen-mini.com>',
    
    // WhatsApp Bot Configuration
    BOT_NAME: 'QUEEN-MINI',
    BOT_VERSION: '2.0.0',
    BOT_FOOTER: '© 2025 DarkSide Developers',
    PREFIX: '.',
    
    // Admin Configuration
    ADMIN_EMAIL: 'admin@queen-mini.com',
    ADMIN_PASSWORD: 'admin123', // Change this in production
    
    // Rate Limiting
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: 100, // requests per window
    
    // File Upload
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    UPLOAD_PATH: './uploads',
    
    // Bot Settings
    AUTO_VIEW_STATUS: true,
    AUTO_LIKE_STATUS: true,
    AUTO_RECORDING: true,
    AUTO_LIKE_EMOJI: ['🧩', '🍉', '💜', '🌸', '🪴', '💊', '💫', '🍂', '🌟', '🎋'],
    MAX_RETRIES: 3,
    
    // GitHub Integration (Optional)
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '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',
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER || 'https://github.com/ayanmdoz',
    GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME || 'https://github.com/ayanmdoz/QUEEN-ELISA',
    
    // Copyright Information
    COPYRIGHT: {
        COMPANY: 'DarkSide Developers',
        OWNER: 'DarkWinzo',
        GITHUB: 'https://github.com/DarkWinzo',
        YEAR: new Date().getFullYear()
    }
};