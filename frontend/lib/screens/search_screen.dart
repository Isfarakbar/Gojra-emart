import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/product_provider.dart';
import '../widgets/product_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/skeleton_loader.dart';
import 'dart:async';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      Provider.of<ProductProvider>(context, listen: false).searchProductsApi(query);
    });
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: TextField(
          controller: _searchController,
          onChanged: _onSearchChanged,
          autofocus: true,
          decoration: InputDecoration(
            hintText: "Search products...",
            border: InputBorder.none,
            hintStyle: GoogleFonts.inter(color: Colors.grey),
          ),
          style: GoogleFonts.inter(color: Colors.black, fontSize: 16),
        ),
        actions: [
          if (_searchController.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear, color: Colors.grey),
              onPressed: () {
                _searchController.clear();
                productProvider.searchProductsApi('');
              },
            )
        ],
      ),
      body: productProvider.isSearching
          ? const ProductSkeletonGrid()
          : _searchController.text.isEmpty
              ? EmptyState(
                  icon: Icons.search,
                  title: "Search Products",
                  subtitle: "Type above to search across all our categories.",
                )
              : productProvider.searchResults.isEmpty
                  ? const EmptyState(
                      icon: Icons.search_off,
                      title: "No Results",
                      subtitle: "We couldn't find any products matching your query.",
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2, childAspectRatio: 0.7, crossAxisSpacing: 12, mainAxisSpacing: 12),
                      itemCount: productProvider.searchResults.length,
                      itemBuilder: (context, index) {
                        return ProductCard(product: productProvider.searchResults[index]);
                      },
                    ),
    );
  }
}
