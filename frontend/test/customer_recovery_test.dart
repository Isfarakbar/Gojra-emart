import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/screens/my_orders_screen.dart';
import 'package:frontend/screens/notifications_screen.dart';
import 'package:frontend/services/api_service.dart';

ApiService failingApi(String message) {
  final dio = Dio();
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) => handler.reject(
        DioException(
          requestOptions: options,
          response: Response(
            requestOptions: options,
            statusCode: 503,
            data: {'message': message},
          ),
        ),
      ),
    ),
  );
  return ApiService(dio: dio, attachInterceptors: false);
}

class OrderApi {
  final Dio dio = Dio();
  int cancellationRequests = 0;

  OrderApi() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (options.path == '/orders/myorders') {
            return handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'orders': [
                    {
                      '_id': '1234567890abcdef12345678',
                      'status': 'Placed',
                      'totalPrice': 350,
                      'createdAt': '2026-07-09T12:00:00.000Z',
                      'orderItems': [
                        {'qty': 1, 'name': 'Fresh Milk'},
                      ],
                    },
                  ],
                },
              ),
            );
          }
          if (options.path.endsWith('/cancel')) {
            cancellationRequests += 1;
            return handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  '_id': '1234567890abcdef12345678',
                  'status': 'Cancelled',
                  'totalPrice': 350,
                  'createdAt': '2026-07-09T12:00:00.000Z',
                  'orderItems': [
                    {'qty': 1, 'name': 'Fresh Milk'},
                  ],
                },
              ),
            );
          }
          return handler.next(options);
        },
      ),
    );
  }

  ApiService get service => ApiService(dio: dio, attachInterceptors: false);
}

void main() {
  testWidgets('orders show a retry state instead of a false empty state', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MyOrdersScreen(apiService: failingApi('Service unavailable.')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Could not load orders'), findsOneWidget);
    expect(find.text('Service unavailable.'), findsOneWidget);
    expect(find.text('Try Again'), findsOneWidget);
    expect(find.text('No Orders Yet'), findsNothing);
  });

  testWidgets('notifications show a retry state after network failure', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: NotificationsScreen(apiService: failingApi('Offline'))),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('Could not load notifications. Check your connection.'),
      findsOneWidget,
    );
    expect(find.text('Try Again'), findsOneWidget);
    expect(find.text('No notifications yet'), findsNothing);
  });

  testWidgets('order cancellation requires explicit confirmation', (
    tester,
  ) async {
    final api = OrderApi();
    await tester.pumpWidget(
      MaterialApp(home: MyOrdersScreen(apiService: api.service)),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Cancel Order'));
    await tester.pumpAndSettle();
    expect(find.text('Cancel this order?'), findsOneWidget);
    expect(api.cancellationRequests, 0);

    await tester.tap(find.text('Keep Order'));
    await tester.pumpAndSettle();
    expect(api.cancellationRequests, 0);

    await tester.tap(find.text('Cancel Order'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Cancel Order'));
    await tester.pumpAndSettle();

    expect(api.cancellationRequests, 1);
    expect(find.text('Cancelled'), findsOneWidget);
  });
}
