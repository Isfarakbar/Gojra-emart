import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProductProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<dynamic> get products => _products;
  List<dynamic> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchProducts() async {
    _isLoading = true;
    _errorMessage = null; // Reset error
    notifyListeners();
    try {
      final response = await _apiService.dio.get('/products');
      _products = response.data;
    } catch (e) {
      _errorMessage = "Failed to load products. Check connection.";
      print("Error fetching products: $e");
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchCategories() async {
    try {
      final response = await _apiService.dio.get('/categories');
      _categories = response.data;
      notifyListeners();
    } catch (e) {
      print("Error fetching categories: $e");
    }
  }

  Future<void> deleteProduct(String id) async {
    try {
      await _apiService.dio.delete('/products/$id');
      _products.removeWhere((p) => p['_id'] == id);
      searchProducts(_searchQuery); // Refresh filter
      notifyListeners();
    } catch (e) {
      print("Error deleting product: $e");
    }
  }

  List<dynamic> _filteredProducts = [];
  List<dynamic> get filteredProducts => _filteredProducts.isEmpty && _searchQuery.isEmpty ? _products : _filteredProducts;
  
  String _searchQuery = "";

  List<dynamic> _searchResults = [];
  List<dynamic> get searchResults => _searchResults;
  bool _isSearching = false;
  bool get isSearching => _isSearching;

  void searchProducts(String query) {
     // Keep local search for Home Screen usage if needed, or deprecate it.
     // For Phase 6, we generally use the API search for the Dedicated Search Screen.
     // But let's leave this for backward compatibility if HomeScreen uses it.
    _searchQuery = query;
    if (query.isEmpty) {
      _filteredProducts = [];
    } else {
      _filteredProducts = _products.where((product) {
        final name = product['name'].toString().toLowerCase();
        final searchLower = query.toLowerCase();
        return name.contains(searchLower);
      }).toList();
    }
    notifyListeners();
  }

  void filterByCategory(String category) {
    if (category == "All") {
      _filteredProducts = _products;
    } else {
      _filteredProducts = _products.where((product) {
         // Check if product has a category field, or strictly match name for now if simplified
         // Assuming product['category'] exists or matching against keywords
         final cat = product['category'].toString().toLowerCase();
         final target = category.toLowerCase();
         // Fallback to name search if category field is missing/weak in current data
         final name = product['name'].toString().toLowerCase();
         return cat.contains(target) || name.contains(target);
      }).toList();
    }
    notifyListeners();
  }

  Future<void> searchProductsApi(String query) async {
      if (query.isEmpty) {
          _searchResults = [];
          notifyListeners();
          return;
      }
      _isSearching = true;
      notifyListeners();
      try {
          final response = await _apiService.dio.get('/products?keyword=$query');
          _searchResults = response.data;
      } catch (e) {
          print("Error searching products: $e");
      }
      _isSearching = false;
      notifyListeners();
  }
}
