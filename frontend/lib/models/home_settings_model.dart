class HomeSettings {
  final String headerTitle;
  final String headerSubtitle;
  final String searchPlaceholder;
  final String categoryTitle;
  final String exploreTitle;
  final bool showBanners;
  final bool showCategories;
  final bool showDynamicSections;
  final bool showExploreProducts;

  const HomeSettings({
    required this.headerTitle,
    required this.headerSubtitle,
    required this.searchPlaceholder,
    required this.categoryTitle,
    required this.exploreTitle,
    required this.showBanners,
    required this.showCategories,
    required this.showDynamicSections,
    required this.showExploreProducts,
  });

  factory HomeSettings.fromJson(Map<String, dynamic>? json) {
    final data = json ?? {};
    return HomeSettings(
      headerTitle: data['headerTitle'] ?? 'Fresh groceries delivered fast',
      headerSubtitle:
          data['headerSubtitle'] ??
          'Shop daily essentials, produce, dairy, snacks, and household items.',
      searchPlaceholder:
          data['searchPlaceholder'] ?? 'Search rice, milk, vegetables...',
      categoryTitle: data['categoryTitle'] ?? 'Shop by Category',
      exploreTitle: data['exploreTitle'] ?? 'Explore Products',
      showBanners: data['showBanners'] ?? true,
      showCategories: data['showCategories'] ?? true,
      showDynamicSections: data['showDynamicSections'] ?? true,
      showExploreProducts: data['showExploreProducts'] ?? true,
    );
  }

  static const defaults = HomeSettings(
    headerTitle: 'Fresh groceries delivered fast',
    headerSubtitle:
        'Shop daily essentials, produce, dairy, snacks, and household items.',
    searchPlaceholder: 'Search rice, milk, vegetables...',
    categoryTitle: 'Shop by Category',
    exploreTitle: 'Explore Products',
    showBanners: true,
    showCategories: true,
    showDynamicSections: true,
    showExploreProducts: true,
  );
}
