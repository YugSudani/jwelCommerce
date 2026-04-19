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
        const { playerIDs } = req.body;
        if (!Array.isArray(playerIDs)) {
            return res.status(400).json({ message: 'playerIDs must be an array' });
        }
        const settings = await getSettings();
        settings.adminPlayerIDs = playerIDs;
        await settings.save();
        res.json({ adminPlayerIDs: settings.adminPlayerIDs });
    } catch (err) {
        next(err);
    }
};

const getAdminPlayerIDs = async (req, res, next) => {
    try {
        const settings = await getSettings();
        res.json({ adminPlayerIDs: settings.adminPlayerIDs || [] });
    } catch (err) {
        next(err);
    }
};

module.exports = { getSortMode, setSortMode, setAdminPlayerIDs, getAdminPlayerIDs };
