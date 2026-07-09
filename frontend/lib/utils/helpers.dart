import 'package:intl/intl.dart';
import 'package:flutter/material.dart';

class Helpers {
  /// Formats a raw number to PKR currency format. e.g., Rs. 1,500
  static String formatCurrency(dynamic amount) {
    if (amount == null) return 'Rs. 0';
    double parsedAmount = amount is String
        ? double.tryParse(amount) ?? 0.0
        : amount.toDouble();
    final formatter = NumberFormat.currency(symbol: 'Rs. ', decimalDigits: 0);
    return formatter.format(parsedAmount);
  }

  /// Displays a customized, floating Snackbar (Toast).
  static void showSnackBar(
    BuildContext context,
    String message, {
    bool isError = false,
  }) {
    final snackBar = SnackBar(
      content: Row(
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.check_circle_outline,
            color: Colors.white,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
      backgroundColor: isError ? Colors.redAccent : Colors.green[700],
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(16),
      duration: const Duration(seconds: 3),
    );

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
}
