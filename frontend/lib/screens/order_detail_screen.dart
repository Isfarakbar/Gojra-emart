import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';
import 'cart_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;
  final Map<String, dynamic>? initialOrder;

  const OrderDetailScreen({
    super.key,
    required this.orderId,
    this.initialOrder,
  });

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  bool _isCancelling = false;
  bool _isReordering = false;

  static const List<String> _statusSteps = [
    'Placed',
    'Confirmed',
    'Packing',
    'Out for Delivery',
    'Delivered',
  ];

  @override
  void initState() {
    super.initState();
    _order = widget.initialOrder;
    _fetchOrder();
  }

  Future<void> _fetchOrder() async {
    try {
      final response = await _apiService.dio.get('/orders/${widget.orderId}');
      if (!mounted) return;
      setState(() {
        _order = Map<String, dynamic>.from(response.data);
        _isLoading = false;
      });
    } catch (error) {
      debugPrint('Error fetching order detail: $error');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _cancelOrder() async {
    final order = _order;
    if (order == null) return;
    final reason = await _requestCancellationReason();
    if (reason == null || reason.isEmpty) return;

    setState(() => _isCancelling = true);
    try {
      final response = await _apiService.dio.put(
        '/orders/${order['_id']}/cancel',
        data: {'reason': reason},
      );
      if (!mounted) return;
      setState(() => _order = Map<String, dynamic>.from(response.data));
      Helpers.showSnackBar(context, 'Order cancelled successfully.');
    } catch (error) {
      if (!mounted) return;
      Helpers.showSnackBar(
        context,
        'Could not cancel this order. It may already be in packing or delivery.',
        isError: true,
      );
    } finally {
      if (mounted) setState(() => _isCancelling = false);
    }
  }

  Future<String?> _requestCancellationReason() async {
    final controller = TextEditingController();
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          20 + MediaQuery.viewInsetsOf(sheetContext).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cancel order',
              style: GoogleFonts.poppins(
                fontSize: 19,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Tell us why you need to cancel. This helps us improve.',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              autofocus: true,
              maxLength: 300,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Cancellation reason',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  final value = controller.text.trim();
                  if (value.isNotEmpty) Navigator.pop(sheetContext, value);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Confirm Cancellation'),
              ),
            ),
          ],
        ),
      ),
    );
    controller.dispose();
    return reason;
  }

  bool _canCancel(String status) {
    return status == 'Placed' || status == 'Confirmed';
  }

  Future<void> _buyAgain() async {
    final order = _order;
    if (order == null) return;

    setState(() => _isReordering = true);
    try {
      final response = await _apiService.dio.get(
        '/orders/${order['_id']}/reorder',
      );
      if (!mounted) return;
      final preview = Map<String, dynamic>.from(response.data);
      final available = List<dynamic>.from(preview['availableItems'] ?? []);
      final unavailable = List<dynamic>.from(preview['unavailableItems'] ?? []);
      final adjustments = List<dynamic>.from(preview['adjustments'] ?? []);

      if (available.isEmpty) {
        Helpers.showSnackBar(
          context,
          'None of these products are currently available.',
          isError: true,
        );
        return;
      }

      final confirmed = await _showReorderPreview(
        available,
        unavailable,
        adjustments,
      );
      if (!mounted || !confirmed) return;

      final count = context.read<CartProvider>().replaceWithReorderItems(
        available,
      );
      Helpers.showSnackBar(context, '$count product(s) added to your cart.');
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const CartScreen()));
    } catch (error) {
      if (mounted) {
        Helpers.showSnackBar(
          context,
          'Could not prepare this order. Please try again.',
          isError: true,
        );
      }
    } finally {
      if (mounted) setState(() => _isReordering = false);
    }
  }

  Future<bool> _showReorderPreview(
    List<dynamic> available,
    List<dynamic> unavailable,
    List<dynamic> adjustments,
  ) async {
    final cartHasItems = context.read<CartProvider>().items.isNotEmpty;
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.72,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Buy Again',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(sheetContext, false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  if (cartHasItems)
                    _reorderNotice(
                      'Continuing will replace the products currently in your cart.',
                      Colors.orange,
                    ),
                  Text(
                    '${available.length} available product(s)',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  ...available.map((entry) {
                    final product = Map<String, dynamic>.from(entry['product']);
                    final selectedVariant = entry['selectedVariant'] is Map
                        ? Map<String, dynamic>.from(entry['selectedVariant'])
                        : null;
                    final price =
                        selectedVariant?['price'] ?? product['price'] ?? 0;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.network(
                          product['imageUrl'] ?? '',
                          width: 44,
                          height: 44,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              const SizedBox(
                                width: 44,
                                height: 44,
                                child: Icon(Icons.image_outlined),
                              ),
                        ),
                      ),
                      title: Text(
                        product['name'] ?? 'Product',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        [
                          if (selectedVariant?['unit'] != null)
                            selectedVariant!['unit'],
                          'Qty ${entry['quantity']}',
                        ].join(' / '),
                      ),
                      trailing: Text(
                        Helpers.formatCurrency(price),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    );
                  }),
                  if (adjustments.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Changes since your order',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    ...adjustments.map(
                      (message) =>
                          _reorderNotice(message.toString(), Colors.orange),
                    ),
                  ],
                  if (unavailable.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Unavailable',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    ...unavailable.map((entry) {
                      final item = Map<String, dynamic>.from(entry);
                      return _reorderNotice(
                        '${item['name']}: ${item['reason']}',
                        Colors.red,
                      );
                    }),
                  ],
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pop(sheetContext, true),
                  icon: const Icon(Icons.shopping_cart_checkout),
                  label: Text(cartHasItems ? 'Replace Cart' : 'Add to Cart'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
    return result == true;
  }

  Widget _reorderNotice(String message, MaterialColor color) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        message,
        style: GoogleFonts.inter(color: color.shade700, fontSize: 12),
      ),
    );
  }

  int _statusIndex(String status) {
    if (status == 'Cancelled') return -1;
    final index = _statusSteps.indexOf(status);
    return index < 0 ? 0 : index;
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Placed':
        return Colors.amber.shade700;
      case 'Confirmed':
        return Colors.blue;
      case 'Packing':
        return Colors.purple;
      case 'Out for Delivery':
        return Colors.orange;
      case 'Delivered':
        return Colors.green;
      case 'Cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Future<void> _openMap(Map<String, dynamic> location) async {
    final latitude = location['latitude'];
    final longitude = location['longitude'];
    if (latitude == null || longitude == null) return;

    final uri = Uri.parse('https://maps.google.com/?q=$latitude,$longitude');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9F6),
      appBar: AppBar(
        title: Text(
          'Order Details',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: _isLoading && order == null
          ? const Center(child: CircularProgressIndicator())
          : order == null
          ? Center(
              child: Text(
                'Order not found',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              ),
            )
          : RefreshIndicator(
              onRefresh: _fetchOrder,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildHeader(order),
                  const SizedBox(height: 14),
                  _SectionCard(
                    title: 'Tracking',
                    child: _OrderTimeline(
                      steps: _statusSteps,
                      currentIndex: _statusIndex(order['status'] ?? ''),
                      isCancelled: order['status'] == 'Cancelled',
                      activeColor: _statusColor(order['status'] ?? ''),
                      history: List<dynamic>.from(order['statusHistory'] ?? []),
                      cancellationReason: (order['cancellationReason'] ?? '')
                          .toString(),
                      createdAt: (order['createdAt'] ?? '').toString(),
                    ),
                  ),
                  if (order['assignedRider'] is Map &&
                      [
                        'Out for Delivery',
                        'Delivered',
                      ].contains(order['status'])) ...[
                    const SizedBox(height: 14),
                    _buildRider(order),
                  ],
                  const SizedBox(height: 14),
                  _buildItems(order),
                  const SizedBox(height: 14),
                  _buildAddress(order),
                  const SizedBox(height: 14),
                  _buildPaymentSummary(order),
                  if (['Delivered', 'Cancelled'].contains(order['status'])) ...[
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: _isReordering ? null : _buyAgain,
                        icon: _isReordering
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.replay_rounded),
                        label: const Text('Buy Again'),
                      ),
                    ),
                  ],
                  if (_canCancel(order['status'] ?? '')) ...[
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: _isCancelling ? null : _cancelOrder,
                        icon: _isCancelling
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.cancel_outlined),
                        label: const Text('Cancel Order'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent),
                          textStyle: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 80),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader(Map<String, dynamic> order) {
    final orderId = (order['_id'] ?? '').toString();
    final shortId = orderId.length > 6
        ? orderId.substring(orderId.length - 6).toUpperCase()
        : orderId.toUpperCase();
    final status = (order['status'] ?? '').toString();
    final color = _statusColor(status);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.receipt_long_rounded, color: color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Order #$shortId',
                  style: GoogleFonts.poppins(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  (order['createdAt'] ?? '').toString().split('T').first,
                  style: GoogleFonts.inter(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              status,
              style: GoogleFonts.inter(
                color: color,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItems(Map<String, dynamic> order) {
    final items = List<dynamic>.from(order['orderItems'] ?? []);

    return _SectionCard(
      title: 'Items',
      child: Column(
        children: items.map((item) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    item['image'] ?? '',
                    width: 52,
                    height: 52,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 52,
                      height: 52,
                      color: Colors.grey.shade100,
                      child: const Icon(Icons.image_not_supported_outlined),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['name'] ?? '',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${item['qty']} x ${Helpers.formatCurrency(item['price'])}',
                        style: GoogleFonts.inter(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  Helpers.formatCurrency(
                    (item['qty'] ?? 0) * (item['price'] ?? 0),
                  ),
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildRider(Map<String, dynamic> order) {
    final rider = Map<String, dynamic>.from(order['assignedRider']);
    final phone = (rider['phone'] ?? '').toString();
    final vehicle = [
      rider['vehicleType'],
      rider['vehicleNumber'],
    ].where((value) => (value ?? '').toString().trim().isNotEmpty).join(' / ');

    return _SectionCard(
      title: 'Your Delivery Rider',
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Theme.of(
                context,
              ).colorScheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.delivery_dining_rounded,
              color: Theme.of(context).colorScheme.primary,
              size: 27,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rider['name'] ?? 'Delivery rider',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                ),
                if (vehicle.isNotEmpty)
                  Text(
                    vehicle,
                    style: GoogleFonts.inter(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          if (phone.isNotEmpty)
            IconButton.filled(
              tooltip: 'Call rider',
              onPressed: () => launchUrl(Uri.parse('tel:$phone')),
              icon: const Icon(Icons.phone_outlined, size: 19),
            ),
        ],
      ),
    );
  }

  Widget _buildAddress(Map<String, dynamic> order) {
    final shipping = Map<String, dynamic>.from(order['shippingAddress'] ?? {});
    final location = Map<String, dynamic>.from(order['location'] ?? {});
    final deliverySlot = Map<String, dynamic>.from(order['deliverySlot'] ?? {});
    final deliveryDate = DateTime.tryParse(
      (order['deliveryDate'] ?? '').toString(),
    );
    final hasLocation =
        location['latitude'] != null && location['longitude'] != null;

    return _SectionCard(
      title: 'Delivery Address',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.location_on_outlined,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '${shipping['street'] ?? ''}\n${shipping['area'] ?? ''}, ${shipping['city'] ?? ''}\n${shipping['phone'] ?? ''}',
                  style: GoogleFonts.inter(
                    height: 1.45,
                    color: Colors.grey[800],
                  ),
                ),
              ),
            ],
          ),
          if ((deliverySlot['label'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.schedule_outlined,
                    color: Theme.of(context).colorScheme.primary,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${deliveryDate == null ? '' : '${DateFormat('EEE, d MMM yyyy').format(deliveryDate)} / '}${deliverySlot['label']} / ${deliverySlot['startTime']} - ${deliverySlot['endTime']}',
                      style: GoogleFonts.inter(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (hasLocation) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => _openMap(location),
              icon: const Icon(Icons.map_outlined, size: 18),
              label: const Text('View Delivery Location'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPaymentSummary(Map<String, dynamic> order) {
    final discount = order['discountAmount'] ?? 0;

    return _SectionCard(
      title: 'Payment Summary',
      child: Column(
        children: [
          _priceRow('Items', order['itemsPrice'] ?? order['totalPrice']),
          const SizedBox(height: 8),
          _priceRow('Delivery', order['deliveryFee'] ?? 0),
          if (discount is num && discount > 0) ...[
            const SizedBox(height: 8),
            _priceRow('Discount (${order['promoCode'] ?? ''})', -discount),
          ],
          const Divider(height: 24),
          _priceRow('Total', order['totalPrice'], isTotal: true),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.payments_outlined, size: 18, color: Colors.grey),
              const SizedBox(width: 8),
              Text(
                order['paymentMethod'] ?? 'COD',
                style: GoogleFonts.inter(
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _priceRow(String label, dynamic amount, {bool isTotal = false}) {
    final isNegative = amount is num && amount < 0;
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
          '${isNegative ? '-' : ''}${Helpers.formatCurrency(isNegative ? amount.abs() : amount)}',
          style: GoogleFonts.inter(
            color: isNegative ? Colors.green : Colors.black87,
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
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
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
  final bool isCancelled;
  final Color activeColor;
  final List<dynamic> history;
  final String cancellationReason;
  final String createdAt;

  const _OrderTimeline({
    required this.steps,
    required this.currentIndex,
    required this.isCancelled,
    required this.activeColor,
    required this.history,
    required this.cancellationReason,
    required this.createdAt,
  });

  Map<String, dynamic>? _eventFor(String status) {
    for (final item in history.reversed) {
      if (item is Map && item['status'] == status) {
        return Map<String, dynamic>.from(item);
      }
    }
    if (status == 'Placed' && createdAt.isNotEmpty) {
      return {'status': 'Placed', 'changedAt': createdAt};
    }
    return null;
  }

  String _formatTime(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    if (date == null) return '';
    return DateFormat('d MMM, h:mm a').format(date);
  }

  @override
  Widget build(BuildContext context) {
    if (isCancelled) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.cancel_outlined,
              color: Colors.redAccent,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                cancellationReason.isEmpty
                    ? 'This order has been cancelled.'
                    : 'Cancelled: $cancellationReason',
                style: const TextStyle(
                  color: Colors.redAccent,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: List.generate(steps.length, (index) {
        final isDone = index <= currentIndex;
        final isLast = index == steps.length - 1;
        final event = _eventFor(steps[index]);
        final eventTime = _formatTime(event?['changedAt']);

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
                    height: 26,
                    color: index < currentIndex
                        ? activeColor
                        : Colors.grey.shade300,
                  ),
              ],
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          steps[index],
                          style: GoogleFonts.inter(
                            color: isDone ? Colors.black87 : Colors.grey,
                            fontWeight: isDone
                                ? FontWeight.w700
                                : FontWeight.w500,
                            fontSize: 13,
                          ),
                        ),
                        if (eventTime.isNotEmpty)
                          Text(
                            eventTime,
                            style: GoogleFonts.inter(
                              color: Colors.grey[500],
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                    if ((event?['note'] ?? '').toString().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          event!['note'].toString(),
                          style: GoogleFonts.inter(
                            color: Colors.grey[600],
                            fontSize: 11,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}
