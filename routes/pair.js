/**
 * Pairing Routes
 * Copyright © 2025 DarkSide Developers
 */

const express = require('express');
const { createBotSessionWithPairing, verifyPairingCode, getConnectedBots } = require('../services/botService');
const { Bot } = require('../database/models');

const router = express.Router();

// Generate pairing code for bot
router.post('/generate', async (req, res) => {
    try {
        const { botId, phoneNumber } = req.body;

        if (!botId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bot ID and phone number are required'
            });
        }

        // Validate phone number format
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        const pairingCode = await createBotSessionWithPairing(botId, `+${cleanNumber}`);

        res.json({
            success: true,
            data: {
                botId,
                pairingCode,
                instructions: 'Use this 8-digit code in WhatsApp > Linked Devices > Link a Device',
                expiresIn: '10 minutes'
            }
        });
    } catch (error) {
        console.error('Generate pairing code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate pairing code'
        });
    }
});

// Verify pairing code
router.post('/verify', async (req, res) => {
    try {
        const { botId, code } = req.body;

        if (!botId || !code) {
            return res.status(400).json({
                success: false,
                message: 'Bot ID and code are required'
            });
        }

        // Validate code format (8 digits)
        if (!/^\d{8}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code format. Must be 8 digits.'
            });
        }

        const result = await verifyPairingCode(botId, code);

        if (result.success) {
            res.json({
                success: true,
                message: '✅ Bot connected successfully!'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Verify pairing error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

// Get connected bots
router.get('/connected', async (req, res) => {
    try {
        const connectedBots = getConnectedBots();
        
        res.json({
            success: true,
            data: {
                total: connectedBots.length,
                bots: connectedBots
            }
        });
    } catch (error) {
        console.error('Get connected bots error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch connected bots'
        });
    }
});

// Get bot status
router.get('/status/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const status = await getBotStatus(botId);
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Get bot status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get bot status'
        });
    }
});

module.exports = router;
