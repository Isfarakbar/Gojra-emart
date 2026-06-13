import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final response = await ApiService().dio.get('/orders');
      setState(() {
        _orders = response.data is Map ? response.data['orders'] ?? [] : response.data;
        _isLoading = false;
      });
    } catch (e) {
      print(e);
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    try {
      await ApiService().dio.put('/orders/$id/status', data: {'status': status});
      _fetchOrders();
    } catch (e) {
      print(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Manage Orders")),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _orders.length,
              itemBuilder: (ctx, i) {
                final order = _orders[i];
                return Card(
                  margin: const EdgeInsets.all(8),
                  child: ExpansionTile(
                    title: Text("Order #${order['_id'].substring(order['_id'].length - 6)}"),
                    subtitle: Text("Total: Rs. ${order['totalPrice']} - ${order['status']}"),
                    children: [
                      ListTile(
                        title: const Text("Shipping Address"),
                        subtitle: Text("${order['shippingAddress']['street']}, ${order['shippingAddress']['area']}, ${order['shippingAddress']['city']}\nPhone: ${order['shippingAddress']['phone']}"),
                      ),
                      ...((order['orderItems'] as List).map((item) => ListTile(
                            leading: Image.network(item['image'], width: 50, errorBuilder: (c,o,s)=>const Icon(Icons.broken_image)),
                            title: Text(item['name']),
                            trailing: Text("${item['qty']} x ${item['price']}"),
                          ))),
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                              onPressed: () => _updateStatus(order['_id'], 'Confirmed'), 
                              child: const Text("Confirm")
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                              onPressed: () => _updateStatus(order['_id'], 'Packing'), 
                              child: const Text("Pack")
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.deepOrange, foregroundColor: Colors.white),
                              onPressed: () => _updateStatus(order['_id'], 'Out for Delivery'), 
                              child: const Text("Dispatch")
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                              onPressed: () => _updateStatus(order['_id'], 'Delivered'), 
                              child: const Text("Deliver")
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
    );
  }
}
