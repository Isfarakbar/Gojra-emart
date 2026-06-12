import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';

class AddEditProductScreen extends StatefulWidget {
  final Map<String, dynamic>? product;
  const AddEditProductScreen({super.key, this.product});

  @override
  State<AddEditProductScreen> createState() => _AddEditProductScreenState();
}

class _AddEditProductScreenState extends State<AddEditProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _descController = TextEditingController();
  final _stockController = TextEditingController();
  final _imageUrlController = TextEditingController();
  final _categoryController = TextEditingController(); // Ideally a dropdown
  
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      _nameController.text = widget.product!['name'];
      _priceController.text = widget.product!['price'].toString();
      _descController.text = widget.product!['description'] ?? '';
      _stockController.text = widget.product!['stock'].toString();
      _imageUrlController.text = widget.product!['imageUrl'];
      // _categoryController.text = widget.product!['category']['_id'];
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final api = ApiService().dio;
    final data = {
      'name': _nameController.text,
      'price': double.parse(_priceController.text),
      'description': _descController.text,
      'stock': int.parse(_stockController.text),
      'image': _imageUrlController.text, // Use uploaded URL here
      'category': "60d0fe4f5311236168a109ca", // Placeholder Category ID, need to fetch
    };

    try {
      if (widget.product == null) {
        await api.post('/products', data: data);
      } else {
        await api.put('/products/${widget.product!['_id']}', data: data);
      }
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      print(e);
      if(mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Error saving product")));
    } finally {
       setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.product == null ? "Add Product" : "Edit Product")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: "Name"), validator: (v) => v!.isEmpty ? "Enter name" : null),
              TextFormField(controller: _priceController, decoration: const InputDecoration(labelText: "Price"), keyboardType: TextInputType.number),
              TextFormField(controller: _descController, decoration: const InputDecoration(labelText: "Description")),
              TextFormField(controller: _stockController, decoration: const InputDecoration(labelText: "Stock"), keyboardType: TextInputType.number),
              TextFormField(controller: _imageUrlController, decoration: const InputDecoration(labelText: "Image URL")),
              const SizedBox(height: 20),
              // Image Picker Button here
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProduct,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text("Save Product"),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
