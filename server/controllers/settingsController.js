const { getSettings } = require('../models/appSettingsModel');

const getSortMode = async (req, res, next) => {
    try {
        const settings = await getSettings();
        res.json({ sortMode: settings.sortMode });
    } catch (err) {
        next(err);
    }
};

const setSortMode = async (req, res, next) => {
    try {
        const { sortMode } = req.body;
        if (!['recent', 'random'].includes(sortMode)) {
            return res.status(400).json({ message: 'Invalid sortMode. Use "recent" or "random".' });
        }
        const settings = await getSettings();
        settings.sortMode = sortMode;
        await settings.save();
        res.json({ sortMode: settings.sortMode });
    } catch (err) {
        next(err);
    }
};

const setAdminPlayerIDs = async (req, res, next) => {
    try {
        console.log('[SettingsController] setAdminPlayerIDs called');
        const { playerIDs } = req.body;
        console.log('[SettingsController] PlayerIDs to save:', playerIDs);
        if (!Array.isArray(playerIDs)) {
            return res.status(400).json({ message: 'playerIDs must be an array' });
        }
        const settings = await getSettings();
        settings.adminPlayerIDs = playerIDs;
        await settings.save();
        console.log('[SettingsController] Admin playerIDs saved:', settings.adminPlayerIDs);
        res.json({ adminPlayerIDs: settings.adminPlayerIDs });
    } catch (err) {
        console.log('[SettingsController] Error:', err.message);
        next(err);
    }
};

const getAdminPlayerIDs = async (req, res, next) => {
    try {
        console.log('[SettingsController] getAdminPlayerIDs called');
        const settings = await getSettings();
        console.log('[SettingsController] Current admin playerIDs:', settings.adminPlayerIDs);
        res.json({ adminPlayerIDs: settings.adminPlayerIDs || [] });
    } catch (err) {
        console.log('[SettingsController] Error:', err.message);
        next(err);
    }
};

module.exports = { getSortMode, setSortMode, setAdminPlayerIDs, getAdminPlayerIDs };
