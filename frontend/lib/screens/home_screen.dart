import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/product_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/home_provider.dart';
import '../providers/wishlist_provider.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/product_card.dart';
import '../widgets/live_search_bar.dart';
import 'product_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final GlobalKey _exploreSectionKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ProductProvider>(context, listen: false).fetchCategories();
      Provider.of<ProductProvider>(context, listen: false).fetchProducts();
      if (Provider.of<AuthProvider>(context, listen: false).isAuthenticated) {
        Provider.of<WishlistProvider>(context, listen: false).fetchWishlist();
      }
      Provider.of<HomeProvider>(context, listen: false).fetchHomeLayout();
    });
  }

  Future<void> _refresh() async {
    final requests = <Future<void>>[
      Provider.of<ProductProvider>(context, listen: false).fetchCategories(),
      Provider.of<ProductProvider>(context, listen: false).fetchProducts(),
      Provider.of<HomeProvider>(context, listen: false).fetchHomeLayout(),
    ];
    if (Provider.of<AuthProvider>(context, listen: false).isAuthenticated) {
      requests.add(
        Provider.of<WishlistProvider>(context, listen: false).fetchWishlist(),
      );
    }
    await Future.wait(requests);
  }

  Future<void> _scrollToExplore() async {
    await Future.delayed(const Duration(milliseconds: 100));
    if (_exploreSectionKey.currentContext != null) {
      Scrollable.ensureVisible(
        _exploreSectionKey.currentContext!,
        duration: const Duration(milliseconds: 550),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  List<dynamic> _sectionProducts(ProductProvider provider, dynamic section) {
    if (section.filterType == 'featured') {
      return provider.products
          .where((product) => product['isFeatured'] == true)
          .toList();
    }
    if (section.filterType == 'category') {
      return provider.products.where((product) {
        final category = product['category'];
        return category == section.categoryId ||
            (category is Map && category['_id'] == section.categoryId);
      }).toList();
    }
    return List<dynamic>.from(provider.products);
  }

  Future<void> _handleBannerTap(
    dynamic banner,
    ProductProvider productProvider,
  ) async {
    if (banner.linkType == 'category' && banner.linkId.isNotEmpty) {
      final category = productProvider.categories.firstWhere(
        (item) => item['_id'] == banner.linkId,
        orElse: () => null,
      );
      if (category != null) {
        productProvider.filterByCategory(category['name']);
        _scrollToExplore();
      }
      return;
    }

    if (banner.linkType == 'product' && banner.linkId.isNotEmpty) {
      final product = await productProvider.getProductById(banner.linkId);
      if (!mounted || product == null) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ProductDetailScreen(product: product),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final homeProvider = Provider.of<HomeProvider>(context);
    final settings = homeProvider.settings;
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: (productProvider.isLoading || homeProvider.isLoading)
          ? const ProductSkeletonGrid()
          : RefreshIndicator(
              color: theme.colorScheme.primary,
              onRefresh: _refresh,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverAppBar(
                    pinned: true,
                    expandedHeight: 200,
                    collapsedHeight: 84,
                    toolbarHeight: 28,
                    automaticallyImplyLeading: false,
                    elevation: 0,
                    backgroundColor: theme.colorScheme.primary,
                    surfaceTintColor: theme.colorScheme.primary,
                    flexibleSpace: FlexibleSpaceBar(
                      collapseMode: CollapseMode.pin,
                      background: _HomeHeader(
                        title: settings.headerTitle,
                        subtitle: settings.headerSubtitle,
                      ),
                    ),
                    bottom: PreferredSize(
                      preferredSize: const Size.fromHeight(64),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        child: LiveSearchBar(
                          placeholder: settings.searchPlaceholder,
                        ),
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 16)),
                  if (settings.showBanners && homeProvider.banners.isNotEmpty)
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 178,
                        child: PageView.builder(
                          padEnds: false,
                          controller: PageController(viewportFraction: 0.88),
                          itemCount: homeProvider.banners.length,
                          itemBuilder: (context, index) {
                            final banner = homeProvider.banners[index];
                            return _BannerCard(
                              title: banner.title,
                              subtitle: banner.subtitle,
                              imageUrl: banner.imageUrl,
                              margin: EdgeInsets.only(
                                left: index == 0 ? 16 : 8,
                                right: 8,
                              ),
                              onTap: () =>
                                  _handleBannerTap(banner, productProvider),
                            );
                          },
                        ),
                      ),
                    ),
                  if (settings.showBanners && homeProvider.banners.isNotEmpty)
                    const SliverToBoxAdapter(child: SizedBox(height: 22)),
                  if (settings.showCategories &&
                      productProvider.categories.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: _SectionHeader(title: settings.categoryTitle),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 112,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          itemCount: productProvider.categories.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            final category = productProvider.categories[index];
                            return _CategoryTile(
                              category: category,
                              onTap: () {
                                Provider.of<ProductProvider>(
                                  context,
                                  listen: false,
                                ).filterByCategory(category['name']);
                                _scrollToExplore();
                              },
                            );
                          },
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 10)),
                  ],
                  if (settings.showDynamicSections)
                    ...homeProvider.sections.expand((section) {
                      final sectionProducts = _sectionProducts(
                        productProvider,
                        section,
                      );
                      if (sectionProducts.isEmpty) {
                        return [
                          const SliverToBoxAdapter(child: SizedBox.shrink()),
                        ];
                      }

                      return [
                        SliverToBoxAdapter(
                          child: _SectionHeader(
                            title: section.title,
                            actionLabel: 'See all',
                            onAction: () {
                              if (section.filterType == 'category') {
                                final category = productProvider.categories
                                    .firstWhere(
                                      (item) =>
                                          item['_id'] == section.categoryId,
                                      orElse: () => null,
                                    );
                                if (category != null) {
                                  productProvider.filterByCategory(
                                    category['name'],
                                  );
                                }
                              } else {
                                productProvider.filterByCategory('All');
                              }
                              _scrollToExplore();
                            },
                          ),
                        ),
                        if (section.type == 'grid')
                          SliverPadding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            sliver: SliverGrid(
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    childAspectRatio: 0.67,
                                    mainAxisSpacing: 12,
                                    crossAxisSpacing: 12,
                                  ),
                              delegate: SliverChildBuilderDelegate(
                                (context, index) => ProductCard(
                                  product: sectionProducts[index],
                                ),
                                childCount: sectionProducts.length > 6
                                    ? 6
                                    : sectionProducts.length,
                              ),
                            ),
                          )
                        else
                          SliverToBoxAdapter(
                            child: SizedBox(
                              height: 264,
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                                scrollDirection: Axis.horizontal,
                                itemCount: sectionProducts.length > 10
                                    ? 10
                                    : sectionProducts.length,
                                itemBuilder: (context, index) {
                                  return SizedBox(
                                    width: 158,
                                    child: Padding(
                                      padding: const EdgeInsets.only(
                                        right: 12,
                                        bottom: 10,
                                      ),
                                      child: ProductCard(
                                        product: sectionProducts[index],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        const SliverToBoxAdapter(child: SizedBox(height: 18)),
                      ];
                    }),
                  if (settings.showExploreProducts) ...[
                    SliverToBoxAdapter(
                      key: _exploreSectionKey,
                      child: _SectionHeader(
                        title: settings.exploreTitle,
                        actionLabel: productProvider.hasActiveFilter
                            ? 'Clear'
                            : null,
                        onAction: () => productProvider.filterByCategory('All'),
                      ),
                    ),
                    if (productProvider.errorMessage != null)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(32, 28, 32, 16),
                          child: Column(
                            children: [
                              Icon(
                                Icons.cloud_off_outlined,
                                size: 48,
                                color: Colors.grey.shade500,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                productProvider.errorMessage!,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFF7B8190),
                                ),
                              ),
                              const SizedBox(height: 14),
                              FilledButton.icon(
                                onPressed: _refresh,
                                icon: const Icon(Icons.refresh),
                                label: const Text('Try Again'),
                              ),
                            ],
                          ),
                        ),
                      )
                    else if (productProvider.filteredProducts.isEmpty)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(40),
                          child: Text(
                            'No products found',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF7B8190),
                            ),
                          ),
                        ),
                      )
                    else
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverGrid(
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.67,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                              ),
                          delegate: SliverChildBuilderDelegate(
                            (context, index) => ProductCard(
                              product: productProvider.filteredProducts[index],
                            ),
                            childCount: productProvider.filteredProducts.length,
                          ),
                        ),
                      ),
                  ],
                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              ),
            ),
    );
  }
}

class _HomeHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const _HomeHeader({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 12,
        16,
        80,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.fade,
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.86),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Consumer<AuthProvider>(
                builder: (context, auth, _) {
                  final photoUrl = (auth.user?['photoUrl'] ?? '').toString();
                  final name = (auth.user?['name'] ?? '').toString();
                  return Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.7),
                        width: 2,
                      ),
                    ),
                    child: CircleAvatar(
                      backgroundColor: Colors.white,
                      backgroundImage: photoUrl.isNotEmpty
                          ? NetworkImage(photoUrl)
                          : null,
                      child: photoUrl.isEmpty
                          ? Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'G',
                              style: GoogleFonts.poppins(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w800,
                              ),
                            )
                          : null,
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BannerCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String imageUrl;
  final EdgeInsetsGeometry margin;
  final VoidCallback onTap;

  const _BannerCard({
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.margin,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: margin,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: const Color(0xFFE8EEE7),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (imageUrl.isNotEmpty)
              Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    const ColoredBox(color: Color(0xFFE8EEE7)),
              ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.72),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (title.isNotEmpty)
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.1,
                      ),
                    ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  final dynamic category;
  final VoidCallback onTap;

  const _CategoryTile({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final name = (category['name'] ?? '').toString();
    final imageUrl = (category['image'] ?? '').toString();
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 78,
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: imageUrl.isNotEmpty
                  ? Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Icon(
                        Icons.category_rounded,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    )
                  : Icon(
                      Icons.category_rounded,
                      color: Theme.of(context).colorScheme.primary,
                    ),
            ),
            const SizedBox(height: 8),
            Text(
              name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF263238),
                height: 1.15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _SectionHeader({required this.title, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF18251B),
              ),
            ),
          ),
          if (actionLabel != null && onAction != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                foregroundColor: Theme.of(context).colorScheme.primary,
              ),
              child: Text(
                actionLabel!,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
