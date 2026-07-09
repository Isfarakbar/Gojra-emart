import 'package:flutter/material.dart';
import '../screens/order_detail_screen.dart';

class AppNavigation {
  static final navigatorKey = GlobalKey<NavigatorState>();

  static void openOrder(String orderId) {
    if (orderId.trim().isEmpty) return;
    navigatorKey.currentState?.push(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
    );
  }
}
