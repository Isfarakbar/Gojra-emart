import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/providers/cart_provider.dart';
import 'package:frontend/screens/main_screen.dart';
import 'package:frontend/services/cart_storage.dart';
import 'package:provider/provider.dart';

class EmptyCartStorage implements CartStorage {
  @override
  Future<void> clear() async {}

  @override
  Future<String?> read() async => null;

  @override
  Future<void> write(String value) async {}
}

void main() {
  testWidgets('back returns non-home tabs to Home then requires double back', (
    tester,
  ) async {
    var exitCount = 0;
    var now = DateTime(2026, 7, 9, 12);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(
            create: (_) => CartProvider(storage: EmptyCartStorage()),
          ),
        ],
        child: MaterialApp(
          home: MainScreen(
            forceAndroidExitPolicy: true,
            now: () => now,
            exitApp: () async => exitCount++,
            screens: const [
              Center(child: Text('HOME_TEST')),
              Center(child: Text('CART_TEST')),
              Center(child: Text('ORDERS_TEST')),
              Center(child: Text('PROFILE_TEST')),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Cart'));
    await tester.pumpAndSettle();
    expect(find.text('CART_TEST'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('HOME_TEST'), findsOneWidget);
    expect(exitCount, 0);

    await tester.binding.handlePopRoute();
    await tester.pump();
    expect(find.text('Press back again to exit'), findsOneWidget);
    expect(exitCount, 0);

    now = now.add(const Duration(seconds: 1));
    await tester.binding.handlePopRoute();
    await tester.pump();
    expect(exitCount, 1);
  });

  testWidgets('exit confirmation expires after two seconds', (tester) async {
    var exitCount = 0;
    var now = DateTime(2026, 7, 9, 12);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(
            create: (_) => CartProvider(storage: EmptyCartStorage()),
          ),
        ],
        child: MaterialApp(
          home: MainScreen(
            forceAndroidExitPolicy: true,
            now: () => now,
            exitApp: () async => exitCount++,
            screens: const [SizedBox(), SizedBox(), SizedBox(), SizedBox()],
          ),
        ),
      ),
    );

    await tester.binding.handlePopRoute();
    await tester.pump();
    now = now.add(const Duration(seconds: 3));
    await tester.binding.handlePopRoute();
    await tester.pump();

    expect(exitCount, 0);
  });
}
