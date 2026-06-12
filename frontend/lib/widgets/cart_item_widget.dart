import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import 'custom_image.dart';

class CartItemWidget extends StatelessWidget {
  final String productId;
  final int quantity;
  final String name;
  final double price;
  final String imageUrl;

  const CartItemWidget({
      super.key,
      required this.productId,
      required this.quantity,
      required this.name,
      required this.price,
      required this.imageUrl,
      });

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context, listen: false);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
            children: [
                SizedBox(
                    width: 60,
                    height: 60,
                    child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CustomImage(imageUrl: imageUrl, fit: BoxFit.cover),
                    ),
                ),
                const SizedBox(width: 16),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                            Text(name, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                             Text("Rs. $price", style: TextStyle(color: Theme.of(context).primaryColor)),
                        ],
                    ),
                ),
                Row(
                    children: [
                        IconButton(icon: const Icon(Icons.remove_circle, color: Colors.red), onPressed: () {
                            cart.removeSingleItem(productId);
                        }),
                        Text("$quantity", style: const TextStyle(fontWeight: FontWeight.bold)),
                        IconButton(icon: const Icon(Icons.add_circle, color: Colors.green), onPressed: () {
                             cart.addItem(productId, price, name, imageUrl);
                        }),
                    ],
                )
            ],
        ),
      ),
    );
  }
}
