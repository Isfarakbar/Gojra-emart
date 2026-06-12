import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/wishlist_provider.dart';
import '../widgets/product_card.dart';
import '../widgets/empty_state.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final wishlistProvider = Provider.of<WishlistProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      appBar: AppBar(
        title: Text("My Wishlist", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.black)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: wishlistProvider.wishlist.isEmpty
          ? EmptyState(
              icon: Icons.favorite_border,
              title: "Wishlist Empty",
              subtitle: "Save your favorite products to quickly find them later.",
              buttonText: "Discover Products",
              onButtonPressed: () {
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, childAspectRatio: 0.7, crossAxisSpacing: 12, mainAxisSpacing: 12),
              itemCount: wishlistProvider.wishlist.length,
              itemBuilder: (context, index) {
                // Determine if we need to convert Product object to map or if ProductCard handles objects
                // Our ProductCard expects Map<String, dynamic> but WishlistProvider returns List<Product>.
                // We should update ProductCard or convert properly.
                // Let's quickly check ProductCard definition.
                // It takes Map<String, dynamic>. 
                // So we format the product model back to map.
                final product = wishlistProvider.wishlist[index];
                return ProductCard(product: {
                    '_id': product.id,
                    'name': product.name,
                    'price': product.price,
                    'description': product.description,
                    'imageUrl': product.imageUrl,
                    'stock': product.stock, // Assumed available
                });
              },
            ),
    );
  }
}
