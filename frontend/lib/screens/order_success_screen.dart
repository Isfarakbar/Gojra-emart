import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/helpers.dart';
import 'main_screen.dart';
import 'my_orders_screen.dart';

class OrderSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> order;

  const OrderSuccessScreen({super.key, required this.order});

  static const List<String> _statusSteps = [
    'Placed',
    'Confirmed',
    'Packing',
    'Out for Delivery',
    'Delivered',
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final orderId = (order['_id'] ?? '').toString();
    final shortOrderId = orderId.length > 6
        ? orderId.substring(orderId.length - 6).toUpperCase()
        : orderId.toUpperCase();
    final status = (order['status'] ?? 'Placed').toString();
    final shipping = Map<String, dynamic>.from(order['shippingAddress'] ?? {});
    final items = List<dynamic>.from(order['orderItems'] ?? []);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 86,
                  height: 86,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.check_circle_rounded,
                    color: theme.colorScheme.primary,
                    size: 64,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Center(
                child: Text(
                  'Order Placed',
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Center(
                child: Text(
                  'Order #$shortOrderId',
                  style: GoogleFonts.inter(
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _SectionCard(
                title: 'Current Status',
                child: _OrderTimeline(
                  steps: _statusSteps,
                  currentIndex: _statusSteps
                      .indexOf(status)
                      .clamp(0, _statusSteps.length - 1)
                      .toInt(),
                  activeColor: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'Delivery Address',
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.location_on_outlined, color: theme.colorScheme.primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${shipping['street'] ?? ''}\n${shipping['area'] ?? ''}, ${shipping['city'] ?? ''}\n${shipping['phone'] ?? ''}',
                        style: GoogleFonts.inter(height: 1.45, color: Colors.grey[800]),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'Items',
                child: Column(
                  children: [
                    ...items.map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '${item['qty']}x ${item['name']}',
                                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                                ),
                              ),
                              Text(
                                Helpers.formatCurrency((item['qty'] ?? 0) * (item['price'] ?? 0)),
                                style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        )),
                    const Divider(height: 24),
                    _priceRow('Items', order['itemsPrice'] ?? order['totalPrice']),
                    const SizedBox(height: 8),
                    _priceRow('Delivery', order['deliveryFee'] ?? 0),
                    const Divider(height: 24),
                    _priceRow('Total', order['totalPrice'], isTotal: true),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const MainScreen()),
                      (route) => false,
                    );
                  },
                  icon: const Icon(Icons.home_outlined),
                  label: const Text('Back to Home'),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const MyOrdersScreen()),
                      (route) => false,
                    );
                  },
                  icon: const Icon(Icons.receipt_long_outlined),
                  label: const Text('View My Orders'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _priceRow(String label, dynamic amount, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontWeight: isTotal ? FontWeight.w800 : FontWeight.w600,
            fontSize: isTotal ? 16 : 14,
          ),
        ),
        Text(
          Helpers.formatCurrency(amount),
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w800,
            fontSize: isTotal ? 18 : 14,
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;

  const _SectionCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _OrderTimeline extends StatelessWidget {
  final List<String> steps;
  final int currentIndex;
  final Color activeColor;

  const _OrderTimeline({
    required this.steps,
    required this.currentIndex,
    required this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(steps.length, (index) {
        final isDone = index <= currentIndex;
        final isLast = index == steps.length - 1;

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: isDone ? activeColor : Colors.grey.shade300,
                    shape: BoxShape.circle,
                  ),
                  child: isDone
                      ? const Icon(Icons.check, color: Colors.white, size: 15)
                      : null,
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 24,
                    color: index < currentIndex ? activeColor : Colors.grey.shade300,
                  ),
              ],
            ),
            const SizedBox(width: 10),
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: Text(
                steps[index],
                style: GoogleFonts.inter(
                  color: isDone ? Colors.black87 : Colors.grey,
                  fontWeight: isDone ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}
