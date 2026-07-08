import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/cart_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  final Map<String, dynamic> product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;
  Map<String, dynamic>? _selectedVariant;
  late double _currentPrice;

  @override
  void initState() {
    super.initState();
    // Default to first variant if available, otherwise base price
    final variants = widget.product['variants'] as List<dynamic>?;
    if (variants != null && variants.isNotEmpty) {
      _selectedVariant = variants[0];
      _currentPrice = (_selectedVariant!['price'] as num).toDouble();
    } else {
      _currentPrice = (widget.product['price'] as num).toDouble();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: theme.colorScheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: widget.product['_id'],
                child: Image.network(
                  widget.product['imageUrl'],
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(color: Colors.grey[200], child: const Icon(Icons.broken_image, size: 50, color: Colors.grey)),
                ),
              ),
            ),
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.9),
                child: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          widget.product['name'],
                          style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Text(
                        "Rs. ${widget.product['price']}",
                        style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(color: theme.colorScheme.secondary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                        child: Text("In Stock", style: TextStyle(color: theme.colorScheme.secondary, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 10),
                      Icon(Icons.star, color: Colors.amber, size: 20),
                      const Text(" 4.5 (200 reviews)", style: TextStyle(fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text("Description", style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    widget.product['description'],
                    style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[700], height: 1.5),
                  ),
                  const SizedBox(height: 20),
                  
                  // Variants Dropdown
                  if (widget.product['variants'] != null && (widget.product['variants'] as List).isNotEmpty) ...[
                    Text("Select Option", style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey[50], 
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[200]!)
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<Map<String, dynamic>>(
                          isExpanded: true,
                          value: _selectedVariant,
                          items: (widget.product['variants'] as List).map((v) {
                            return DropdownMenuItem<Map<String, dynamic>>(
                              value: v,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(v['unit'] as String, style: const TextStyle(fontWeight: FontWeight.w500)),
                                  Text("Rs. ${v['price']}", style: const TextStyle(color: Colors.grey)),
                                ],
                              ),
                            );
                          }).toList(),
                          onChanged: (value) {
                             if (value != null) {
                               setState(() {
                                 _selectedVariant = value;
                                 _currentPrice = (value['price'] as num).toDouble();
                               });
                             }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  const SizedBox(height: 30),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Quantity", style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove),
                              onPressed: () {
                                if (_quantity > 1) setState(() => _quantity--);
                              },
                            ),
                            Text("$_quantity", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.add),
                              onPressed: () {
                                setState(() => _quantity++);
                              },
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 100), // Spacing for bottom button
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))],
        ),
        child: SizedBox(
          width: double.infinity,
          height: 55,
          child: ElevatedButton(
              onPressed: () {
                Provider.of<CartProvider>(context, listen: false).addToCart(widget.product, _quantity, selectedVariant: _selectedVariant);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text("${widget.product['name']} added to cart"),
                    backgroundColor: theme.colorScheme.primary,
                    behavior: SnackBarBehavior.floating,
                  )
                );
                Navigator.of(context).pop(); // Go back to previous screen
              },
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: Text("Add to Cart - Rs. ${_currentPrice * _quantity}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }
}
