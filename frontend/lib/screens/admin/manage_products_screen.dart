import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/product_provider.dart';
import 'add_edit_product_screen.dart';

class ManageProductsScreen extends StatefulWidget {
  const ManageProductsScreen({super.key});

  @override
  State<ManageProductsScreen> createState() => _ManageProductsScreenState();
}

class _ManageProductsScreenState extends State<ManageProductsScreen> {
  @override
  void initState() {
    super.initState();
     WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ProductProvider>(context, listen: false).fetchProducts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("Manage Products")),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AddEditProductScreen()));
        },
        child: const Icon(Icons.add),
      ),
      body: ListView.builder(
        itemCount: productProvider.products.length,
        itemBuilder: (ctx, i) {
          final product = productProvider.products[i];
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              leading: Container(
                width: 50, 
                height: 50, 
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  image: DecorationImage(image: NetworkImage(product['imageUrl']), fit: BoxFit.cover),
                ),
              ),
              title: Text(product['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("Rs. ${product['price']}"),
              trailing: IconButton(
                icon: const Icon(Icons.delete, color: Colors.redAccent),
                onPressed: () {
                   showDialog(
                     context: context,
                     builder: (ctx) => AlertDialog(
                       title: const Text("Delete Product"),
                       content: const Text("Are you sure you want to delete this product?"),
                       actions: [
                         TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text("Cancel")),
                         TextButton(
                           onPressed: () {
                             Provider.of<ProductProvider>(context, listen: false).deleteProduct(product['_id']);
                             Navigator.of(ctx).pop();
                           }, 
                           child: const Text("Delete", style: TextStyle(color: Colors.red))
                         ),
                       ],
                     )
                   );
                },
              ),
              onTap: () {
                // Edit logic
                 Navigator.of(context).push(MaterialPageRoute(builder: (_) => AddEditProductScreen(product: product)));
              },
            ),
          );
        },
      ),
    );
  }
}
