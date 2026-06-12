import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'wishlist_screen.dart';
import 'edit_profile_screen.dart';
import 'notifications_screen.dart';
import 'help_support_screen.dart';
import 'my_orders_screen.dart';
import 'cart_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text("My Profile", style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: theme.colorScheme.primary,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Avatar
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                    child: Text(
                      (user?['name'] ?? "G")[0].toUpperCase(),
                      style: GoogleFonts.poppins(fontSize: 40, fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: GestureDetector(
                      onTap: () {
                         Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EditProfileScreen()));
                      },
                      child: CircleAvatar(
                        radius: 16,
                        backgroundColor: theme.colorScheme.primary,
                        child: const Icon(Icons.edit, color: Colors.white, size: 16),
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(user?['name'] ?? "Guest User", style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold)),
            Text(user?['email'] ?? "", style: GoogleFonts.inter(fontSize: 14, color: Colors.grey)),
            const SizedBox(height: 24),

            // Stats Row
            Card(
              elevation: 4,
              shadowColor: Colors.black12,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStatItem(context, "Orders", Icons.shopping_bag_outlined, () {
                       Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MyOrdersScreen()));
                    }),
                    Container(width: 1, height: 40, color: Colors.grey[200]),
                    _buildStatItem(context, "Wishlist", Icons.favorite_border, () {
                       Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WishlistScreen()));
                    }),
                    Container(width: 1, height: 40, color: Colors.grey[200]),
                     _buildStatItem(context, "Cart", Icons.shopping_cart_outlined, () {
                       Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CartScreen()));
                    }),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Divider(thickness: 1, height: 1),
            const SizedBox(height: 10),
            _buildProfileItem(context, icon: Icons.person_outline, title: "Edit Profile", onTap: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EditProfileScreen()));
            }),
            _buildProfileItem(context, icon: Icons.favorite_border, title: "My Wishlist", onTap: () {
               Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WishlistScreen()));
            }),
            _buildProfileItem(context, icon: Icons.location_on_outlined, title: "My Addresses", onTap: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EditProfileScreen()));
            }),
            _buildProfileItem(context, icon: Icons.notifications_outlined, title: "Notifications", onTap: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen()));
            }),
            _buildProfileItem(context, icon: Icons.help_outline, title: "Help & Support", onTap: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const HelpSupportScreen()));
            }),
            
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 20),
            
            // Logout
            ListTile(
              onTap: () {
                authProvider.logout();
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.logout, color: Colors.red),
              ),
              title: Text("Logout", style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.red)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.red),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileItem(BuildContext context, {required IconData icon, required String title, VoidCallback? onTap}) {
    return ListTile(
      onTap: onTap ?? () {},
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: Colors.black87),
      ),
      title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
    );
  }

  Widget _buildStatItem(BuildContext context, String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary, size: 28),
            const SizedBox(height: 4),
            Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
