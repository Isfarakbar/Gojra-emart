import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/cart_storage.dart';
import '../services/location_service.dart';
import 'package:dio/dio.dart';

class CartItem {
  final String id;
  final String title;
  final int quantity;
  final double price;
  final String image;
  final String productId;
  final String? variantUnit;
  final int maxStock;

  CartItem({
    required this.id,
    required this.title,
    required this.quantity,
    required this.price,
    required this.image,
    required this.productId,
    this.variantUnit,
    required this.maxStock,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'quantity': quantity,
    'price': price,
    'image': image,
    'productId': productId,
    'variantUnit': variantUnit,
    'maxStock': maxStock,
  };

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    id: json['id']?.toString() ?? DateTime.now().toIso8601String(),
    title: json['title']?.toString() ?? '',
    quantity: (json['quantity'] as num?)?.toInt() ?? 1,
    price: (json['price'] as num?)?.toDouble() ?? 0,
    image: json['image']?.toString() ?? '',
    productId: json['productId']?.toString() ?? '',
    variantUnit: json['variantUnit']?.toString(),
    maxStock: (json['maxStock'] as num?)?.toInt() ?? 0,
  );
}

class PlaceOrderResult {
  final Map<String, dynamic>? order;
  final String? error;

  const PlaceOrderResult({this.order, this.error});

  bool get isSuccess => order != null && error == null;
}

class CartProvider with ChangeNotifier {
  final Map<String, CartItem> _items = {};
  final ApiService _apiService;
  final CartStorage _storage;
  final LocationService _locationService;
  bool _isRestored = false;

  CartProvider({
    ApiService? apiService,
    CartStorage? storage,
    LocationService? locationService,
  }) : _apiService = apiService ?? ApiService(),
       _storage = storage ?? SharedPreferencesCartStorage(),
       _locationService = locationService ?? GeolocatorLocationService() {
    unawaited(_restore());
  }

  Map<String, CartItem> get items => _items;

  int get itemCount => _items.length;
  bool get isRestored => _isRestored;

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

    final title = product['name']?.toString() ?? 'Product';
    final image = product['imageUrl']?.toString() ?? '';
    final variantUnit = selectedVariant?['unit'];
    final availableStock =
        ((selectedVariant?['stock'] ?? product['stock'] ?? 0) as num).toInt();
    if (availableStock <= 0 || quantity <= 0) return;

    final cartKey = variantUnit != null
        ? '${productId}_$variantUnit'
        : productId;

    if (_items.containsKey(cartKey)) {
      _items.update(
        cartKey,
        (existingCartItem) => CartItem(
          id: existingCartItem.id,
          title: existingCartItem.title,
          quantity: (existingCartItem.quantity + quantity).clamp(
            1,
            existingCartItem.maxStock,
          ),
          price: existingCartItem.price,
          image: existingCartItem.image,
          productId: existingCartItem.productId,
          variantUnit: existingCartItem.variantUnit,
          maxStock: existingCartItem.maxStock,
        ),
      );
    } else {
      _items.putIfAbsent(
        cartKey,
        () => CartItem(
          id: DateTime.now().toString(),
          title: variantUnit != null ? "$title ($variantUnit)" : title,
          price: price,
          quantity: quantity.clamp(1, availableStock),
          image: image,
          productId: productId,
          variantUnit: variantUnit,
          maxStock: availableStock,
        ),
      );
    }
    notifyListeners();
    _persist();
  }

  void addItem(String productId, double price, String title, String image) {
    addToCart({
      '_id': productId,
      'price': price,
      'name': title,
      'imageUrl': image,
      'stock': _items[productId]?.maxStock ?? 0,
    }, 1);
  }

  void removeItem(String productId) {
    _items.remove(productId);
    notifyListeners();
    _persist();
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
          maxStock: existingCartItem.maxStock,
        ),
      );
    } else {
      _items.remove(productId);
    }
    notifyListeners();
    _persist();
  }

  void clear() {
    _items.clear();
    notifyListeners();
    unawaited(_storage.clear());
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
        maxStock: stock,
      );
      imported++;
    }

    notifyListeners();
    _persist();
    return imported;
  }

  Future<void> _restore() async {
    try {
      final raw = await _storage.read();
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          for (final entry in decoded) {
            if (entry is! Map) continue;
            final key = entry['key']?.toString();
            final data = entry['item'];
            if (key == null || data is! Map) continue;
            final item = CartItem.fromJson(Map<String, dynamic>.from(data));
            if (item.productId.isNotEmpty &&
                item.quantity > 0 &&
                item.maxStock > 0) {
              _items[key] = item;
            }
          }
        }
      }
    } catch (error) {
      debugPrint('Cart restore failed: $error');
      await _storage.clear();
    } finally {
      _isRestored = true;
      notifyListeners();
    }
  }

  void _persist() {
    final encoded = jsonEncode(
      _items.entries
          .map((entry) => {'key': entry.key, 'item': entry.value.toJson()})
          .toList(),
    );
    unawaited(_storage.write(encoded));
  }

  Future<Map<String, dynamic>?> _captureCurrentLocation() async {
    try {
      return await _locationService.getCurrentCoordinates();
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
