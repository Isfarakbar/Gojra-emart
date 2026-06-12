import 'package:flutter/material.dart';
import 'manage_products_screen.dart';
import 'admin_orders_screen.dart';
import 'whatsapp_orders_screen.dart';

class AdminDashboard extends StatelessWidget {
  const AdminDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Admin Dashboard")),
      body: GridView.count(
        crossAxisCount: 2,
        padding: const EdgeInsets.all(16),
        children: [
          _buildCard(context, "Manage Products", Icons.inventory, () {
               Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ManageProductsScreen()));
          }),
          _buildCard(context, "Manage Orders", Icons.list_alt, () {
               Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminOrdersScreen()));
          }),
          _buildCard(context, "WhatsApp Orders", Icons.message, () {
               Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WhatsAppOrdersScreen()));
          }),
        ],
      ),
    );
  }

  Widget _buildCard(BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Card(
        margin: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 50, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
