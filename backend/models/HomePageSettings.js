const mongoose = require('mongoose');

const homePageSettingsSchema = new mongoose.Schema({
    headerTitle: { type: String, default: 'Fresh groceries delivered fast' },
    headerSubtitle: { type: String, default: 'Shop daily essentials, produce, dairy, snacks, and household items.' },
    searchPlaceholder: { type: String, default: 'Search rice, milk, vegetables...' },
    categoryTitle: { type: String, default: 'Shop by Category' },
    exploreTitle: { type: String, default: 'Explore Products' },
    showBanners: { type: Boolean, default: true },
    showCategories: { type: Boolean, default: true },
    showDynamicSections: { type: Boolean, default: true },
    showExploreProducts: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('HomePageSettings', homePageSettingsSchema);
