// routes/session.js
const express = require('express');
const router = express.Router();
const sessionManager = require('../sessionManager');

// Get session status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        data: sessionManager.getStatus()
    });
});

// Restart connection
router.post('/restart', async (req, res) => {
    try {
        await sessionManager.clearSession();
        await sessionManager.initializeSession();
        
        res.json({
            success: true,
            message: 'Session restarted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Clear session
router.delete('/clear', async (req, res) => {
    try {
        await sessionManager.clearSession();
        
        res.json({
            success: true,
            message: 'Session cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;