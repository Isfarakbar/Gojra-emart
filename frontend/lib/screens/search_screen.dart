import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/product_provider.dart';
import '../widgets/product_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/skeleton_loader.dart';
import 'dart:async';

class SearchScreen extends StatefulWidget {
  final String? initialQuery;
  const SearchScreen({super.key, this.initialQuery});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null) {
      _searchController.text = widget.initialQuery!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Provider.of<ProductProvider>(context, listen: false)
            .searchProductsApi(widget.initialQuery!);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      Provider.of<ProductProvider>(context, listen: false).searchProductsApi(query);
    });
  }

  Future<void> _handleRefresh() async {
    await Provider.of<ProductProvider>(context, listen: false)
        .searchProductsApi(_searchController.text);
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: _searchFocusNode.hasFocus ? const Color(0xFF2E7D32) : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Icon(Icons.search, color: Colors.grey, size: 20),
              ),
              Expanded(
                child: TextField(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  onChanged: _onSearchChanged,
                  decoration: const InputDecoration(
                    hintText: "Search groceries, vegetables...",
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 10),
                  ),
                  style: GoogleFonts.poppins(color: Colors.black87, fontSize: 14),
                ),
              ),
              if (_searchController.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear, color: Colors.grey, size: 18),
                  onPressed: () {
                    setState(() {
                      _searchController.clear();
                    });
                    productProvider.searchProductsApi('');
                  },
                )
            ],
          ),
        ),
        titleSpacing: 0,
        actions: const [SizedBox(width: 16)],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_searchController.text.isNotEmpty &&
              !productProvider.isSearching &&
              productProvider.searchResults.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
              child: Text(
                "${productProvider.searchResults.length} results for '${_searchController.text}'",
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
            ),
          Expanded(
            child: productProvider.isSearching
                ? const Padding(
                    padding: EdgeInsets.all(16),
                    child: ProductSkeletonGrid(),
                  )
                : _searchController.text.isEmpty
                    ? EmptyState(
                        icon: Icons.search,
                        title: "Search Products",
                        subtitle: "Search across all our premium grocery categories.",
                      )
                    : productProvider.searchResults.isEmpty
                        ? EmptyState(
                            icon: Icons.search_off,
                            title: "No Results",
                            subtitle: "Try a different keyword",
                          )
                        : RefreshIndicator(
                            onRefresh: _handleRefresh,
                            color: const Color(0xFF2E7D32),
                            child: GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.72,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                              itemCount: productProvider.searchResults.length,
                              itemBuilder: (context, index) {
                                return ProductCard(product: productProvider.searchResults[index]);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
