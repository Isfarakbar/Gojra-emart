import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'dart:async';
import '../providers/product_provider.dart';
import '../screens/product_detail_screen.dart';
import '../screens/search_screen.dart';

class LiveSearchBar extends StatefulWidget {
  const LiveSearchBar({super.key});

  @override
  State<LiveSearchBar> createState() => _LiveSearchBarState();
}

class _LiveSearchBarState extends State<LiveSearchBar> with SingleTickerProviderStateMixin {
  final FocusNode _focusNode = FocusNode();
  final TextEditingController _controller = TextEditingController();
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  Timer? _debounce;
  bool _isLoading = false;
  List<Map<String, dynamic>> _suggestions = [];
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _controller.dispose();
    _debounce?.cancel();
    _animationController.dispose();
    _removeOverlay();
    super.dispose();
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      if (_controller.text.trim().length >= 2) {
        _showOverlay();
      }
    } else {
      // Delay closing slightly so InkWell on suggestion can process the tap
      Future.delayed(const Duration(milliseconds: 150), () {
        if (mounted && !_focusNode.hasFocus) {
          _hideOverlay();
        }
      });
    }
  }

  void _onSearchChanged(String text) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    if (text.trim().length < 2) {
      setState(() {
        _suggestions = [];
        _isLoading = false;
      });
      _hideOverlay();
      return;
    }

    setState(() {
      _isLoading = true;
    });
    _showOverlay();

    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final productProvider = Provider.of<ProductProvider>(context, listen: false);
      final results = await productProvider.getSearchSuggestions(text);
      if (mounted) {
        setState(() {
          _suggestions = results;
          _isLoading = false;
        });
        _overlayEntry?.markNeedsBuild();
      }
    });
  }

  void _showOverlay() {
    if (_overlayEntry == null) {
      _overlayEntry = _createOverlayEntry();
      Overlay.of(context).insert(_overlayEntry!);
      _animationController.forward();
    } else {
      _overlayEntry!.markNeedsBuild();
    }
  }

  void _hideOverlay() {
    if (_overlayEntry != null) {
      _animationController.reverse().then((_) {
        _removeOverlay();
      });
    }
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void _navigateToDetail(String productId) async {
    // Hide overlay and unfocus before navigation
    _hideOverlay();
    _focusNode.unfocus();
    
    // Show premium accent loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: Color(0xFFFF6F00))),
    );

    final productProvider = Provider.of<ProductProvider>(context, listen: false);
    final fullProduct = await productProvider.getProductById(productId);
    
    if (mounted) {
      Navigator.of(context).pop(); // Dismiss loading
      if (fullProduct != null) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: fullProduct),
          ),
        );
      }
    }
  }

  void _onSubmitted(String query) {
    _hideOverlay();
    _focusNode.unfocus();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SearchScreen(initialQuery: query),
      ),
    );
  }

  OverlayEntry _createOverlayEntry() {
    RenderBox renderBox = context.findRenderObject() as RenderBox;
    var size = renderBox.size;

    return OverlayEntry(
      builder: (context) {
        return Stack(
          children: [
            GestureDetector(
              onTap: () {
                _hideOverlay();
                _focusNode.unfocus();
              },
              behavior: HitTestBehavior.translucent,
              child: Container(),
            ),
            Positioned(
              width: size.width,
              child: CompositedTransformFollower(
                link: _layerLink,
                showWhenUnlinked: false,
                offset: Offset(0, size.height + 6),
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Material(
                    elevation: 6,
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.white,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      constraints: const BoxConstraints(maxHeight: 320),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: _buildDropdownContent(),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDropdownContent() {
    if (_isLoading) {
      return _buildShimmerLoading();
    }

    if (_suggestions.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          "No products found for '${_controller.text}'",
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: Colors.grey[600],
            decoration: TextDecoration.none,
          ),
        ),
      );
    }

    return ListView.separated(
      padding: EdgeInsets.zero,
      shrinkWrap: true,
      itemCount: _suggestions.length > 6 ? 6 : _suggestions.length,
      separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFEEEEEE)),
      itemBuilder: (context, index) {
        final suggestion = _suggestions[index];
        final String name = suggestion['name'] ?? '';
        final String query = _controller.text.trim();
        final double price = (suggestion['variants'] != null && suggestion['variants'].isNotEmpty)
            ? (suggestion['variants'][0]['price'] as num).toDouble()
            : 0.0;
        final String imageUrl = (suggestion['images'] != null && suggestion['images'].isNotEmpty)
            ? suggestion['images'][0]
            : '';

        return InkWell(
          onTap: () => _navigateToDetail(suggestion['_id']),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: imageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          width: 40,
                          height: 40,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(color: Colors.grey[100]),
                          errorWidget: (context, url, error) => Container(
                            color: Colors.grey[100],
                            child: const Icon(Icons.image, size: 20, color: Colors.grey),
                          ),
                        )
                      : Container(
                          width: 40,
                          height: 40,
                          color: Colors.grey[100],
                          child: const Icon(Icons.image, size: 20, color: Colors.grey),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: RichText(
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    text: _getHighlightedText(name, query),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  "Rs. ${price.toStringAsFixed(0)}",
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFFF6F00),
                    decoration: TextDecoration.none,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  TextSpan _getHighlightedText(String name, String query) {
    if (query.isEmpty) {
      return TextSpan(
        text: name,
        style: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.black87,
        ),
      );
    }

    final String nameLower = name.toLowerCase();
    final String queryLower = query.toLowerCase();
    final int matchIndex = nameLower.indexOf(queryLower);

    if (matchIndex == -1) {
      return TextSpan(
        text: name,
        style: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.black87,
        ),
      );
    }

    return TextSpan(
      style: GoogleFonts.poppins(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: Colors.black87,
      ),
      children: [
        TextSpan(text: name.substring(0, matchIndex)),
        TextSpan(
          text: name.substring(matchIndex, matchIndex + query.length),
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
        ),
        TextSpan(text: name.substring(matchIndex + query.length)),
      ],
    );
  }

  Widget _buildShimmerLoading() {
    return ListView.builder(
      padding: EdgeInsets.zero,
      shrinkWrap: true,
      itemCount: 3,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Shimmer.fromColors(
            baseColor: Colors.grey[200]!,
            highlightColor: Colors.grey[100]!,
            child: Row(
              children: [
                Container(width: 40, height: 40, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(width: 120, height: 12, color: Colors.white),
                      const SizedBox(height: 6),
                      Container(width: 60, height: 10, color: Colors.white),
                    ],
                  ),
                ),
                Container(width: 50, height: 14, color: Colors.white),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: AnimatedBuilder(
        animation: _focusNode,
        builder: (context, child) {
          final isFocused = _focusNode.hasFocus;
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isFocused ? const Color(0xFF2E7D32) : Colors.transparent,
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Icon(Icons.search, color: Colors.grey, size: 20),
                ),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    onChanged: _onSearchChanged,
                    onSubmitted: _onSubmitted,
                    textInputAction: TextInputAction.search,
                    decoration: const InputDecoration(
                      hintText: "Search groceries, vegetables...",
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                ),
                if (_controller.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey, size: 18),
                    onPressed: () {
                      setState(() {
                        _controller.clear();
                        _suggestions = [];
                      });
                      _hideOverlay();
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
