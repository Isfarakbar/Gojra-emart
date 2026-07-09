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
      final response = await _apiService.dio.get('/products', queryParameters: {'page': 1});
      final firstPageProducts = response.data is Map ? response.data['products'] ?? [] : response.data;
      final totalPages = response.data is Map ? response.data['pages'] ?? 1 : 1;
      final allProducts = List<dynamic>.from(firstPageProducts);

      for (var page = 2; page <= totalPages; page++) {
        final pageResponse = await _apiService.dio.get('/products', queryParameters: {'page': page});
        allProducts.addAll(pageResponse.data is Map ? pageResponse.data['products'] ?? [] : pageResponse.data);
      }

      _products = allProducts;
    } catch (e) {
      _errorMessage = "Failed to load products. Check connection.";
      debugPrint("Error fetching products: $e");
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
      debugPrint("Error fetching categories: $e");
    }
  }

  Future<void> deleteProduct(String id) async {
    try {
      await _apiService.dio.delete('/products/$id');
      _products.removeWhere((p) => p['_id'] == id);
      searchProducts(_searchQuery); // Refresh filter
      notifyListeners();
    } catch (e) {
      debugPrint("Error deleting product: $e");
    }
  }

  List<dynamic> _filteredProducts = [];
  bool _hasActiveFilter = false;
  List<dynamic> get filteredProducts => _hasActiveFilter ? _filteredProducts : _products;
  bool get hasActiveFilter => _hasActiveFilter;
  
  String _searchQuery = "";

  List<dynamic> _searchResults = [];
  List<dynamic> get searchResults => _searchResults;
  bool _isSearching = false;
  bool get isSearching => _isSearching;

  void searchProducts(String query) {
    _searchQuery = query;
    if (query.isEmpty) {
      _filteredProducts = [];
      _hasActiveFilter = false;
    } else {
      _hasActiveFilter = true;
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
      _hasActiveFilter = false;
    } else {
      _hasActiveFilter = true;
      _filteredProducts = _products.where((product) {
         final productCategory = product['category'];
         final target = category.toLowerCase().trim();
         final categoryName = productCategory is Map
             ? (productCategory['name'] ?? '').toString().toLowerCase()
             : productCategory.toString().toLowerCase();
         final categoryId = productCategory is Map
             ? (productCategory['_id'] ?? '').toString().toLowerCase()
             : productCategory.toString().toLowerCase();
         return categoryName == target || categoryId == target;
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
          final response = await _apiService.dio.get('/products', queryParameters: {'keyword': query});
          _searchResults = response.data is Map ? response.data['products'] ?? [] : response.data;
      } catch (e) {
          debugPrint("Error searching products: $e");
      }
      _isSearching = false;
      notifyListeners();
  }

  Future<List<Map<String, dynamic>>> getSearchSuggestions(String query) async {
    if (query.trim().length < 2) {
      return [];
    }
    try {
      final response = await _apiService.dio.get('/products/search', queryParameters: {'q': query});
      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data);
      }
    } catch (e) {
      debugPrint("Error fetching suggestions: $e");
    }
    return [];
  }

  Future<Map<String, dynamic>?> getProductById(String id) async {
    try {
      final response = await _apiService.dio.get('/products/$id');
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data);
      }
    } catch (e) {
      debugPrint("Error fetching product by id: $e");
    }
    return null;
  }
}
