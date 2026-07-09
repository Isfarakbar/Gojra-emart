import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/providers/cart_provider.dart';
import 'package:frontend/services/api_service.dart';
import 'package:frontend/services/cart_storage.dart';
import 'package:frontend/services/location_service.dart';

class MemoryCartStorage implements CartStorage {
  String? value;

  @override
  Future<void> clear() async => value = null;

  @override
  Future<String?> read() async => value;

  @override
  Future<void> write(String value) async => this.value = value;
}

class FakeLocationService implements LocationService {
  final Map<String, double>? coordinates;

  FakeLocationService(this.coordinates);

  @override
  Future<Map<String, double>?> getCurrentCoordinates() async => coordinates;
}

class RecordingApi {
  final Dio dio = Dio();
  Map<String, dynamic>? requestData;
  String? failureMessage;

  RecordingApi({this.failureMessage}) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requestData = Map<String, dynamic>.from(options.data);
          if (failureMessage != null) {
            return handler.reject(
              DioException(
                requestOptions: options,
                response: Response(
                  requestOptions: options,
                  statusCode: 400,
                  data: {'message': failureMessage},
                ),
              ),
            );
          }
          return handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 201,
              data: {'_id': 'order-1', 'status': 'Placed'},
            ),
          );
        },
      ),
    );
  }

  ApiService get service => ApiService(dio: dio, attachInterceptors: false);
}

void main() {
  group('CartProvider', () {
    final product = {
      '_id': 'product-1',
      'name': 'Fresh Milk',
      'price': 250,
      'stock': 10,
      'imageUrl': 'https://example.com/milk.jpg',
    };

    test('aggregates matching products and calculates total', () {
      final cart = CartProvider(storage: MemoryCartStorage());

      cart.addToCart(product, 2);
      cart.addToCart(product, 1);

      expect(cart.itemCount, 1);
      expect(cart.items['product-1']?.quantity, 3);
      expect(cart.totalAmount, 750);
    });

    test('keeps product variants as separate cart lines', () {
      final cart = CartProvider(storage: MemoryCartStorage());

      cart.addToCart(
        product,
        1,
        selectedVariant: {'unit': '500ml', 'price': 140, 'stock': 5},
      );
      cart.addToCart(
        product,
        2,
        selectedVariant: {'unit': '1L', 'price': 250, 'stock': 5},
      );

      expect(cart.itemCount, 2);
      expect(cart.items['product-1_500ml']?.variantUnit, '500ml');
      expect(cart.items['product-1_1L']?.quantity, 2);
      expect(cart.totalAmount, 640);
    });

    test('reorder import uses current prices and caps quantity to stock', () {
      final cart = CartProvider(storage: MemoryCartStorage());
      cart.addItem('old-product', 10, 'Old item', '');

      final imported = cart.replaceWithReorderItems([
        {'product': product, 'quantity': 20, 'selectedVariant': null},
        {
          'product': {...product, '_id': 'out-of-stock', 'stock': 0},
          'quantity': 1,
          'selectedVariant': null,
        },
      ]);

      expect(imported, 1);
      expect(cart.items.containsKey('old-product'), isFalse);
      expect(cart.items['product-1']?.quantity, 10);
      expect(cart.items['product-1']?.price, 250);
      expect(cart.totalAmount, 2500);
    });

    test('removeSingleItem decrements then removes the line', () {
      final cart = CartProvider(storage: MemoryCartStorage());
      cart.addToCart(product, 2);

      cart.removeSingleItem('product-1');
      expect(cart.items['product-1']?.quantity, 1);

      cart.removeSingleItem('product-1');
      expect(cart.items, isEmpty);
    });

    test('caps repeated additions at current stock', () {
      final cart = CartProvider(storage: MemoryCartStorage());
      cart.addToCart(product, 8);
      cart.addToCart(product, 8);

      expect(cart.items['product-1']?.quantity, 10);
    });

    test('restores a persisted cart', () async {
      final storage = MemoryCartStorage();
      final firstCart = CartProvider(storage: storage);
      firstCart.addToCart(product, 3);
      await Future<void>.delayed(Duration.zero);

      final restoredCart = CartProvider(storage: storage);
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);

      expect(restoredCart.isRestored, isTrue);
      expect(restoredCart.items['product-1']?.quantity, 3);
      expect(restoredCart.totalAmount, 750);
    });

    test('places a COD order with GPS and clears cart after success', () async {
      final api = RecordingApi();
      final cart = CartProvider(
        apiService: api.service,
        storage: MemoryCartStorage(),
        locationService: FakeLocationService({
          'latitude': 31.1492,
          'longitude': 72.6833,
        }),
      );
      cart.addToCart(product, 2);

      final result = await cart.placeOrder(
        '12 Main Road',
        'Model Town',
        'Gojra',
        '03001234567',
        promoCode: 'SAVE10',
        deliveryDate: '2026-07-10',
        deliverySlot: {
          'label': 'Evening',
          'startTime': '18:00',
          'endTime': '20:00',
        },
      );

      expect(result.isSuccess, isTrue);
      expect(cart.items, isEmpty);
      expect(api.requestData?['paymentMethod'], 'COD');
      expect(api.requestData?['location'], {
        'latitude': 31.1492,
        'longitude': 72.6833,
      });
      expect(api.requestData?['shippingAddress'], {
        'street': '12 Main Road',
        'area': 'Model Town',
        'city': 'Gojra',
        'phone': '03001234567',
      });
      expect(api.requestData?['orderItems'][0]['qty'], 2);
      expect(api.requestData?['promoCode'], 'SAVE10');
    });

    test(
      'preserves cart and exposes backend message when order fails',
      () async {
        final api = RecordingApi(failureMessage: 'This delivery slot is full.');
        final cart = CartProvider(
          apiService: api.service,
          storage: MemoryCartStorage(),
          locationService: FakeLocationService(null),
        );
        cart.addToCart(product, 1);

        final result = await cart.placeOrder(
          '12 Main Road',
          'Model Town',
          'Gojra',
          '03001234567',
        );

        expect(result.isSuccess, isFalse);
        expect(result.error, 'This delivery slot is full.');
        expect(cart.items['product-1']?.quantity, 1);
        expect(api.requestData?.containsKey('location'), isFalse);
      },
    );
  });
}
