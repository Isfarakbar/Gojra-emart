import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/cart_provider.dart';
import '../widgets/cart_item_widget.dart';
import 'checkout_screen.dart';
import 'login_screen.dart';
import '../providers/auth_provider.dart';
import '../widgets/empty_state.dart';
import '../utils/helpers.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          "My Cart",
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: true,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          Expanded(
            child: cart.items.isEmpty
                ? EmptyState(
                    icon: Icons.shopping_cart_outlined,
                    title: "Your Cart is Empty",
                    subtitle: "Looks like you haven't added anything yet.",
                    buttonText: "Start Shopping",
                    onButtonPressed: () {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cart.items.length,
                    itemBuilder: (ctx, i) {
                      final item = cart.items.values.toList()[i];
                      final productId = cart.items.keys.toList()[i];
                      return CartItemWidget(
                        productId: productId,
                        quantity: item.quantity,
                        name: item.title,
                        price: item.price,
                        imageUrl: item.image,
                      );
                    },
                  ),
          ),
          if (cart.items.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Total Amount",
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        Helpers.formatCurrency(cart.totalAmount),
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: () {
                        // Check if user is logged in
                        final auth = Provider.of<AuthProvider>(
                          context,
                          listen: false,
                        );
                        if (auth.token == null || auth.token!.isEmpty) {
                          // Not logged in -> Go to Login
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text("Please login to checkout"),
                              backgroundColor: theme.colorScheme.secondary,
                            ),
                          );
                          // We might want to pass a flag to return to cart, or handle pop
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const LoginScreen(),
                            ),
                          ); // LoginScreen should ideally handle "redirect" but simple push is okay for now
                        } else {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const CheckoutScreen(),
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        "Checkout",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
