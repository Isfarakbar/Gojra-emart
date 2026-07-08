const StoreSettings = require('../models/StoreSettings');

const getOrCreateSettings = async () => {
    let settings = await StoreSettings.findOne();

    if (!settings) {
        settings = await StoreSettings.create({});
    }

    return settings;
};

// @desc    Get public store settings
// @route   GET /api/settings/store
// @access  Public
const getStoreSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update store settings
// @route   PUT /api/settings/store
// @access  Private/Admin
const updateStoreSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        const allowedFields = [
            'storeName',
            'isStoreOpen',
            'closedMessage',
            'minimumOrderAmount',
            'deliveryFee',
            'freeDeliveryAbove',
            'estimatedDeliveryMinutes',
            'supportPhone',
            'supportEmail',
            'supportWhatsapp',
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                settings[field] = req.body[field];
            }
        }

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOrCreateSettings,
    getStoreSettings,
    updateStoreSettings,
};
