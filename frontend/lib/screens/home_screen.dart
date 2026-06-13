import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/product_provider.dart';
import '../providers/auth_provider.dart'; 
import '../providers/home_provider.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/product_card.dart';
import '../providers/wishlist_provider.dart';
import 'search_screen.dart';

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
      Provider.of<WishlistProvider>(context, listen: false).fetchWishlist();
      Provider.of<HomeProvider>(context, listen: false).fetchHomeLayout();
    });
  }

  Future<void> _refresh() async {
      await Future.wait([
        Provider.of<ProductProvider>(context, listen: false).fetchProducts(),
        Provider.of<HomeProvider>(context, listen: false).fetchHomeLayout(),
      ]);
  }

  Future<void> _scrollToExplore() async {
    // Wait for the UI to rebuild with filtered products
    await Future.delayed(const Duration(milliseconds: 100));
    if (_exploreSectionKey.currentContext != null) {
      Scrollable.ensureVisible(
        _exploreSectionKey.currentContext!, 
        duration: const Duration(milliseconds: 600), 
        curve: Curves.easeInOutCubic
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final homeProvider = Provider.of<HomeProvider>(context);
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: (productProvider.isLoading || homeProvider.isLoading)
          ? const ProductSkeletonGrid()
          : RefreshIndicator(
              onRefresh: _refresh,
              child: CustomScrollView(
                slivers: [
                  // Sticky Search Bar & Title
                  SliverAppBar(
                    pinned: true,
                    floating: true,
                    backgroundColor: theme.colorScheme.primary,
                    expandedHeight: 120.0,
                    automaticallyImplyLeading: false,
                    elevation: 0,
                    actions: [
                      Consumer<AuthProvider>(
                        builder: (context, auth, _) {
                          final photoUrl = (auth.user?['photoUrl'] ?? '').toString();
                          final name = (auth.user?['name'] ?? '').toString();
                          return Padding(
                            padding: const EdgeInsets.only(right: 14, top: 8),
                            child: CircleAvatar(
                              radius: 18,
                              backgroundColor: Colors.white,
                              backgroundImage: photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
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
                    flexibleSpace: FlexibleSpaceBar(
                      background: Container(color: theme.colorScheme.primary),
                      title: SizedBox(
                        height: 45,
                        child: GestureDetector(
                          onTap: () {
                             Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SearchScreen()));
                          },
                          child: Container(
                             margin: const EdgeInsets.symmetric(horizontal: 16),
                             padding: const EdgeInsets.symmetric(horizontal: 12),
                             decoration: BoxDecoration(
                               color: Colors.white,
                               borderRadius: BorderRadius.circular(12),
                             ),
                             child: Row(
                               children: [
                                 Icon(Icons.search, color: Colors.grey[400], size: 20),
                                 const SizedBox(width: 8),
                                 Expanded(
                                   child: Text(
                                     "Search 5000+ products", 
                                     style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 12),
                                     overflow: TextOverflow.ellipsis,
                                   ),
                                 ),
                               ],
                             ),
                          ),
                        ),
                      ),
                      centerTitle: true,
                      titlePadding: const EdgeInsets.only(bottom: 16),
                    ),
                  ),

                  // Dynamic Banners
                  if (homeProvider.banners.isNotEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 20, bottom: 20),
                      child: SizedBox(
                        height: 180,
                        child: PageView.builder(
                          controller: PageController(viewportFraction: 0.9),
                          itemCount: homeProvider.banners.length,
                          itemBuilder: (context, index) {
                            final banner = homeProvider.banners[index];
                             return Container(
                               margin: const EdgeInsets.symmetric(horizontal: 8),
                               decoration: BoxDecoration(
                                 borderRadius: BorderRadius.circular(24),
                                 image: DecorationImage(
                                   image: NetworkImage(banner.imageUrl),
                                   fit: BoxFit.cover,
                                 ),
                                 boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 6))],
                               ),
                               child: Container(
                                 decoration: BoxDecoration(
                                   borderRadius: BorderRadius.circular(24),
                                   gradient: LinearGradient(
                                     begin: Alignment.topCenter,
                                     end: Alignment.bottomCenter,
                                     colors: [Colors.transparent, Colors.black.withOpacity(0.7)]
                                   )
                                 ),
                                 padding: const EdgeInsets.all(24),
                                 child: Column(
                                   crossAxisAlignment: CrossAxisAlignment.start,
                                   mainAxisAlignment: MainAxisAlignment.end,
                                   children: [
                                     if(banner.title.isNotEmpty)
                                     Text(banner.title, style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20, height: 1.1)),
                                     if(banner.subtitle.isNotEmpty)
                                     Text(banner.subtitle, style: GoogleFonts.inter(color: Colors.white.withOpacity(0.9), fontSize: 13)),
                                   ],
                                 ),
                               ),
                             );
                          },
                        ),
                      ),
                    ),
                  ),

                  // Categories Grid
                   SliverToBoxAdapter(
                     child: Padding(
                       padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                       child: Text("Shop by Category", style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                     ),
                   ),
                   SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4, // Compact 4-column grid
                        childAspectRatio: 0.75, // Adjust for icon + text height
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                           final cat = productProvider.categories[index];
                           return _buildCategoryItem(context, cat);
                        },
                        childCount: productProvider.categories.length,
                      ),
                    ),
                   ),
                   
                   const SliverToBoxAdapter(child: SizedBox(height: 10)),

                  // Dynamic Sections
                  ...homeProvider.sections.expand((section) {
                      // Filter Products based on Section Config
                      List<dynamic> sectionProducts = [];
                      if (section.filterType == 'latest') {
                        sectionProducts = List.from(productProvider.products); 
                      } else if (section.filterType == 'featured') {
                        sectionProducts = productProvider.products.where((p) => p['isFeatured'] == true).toList();
                      } else if (section.filterType == 'category') {
                        sectionProducts = productProvider.products.where((p) => p ['category'] == section.categoryId || (p['category'] is Map && p['category']['_id'] == section.categoryId)).toList();
                      }

                      if (sectionProducts.isEmpty) return [const SliverToBoxAdapter(child: SizedBox.shrink())];

                      // Header Widget
                      final headerSliver = SliverToBoxAdapter(
                        child: Padding(
                           padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                           child: Row(
                             children: [
                               Text(section.title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                               const Spacer(),
                               Text("See All", style: GoogleFonts.inter(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
                             ],
                           ),
                         ),
                      );

                      if (section.type == 'grid') {
                        // Grid View
                        return [
                          headerSliver,
                          SliverPadding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            sliver: SliverGrid(
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.7,
                                mainAxisSpacing: 10,
                                crossAxisSpacing: 10,
                              ),
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  return ProductCard(product: sectionProducts[index]);
                                },
                                childCount: sectionProducts.length,
                              ),
                            ),
                          ),
                          const SliverToBoxAdapter(child: SizedBox(height: 20)),
                        ];
                      } else {
                        // Horizontal List
                        return [
                         headerSliver,
                         SliverToBoxAdapter(
                            child: SizedBox(
                              height: 260,
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                scrollDirection: Axis.horizontal,
                                itemCount: sectionProducts.length,
                                itemBuilder: (context, index) {
                                  return SizedBox(
                                    width: 160,
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 16, bottom: 10),
                                      child: ProductCard(product: sectionProducts[index]),
                                    ),
                                  );
                                },
                              ),
                             ),
                          )
                        ];
                      }
                  }),

                  const SliverToBoxAdapter(child: SizedBox(height: 20)),
                  
                  // Interactive Browse Section (Title)
                  SliverToBoxAdapter(
                     key: _exploreSectionKey,
                     child: Padding(
                       padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                       child: Column(
                         children: [
                            const Divider(),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Text("Explore Products", style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                                const Spacer(),
                                if (productProvider.isSearching || productProvider.filteredProducts.length != productProvider.products.length)
                                GestureDetector(
                                  onTap: () {
                                     Provider.of<ProductProvider>(context, listen: false).filterByCategory("All");
                                  },
                                  child: Text("Clear Filter", style: GoogleFonts.inter(color: Colors.red, fontWeight: FontWeight.w600)),
                                )
                              ],
                            ),
                         ],
                       ),
                     ),
                  ),

                  // Interactive Browse Grid
                  if (productProvider.filteredProducts.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(40.0),
                        child: Center(child: Text("No products found", style: GoogleFonts.inter(color: Colors.grey))),
                      ),
                    )
                  else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.7,
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          return ProductCard(product: productProvider.filteredProducts[index]);
                        },
                        childCount: productProvider.filteredProducts.length,
                      ),
                    ),
                  ),

                  const SliverToBoxAdapter(child: SizedBox(height: 100)), // Bottom Padding
                ],
              ),
            ),
    );
  }

  Widget _buildCategoryItem(BuildContext context, dynamic category) {
    // category is a Map
    final String name = category['name'];
    final String? imageUrl = category['image'];

    return GestureDetector(
      onTap: () {
        Provider.of<ProductProvider>(context, listen: false).filterByCategory(name);
        _scrollToExplore();
      },
      child: Container(
        width: 70,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          children: [
            Container(
              height: 55,
              width: 55,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16), // Smaller squircle
                boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 4, offset: const Offset(0, 2))],
                image: imageUrl != null && imageUrl.isNotEmpty 
                    ? DecorationImage(image: NetworkImage(imageUrl), fit: BoxFit.cover)
                    : null,
              ),
              child: imageUrl == null || imageUrl.isEmpty 
                  ? Icon(Icons.category, color: Theme.of(context).primaryColor, size: 24) 
                  : null,
            ),
            const SizedBox(height: 6),
            Text(
              name, 
              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey[800]), 
              textAlign: TextAlign.center, 
              maxLines: 2, // Allow 2 lines for longer names
              overflow: TextOverflow.ellipsis
            ),
          ],
        ),
      ),
    );
  }
}
