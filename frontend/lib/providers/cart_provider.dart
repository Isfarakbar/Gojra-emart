import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
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

class PlaceOrderResult {
  final Map<String, dynamic>? order;
  final String? error;

  const PlaceOrderResult({this.order, this.error});

  bool get isSuccess => order != null && error == null;
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

  void addToCart(
    Map<String, dynamic> product,
    int quantity, {
    Map<String, dynamic>? selectedVariant,
  }) {
    final productId = product['_id'] ?? product['id'];
    final price = selectedVariant != null
        ? (selectedVariant['price'] as num).toDouble()
        : (product['price'] as num).toDouble();

    final title = product['name'];
    final image = product['imageUrl'];
    final variantUnit = selectedVariant?['unit'];

    final cartKey = variantUnit != null
        ? '${productId}_$variantUnit'
        : productId;

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
    addToCart({
      '_id': productId,
      'price': price,
      'name': title,
      'imageUrl': image,
    }, 1);
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
          variantUnit: existingCartItem.variantUnit,
        ),
      );
    } else {
      _items.remove(productId);
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  int replaceWithReorderItems(List<dynamic> reorderItems) {
    _items.clear();
    var imported = 0;

    for (final entry in reorderItems) {
      if (entry is! Map || entry['product'] is! Map) continue;
      final product = Map<String, dynamic>.from(entry['product']);
      final selectedVariant = entry['selectedVariant'] is Map
          ? Map<String, dynamic>.from(entry['selectedVariant'])
          : null;
      final requestedQuantity = (entry['quantity'] as num?)?.toInt() ?? 0;
      final stock =
          ((selectedVariant?['stock'] ?? product['stock'] ?? 0) as num).toInt();
      final quantity = requestedQuantity.clamp(0, stock);
      if (quantity < 1) continue;

      final productId = (product['_id'] ?? product['id']).toString();
      final variantUnit = selectedVariant?['unit']?.toString();
      final price = (selectedVariant?['price'] ?? product['price'] as num)
          .toDouble();
      final cartKey = variantUnit == null
          ? productId
          : '${productId}_$variantUnit';

      _items[cartKey] = CartItem(
        id: DateTime.now().microsecondsSinceEpoch.toString(),
        title: variantUnit == null
            ? product['name'].toString()
            : '${product['name']} ($variantUnit)',
        quantity: quantity,
        price: price,
        image: (product['imageUrl'] ?? '').toString(),
        productId: productId,
        variantUnit: variantUnit,
      );
      imported++;
    }

    notifyListeners();
    return imported;
  }

  Future<Map<String, dynamic>?> _captureCurrentLocation() async {
    if (kIsWeb) return null;

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission != LocationPermission.whileInUse &&
          permission != LocationPermission.always) {
        return null;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      return {'latitude': position.latitude, 'longitude': position.longitude};
    } catch (error) {
      debugPrint('Location capture failed: $error');
      return null;
    }
  }

  Future<PlaceOrderResult> placeOrder(
    String street,
    String area,
    String city,
    String phone, {
    String paymentMethod = 'COD',
    String? promoCode,
    Map<String, dynamic>? deliverySlot,
    String? deliveryDate,
  }) async {
    final url = '/orders';
    final orderItems = _items.values
        .map(
          (cp) => {
            'product': cp.productId,
            'name': cp.title,
            'qty': cp.quantity,
            'image': cp.image,
            'price': cp.price,
            'variant': cp.variantUnit,
          },
        )
        .toList();

    final locationData = await _captureCurrentLocation();

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
        if (promoCode != null && promoCode.trim().isNotEmpty)
          'promoCode': promoCode.trim(),
        if (deliverySlot != null) 'deliverySlot': deliverySlot,
        if (deliveryDate != null) 'deliveryDate': deliveryDate,
        if (locationData != null) 'location': locationData,
      };

      final response = await _apiService.dio.post(url, data: data);
      final createdOrder = Map<String, dynamic>.from(response.data);
      clear();
      return PlaceOrderResult(order: createdOrder);
    } catch (error) {
      debugPrint(error.toString());
      if (error is DioException && error.response != null) {
        return PlaceOrderResult(
          error: error.response?.data['message'] ?? 'An error occurred',
        );
      }
      return const PlaceOrderResult(error: 'An error occurred');
    }
  }
}
