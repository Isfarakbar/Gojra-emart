import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/providers/cart_provider.dart';

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
      final cart = CartProvider();

      cart.addToCart(product, 2);
      cart.addToCart(product, 1);

      expect(cart.itemCount, 1);
      expect(cart.items['product-1']?.quantity, 3);
      expect(cart.totalAmount, 750);
    });

    test('keeps product variants as separate cart lines', () {
      final cart = CartProvider();

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
      final cart = CartProvider();
      cart.addItem('old-product', 10, 'Old item', '');

      final imported = cart.replaceWithReorderItems([
        {
          'product': product,
          'quantity': 20,
          'selectedVariant': null,
        },
        {
          'product': {
            ...product,
            '_id': 'out-of-stock',
            'stock': 0,
          },
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
      final cart = CartProvider();
      cart.addToCart(product, 2);

      cart.removeSingleItem('product-1');
      expect(cart.items['product-1']?.quantity, 1);

      cart.removeSingleItem('product-1');
      expect(cart.items, isEmpty);
    });
  });
}
