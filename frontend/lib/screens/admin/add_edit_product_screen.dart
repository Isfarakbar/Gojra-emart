import 'package:flutter/material.dart';
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

  List<dynamic> _categories = [];
  String? _selectedCategoryId;
  bool _isLoading = false;
  bool _isLoadingCategories = true;

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      _nameController.text = widget.product!['name'];
      _priceController.text = widget.product!['price'].toString();
      _descController.text = widget.product!['description'] ?? '';
      _stockController.text = widget.product!['stock'].toString();
      _imageUrlController.text = widget.product!['imageUrl'];
      final category = widget.product!['category'];
      _selectedCategoryId = category is Map ? category['_id'] : category?.toString();
    }
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    try {
      final response = await ApiService().dio.get('/categories');
      if (!mounted) return;
      setState(() {
        _categories = response.data is List ? response.data : [];
        if (_selectedCategoryId == null && _categories.isNotEmpty) {
          _selectedCategoryId = _categories.first['_id'];
        }
        _isLoadingCategories = false;
      });
    } catch (e) {
      debugPrint('Error loading categories: $e');
      if (!mounted) return;
      setState(() => _isLoadingCategories = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to load categories')),
      );
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final api = ApiService().dio;
    final data = {
      'name': _nameController.text,
      'price': double.parse(_priceController.text),
      'description': _descController.text,
      'stock': int.parse(_stockController.text),
      'imageUrl': _imageUrlController.text,
      'category': _selectedCategoryId,
    };

    try {
      if (widget.product == null) {
        await api.post('/products', data: data);
      } else {
        await api.put('/products/${widget.product!['_id']}', data: data);
      }
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      debugPrint('Error saving product: $e');
      if(mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Error saving product")));
    } finally {
       if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _descController.dispose();
    _stockController.dispose();
    _imageUrlController.dispose();
    super.dispose();
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
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _categories.any((category) => category['_id'] == _selectedCategoryId)
                    ? _selectedCategoryId
                    : null,
                decoration: const InputDecoration(labelText: "Category"),
                items: _categories.map<DropdownMenuItem<String>>((category) {
                  return DropdownMenuItem<String>(
                    value: category['_id'],
                    child: Text(category['name'] ?? 'Unnamed category'),
                  );
                }).toList(),
                onChanged: _isLoadingCategories
                    ? null
                    : (value) => setState(() => _selectedCategoryId = value),
                validator: (value) => value == null ? "Select a category" : null,
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading || _isLoadingCategories ? null : _saveProduct,
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
