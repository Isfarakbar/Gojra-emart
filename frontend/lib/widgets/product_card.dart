import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import 'custom_image.dart';
import '../screens/product_detail_screen.dart';
import '../utils/helpers.dart';

class ProductCard extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductCard({super.key, required this.product});

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleAddToCart() {
    // Play bounce animation
    _controller.forward().then((_) {
      _controller.reverse();
    });

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    // Add item to cart
    cartProvider.addToCart(widget.product, 1);
    Helpers.showSnackBar(context, '${widget.product['name']} added to cart');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final wishlistProvider = Provider.of<WishlistProvider>(context);
    final isWishlisted = wishlistProvider.isInWishlist(widget.product['_id']);

    final price = widget.product['price'] ?? 0;
    final oldPrice = widget.product['oldPrice'];
    final inStock = widget.product['inStock'] ?? true;
    final imageUrl = widget.product['imageUrl'] ?? '';
    final isFeatured = widget.product['isFeatured'] == true;

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: widget.product),
          ),
        );
      },
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) =>
            Transform.scale(scale: _scaleAnimation.value, child: child),
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image (Strict 1:1 Aspect Ratio)
              AspectRatio(
                aspectRatio: 1.0,
                child: Stack(
                  children: [
                    Hero(
                      tag: widget.product['_id'],
                      child: CustomImage(
                        imageUrl: imageUrl,
                        width: double.infinity,
                        height: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    // Discount Badge
                    if (oldPrice != null && oldPrice > price)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            "${(((oldPrice - price) / oldPrice) * 100).round()}% OFF",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    // Featured Badge
                    if (isFeatured)
                      Positioned(
                        top: (oldPrice != null && oldPrice > price) ? 30 : 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.secondary,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            "Featured",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    // Wishlist Icon
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: () {
                          wishlistProvider.toggleWishlist(
                            widget.product['_id'],
                          );
                          Helpers.showSnackBar(
                            context,
                            isWishlisted
                                ? 'Removed from wishlist'
                                : 'Added to wishlist',
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isWishlisted
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: isWishlisted ? Colors.red : Colors.grey,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.product['name'] ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (oldPrice != null && oldPrice > price)
                                  Text(
                                    Helpers.formatCurrency(oldPrice),
                                    style: TextStyle(
                                      decoration: TextDecoration.lineThrough,
                                      color: Colors.grey[500],
                                      fontSize: 12,
                                    ),
                                  ),
                                Text(
                                  Helpers.formatCurrency(price),
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: inStock ? _handleAddToCart : null,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: inStock
                                    ? theme.colorScheme.primary
                                    : Colors.grey[300],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                Icons.add_shopping_cart,
                                color: inStock
                                    ? Colors.white
                                    : Colors.grey[500],
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
