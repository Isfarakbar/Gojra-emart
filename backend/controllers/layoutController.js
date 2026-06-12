const Banner = require('../models/Banner');
const HomeSection = require('../models/HomeSection');

// @desc    Get Home Page Config (Public)
// @route   GET /api/layout/home
// @access  Public
const getHomeLayout = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        const sections = await HomeSection.find({ isActive: true }).sort({ order: 1 });
        res.json({ banners, sections });
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

module.exports = {
    getHomeLayout,
    createBanner,
    getBanners,
    deleteBanner,
    createSection,
    getSections,
    deleteSection
};
