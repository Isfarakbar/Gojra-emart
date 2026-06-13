import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
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
          price: existingCartItem.price,
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

  Future<String?> placeOrder(String street, String area, String city, String phone, {String paymentMethod = 'COD'}) async {
    final url = '/orders';
    final orderItems = _items.values.map((cp) => {
      'product': cp.productId,
      'name': cp.title,
      'qty': cp.quantity,
      'image': cp.image,
      'price': cp.price,
      'variant': cp.variantUnit,
    }).toList();

    // Try to capture GPS location, but don't block the order if it fails
    Map<String, dynamic>? locationData;
    final isMobile = !kIsWeb && (Platform.isAndroid || Platform.isIOS);

    if (isMobile) {
      try {
        final serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (serviceEnabled) {
          LocationPermission permission = await Geolocator.checkPermission();
          if (permission == LocationPermission.denied) {
            permission = await Geolocator.requestPermission();
          }

          if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
            final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
            locationData = {
              'latitude': position.latitude,
              'longitude': position.longitude,
            };
          }
        }
      } catch (e) {
        // GPS failed — proceed without location
        print('Location capture failed: $e');
      }
    }

    try {
      final data = {
        'orderItems': orderItems,
        'shippingAddress': {
          'street': street,
          'area': area,
          'city': city,
          'phone': phone,
        },
        'paymentMethod': paymentMethod,
        'totalPrice': totalAmount,
        'location': locationData,
      };

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
