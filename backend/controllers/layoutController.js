const Banner = require('../models/Banner');
const HomeSection = require('../models/HomeSection');
const HomePageSettings = require('../models/HomePageSettings');

const getOrCreateSettings = async () => {
    let settings = await HomePageSettings.findOne();
    if (!settings) {
        settings = await HomePageSettings.create({});
    }
    return settings;
};

// @desc    Get Home Page Config (Public)
// @route   GET /api/layout/home
// @access  Public
const getHomeLayout = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        const sections = await HomeSection.find({ isActive: true }).sort({ order: 1 });
        res.json({ settings, banners, sections });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getHomeSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateHomeSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        const allowedFields = [
            'headerTitle',
            'headerSubtitle',
            'searchPlaceholder',
            'categoryTitle',
            'exploreTitle',
            'showBanners',
            'showCategories',
            'showDynamicSections',
            'showExploreProducts',
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

// @desc    Update Banner
// @route   POST /api/layout/banners
// @access  Admin
const createBanner = async (req, res) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json(banner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBanners = async (req, res) => {
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
};

const deleteBanner = async (req, res) => {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner removed' });
};

const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }
        res.json(banner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manage Sections
// @route   POST /api/layout/sections
const createSection = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.categoryId) delete payload.categoryId; // Prevent CastError
        const section = await HomeSection.create(payload);
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSections = async (req, res) => {
    const sections = await HomeSection.find().sort({ order: 1 });
    res.json(sections);
};

const deleteSection = async (req, res) => {
    await HomeSection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section removed' });
};

const updateSection = async (req, res) => {
    try {
        const payload = { ...req.body };
        const update = { $set: payload };
        if (!payload.categoryId) {
            delete update.$set.categoryId;
            update.$unset = { categoryId: 1 };
        }
        const section = await HomeSection.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }
        res.json(section);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getHomeLayout,
    getHomeSettings,
    updateHomeSettings,
    createBanner,
    getBanners,
    updateBanner,
    deleteBanner,
    createSection,
    getSections,
    updateSection,
    deleteSection
};
