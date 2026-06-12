import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:dio/dio.dart';
import 'dart:io' show Platform;
import 'package:geolocator/geolocator.dart';

class CartItem {
  final String id;
  final String title;
  final int quantity;
  final double price;
  final String image;
  final String productId;
  final String? variantUnit;

  CartItem({
    required this.id,
    required this.title,
    required this.quantity,
    required this.price,
    required this.image,
    required this.productId,
    this.variantUnit,
  });
}

class CartProvider with ChangeNotifier {
  final Map<String, CartItem> _items = {};
  final ApiService _apiService = ApiService();

  Map<String, CartItem> get items => _items;

  int get itemCount => _items.length;

  double get totalAmount {
    var total = 0.0;
    _items.forEach((key, cartItem) {
      total += cartItem.price * cartItem.quantity;
    });
    return total;
  }

  void addToCart(Map<String, dynamic> product, int quantity, {Map<String, dynamic>? selectedVariant}) {
    final productId = product['_id'] ?? product['id'];
    // Use variant price if selected, otherwise product price
    final price = selectedVariant != null 
        ? (selectedVariant['price'] as num).toDouble() 
        : (product['price'] as num).toDouble();
    
    final title = product['name'];
    final image = product['imageUrl'];
    final variantUnit = selectedVariant?['unit'];

    // Unique key for cart item: ID + Variant
    final cartKey = variantUnit != null ? '${productId}_$variantUnit' : productId;

    if (_items.containsKey(cartKey)) {
      _items.update(
        cartKey,
        (existingCartItem) => CartItem(
          id: existingCartItem.id,
          title: existingCartItem.title,
          quantity: existingCartItem.quantity + quantity,
          price: existingCartItem.price, // Keep existing price or update? Assumed same
          image: existingCartItem.image,
          productId: existingCartItem.productId,
          variantUnit: existingCartItem.variantUnit,
        ),
      );
    } else {
      _items.putIfAbsent(
        cartKey,
        () => CartItem(
          id: DateTime.now().toString(),
          title: variantUnit != null ? "$title ($variantUnit)" : title,
          price: price,
          quantity: quantity,
          image: image,
          productId: productId,
          variantUnit: variantUnit,
        ),
      );
    }
    notifyListeners();
  }

  void addItem(String productId, double price, String title, String image) {
      // Legacy wrapper or implementation
      addToCart({'_id': productId, 'price': price, 'name': title, 'imageUrl': image}, 1);
  }

  void removeItem(String productId) {
    _items.remove(productId);
    notifyListeners();
  }

  void removeSingleItem(String productId) {
    if (!_items.containsKey(productId)) {
      return;
    }
    if (_items[productId]!.quantity > 1) {
      _items.update(
          productId,
          (existingCartItem) => CartItem(
                id: existingCartItem.id,
                title: existingCartItem.title,
                quantity: existingCartItem.quantity - 1,
                price: existingCartItem.price,
                image: existingCartItem.image,
                productId: existingCartItem.productId,
              ));
    } else {
      _items.remove(productId);
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  Future<String?> placeOrder(String address, String city, String phone, {String paymentMethod = 'COD', Map<String, dynamic>? paymentResult}) async {
    final url = '/orders';
    final orderItems = _items.values.map((cp) => {
      'product': cp.productId,
      'name': cp.title,
      'qty': cp.quantity,
      'image': cp.image,
      'price': cp.price,
      'variant': cp.variantUnit,
    }).toList();

    Map<String, dynamic>? locationData;
    // Geolocator only supported on Android/iOS
    final isMobile = Platform.isAndroid || Platform.isIOS;
    if (isMobile) {
      try {
        // Best effort location capture
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (serviceEnabled) {
          LocationPermission permission = await Geolocator.checkPermission();
          if (permission == LocationPermission.denied) {
            permission = await Geolocator.requestPermission();
          }

          if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
            Position position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
            locationData = {
              'type': 'Point',
              'coordinates': [position.longitude, position.latitude]
            };
          }
        }
      } catch (e) {
        print("Error getting location: $e");
        // Continue without location
      }
    }

    try {
      final data = {
        'orderItems': orderItems,
        'shippingAddress': {
          'address': address,
          'city': city,
          'phone': phone,
        },
        'paymentMethod': paymentMethod,
        'totalPrice': totalAmount,
      };

      if (locationData != null) {
        data['location'] = locationData;
      }

      if (paymentResult != null) {
          data['paymentResult'] = paymentResult;
          data['isPaid'] = true;
          data['paidAt'] = DateTime.now().toIso8601String();
      }

      await _apiService.dio.post(url, data: data);
      clear();
      return null; // Success
    } catch (error) {
      print(error);
      if (error is DioException && error.response != null) {
          return error.response?.data['message'] ?? 'An error occurred';
      }
      return 'An error occurred';
    }
  }
}
