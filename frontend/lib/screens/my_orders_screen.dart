import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/empty_state.dart';
import '../widgets/skeleton_loader.dart';
import '../utils/helpers.dart';

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMyOrders();
  }

  Future<void> _fetchMyOrders() async {
    try {
      final response = await ApiService().dio.get('/orders/myorders');
      setState(() {
        _orders = response.data is Map ? response.data['orders'] ?? [] : response.data;
        _isLoading = false;
      });
    } catch (e) {
      print(e);
      setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Placed': return Colors.amber; // Yellow
      case 'Confirmed': return Colors.blue; // Blue
      case 'Packing': return Colors.purple; // Purple
      case 'Out for Delivery': return Colors.orange; // Orange
      case 'Delivered': return Colors.green; // Green
      case 'Cancelled': return Colors.red; // Red
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text("My Orders", style: GoogleFonts.poppins(color: Colors.black, fontWeight: FontWeight.bold)), backgroundColor: Colors.white, elevation: 0, iconTheme: const IconThemeData(color: Colors.black)),
      body: _isLoading
          ? ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 4,
              itemBuilder: (context, index) => const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: SkeletonLoader(width: double.infinity, height: 160),
              ),
            )
          : _orders.isEmpty
              ? EmptyState(
                  icon: Icons.receipt_long,
                  title: "No Orders Yet",
                  subtitle: "You haven't placed any orders. Start shopping to see them here.",
                  buttonText: "Start Shopping",
                  onButtonPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                )
              : RefreshIndicator(
                  onRefresh: _fetchMyOrders,
                  child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _orders.length,
                  itemBuilder: (ctx, i) {
                    final order = _orders[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("Order #${order['_id'].substring(order['_id'].length - 6)}", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(order['status']).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    order['status'],
                                    style: TextStyle(color: _getStatusColor(order['status']), fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                )
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text("Total: ${Helpers.formatCurrency(order['totalPrice'])}", style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 14)),
                            const Divider(height: 20),
                            ...((order['orderItems'] as List).map((item) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                                  child: Row(
                                    children: [
                                      Text("${item['qty']}x ", style: const TextStyle(fontWeight: FontWeight.bold)),
                                      Expanded(child: Text(item['name'], overflow: TextOverflow.ellipsis)),
                                    ],
                                  ),
                                ))),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("Date: ${order['createdAt'].substring(0, 10)}", style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                if (order['status'] != 'Delivered' && order['status'] != 'Cancelled')
                                TextButton.icon(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Tracking feature coming soon!")));
                                  },
                                  icon: const Icon(Icons.my_location, size: 16),
                                  label: const Text("Track Order"),
                                  style: TextButton.styleFrom(
                                    foregroundColor: theme.colorScheme.primary,
                                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)
                                  ),
                                )
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
    );
  }
}
