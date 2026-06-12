import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/product.dart';
import 'package:dio/dio.dart';

class WishlistProvider with ChangeNotifier {
  List<Product> _wishlist = [];
  final ApiService _apiService = ApiService();

  List<Product> get wishlist => _wishlist;

  Future<void> fetchWishlist() async {
    try {
      final response = await _apiService.dio.get('/users/profile');
      if (response.statusCode == 200) {
        final List<dynamic> wishlistData = response.data['wishlist'] ?? [];
        _wishlist = wishlistData.map((item) => Product.fromJson(item)).toList();
        notifyListeners();
      }
    } on DioException catch (e) {
      // 401 = not logged in — silently ignore
      if (e.response?.statusCode != 401) {
        print('Error fetching wishlist: $e');
      }
    } catch (error) {
      print('Error fetching wishlist: $error');
    }
  }

  Future<void> toggleWishlist(String productId) async {
    try {
      // Optimistic update — remove first if exists
      final index = _wishlist.indexWhere((p) => p.id == productId);
      Product? removedProduct;

      if (index != -1) {
        removedProduct = _wishlist[index];
        _wishlist.removeAt(index);
        notifyListeners();
      }

      final response = await _apiService.dio.post('/users/wishlist/$productId');

      if (response.statusCode == 200) {
        // Refresh true state from server
        await fetchWishlist();
      } else {
        // Revert optimistic remove if failed
        if (removedProduct != null) {
          _wishlist.insert(index, removedProduct);
          notifyListeners();
        }
      }
    } on DioException catch (e) {
      print('Error toggling wishlist: ${e.response?.data ?? e.message}');
    } catch (error) {
      print('Error toggling wishlist: $error');
    }
  }

  bool isInWishlist(String productId) {
    return _wishlist.any((p) => p.id == productId);
  }
}
