const StoreSettings = require('../models/StoreSettings');

const defaultDeliverySlots = [
    { label: 'Morning', startTime: '09:00', endTime: '12:00', isActive: true, orderLimit: 0 },
    { label: 'Afternoon', startTime: '12:00', endTime: '15:00', isActive: true, orderLimit: 0 },
    { label: 'Evening', startTime: '15:00', endTime: '18:00', isActive: true, orderLimit: 0 },
];

const normalizeDeliverySlots = (slots = []) => {
    if (!Array.isArray(slots)) return [];

    return slots
        .map(slot => ({
            label: String(slot.label || '').trim(),
            startTime: String(slot.startTime || '').trim(),
            endTime: String(slot.endTime || '').trim(),
            isActive: slot.isActive !== false,
            orderLimit: Math.max(Number(slot.orderLimit) || 0, 0),
        }))
        .filter(slot => slot.label && slot.startTime && slot.endTime)
        .slice(0, 12);
};

const getOrCreateSettings = async () => {
    let settings = await StoreSettings.findOne();

    if (!settings) {
        settings = await StoreSettings.create({ deliverySlots: defaultDeliverySlots });
    } else if (!settings.deliverySlots || settings.deliverySlots.length === 0) {
        settings.deliverySlots = defaultDeliverySlots;
        await settings.save();
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
            'enableDeliverySlots',
            'deliveryDaysAhead',
            'minimumSlotLeadMinutes',
            'deliverySlots',
            'supportPhone',
            'supportEmail',
            'supportWhatsapp',
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                settings[field] = field === 'deliverySlots'
                    ? normalizeDeliverySlots(req.body[field])
                    : req.body[field];
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
