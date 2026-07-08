import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  static const String _supportPhone = String.fromEnvironment('SUPPORT_PHONE');
  static const String _supportEmail = String.fromEnvironment('SUPPORT_EMAIL');
  static const String _supportWhatsapp = String.fromEnvironment('SUPPORT_WHATSAPP');

  Future<void> _launchSupportUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text("Help & Support", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.black)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
             Text("How can we help you?", style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold)),
             const SizedBox(height: 8),
             Text("Find answers to frequent questions or contact us directly.", style: GoogleFonts.inter(color: Colors.grey, fontSize: 14)),
             const SizedBox(height: 32),
             
             Text("Contact Us", style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
             const SizedBox(height: 16),
             
             _buildContactOption(
               icon: Icons.headset_mic,
               title: "Customer Service",
               subtitle: _supportPhone.isEmpty ? "Phone support not configured" : _supportPhone,
               color: Colors.blue,
               onTap: _supportPhone.isEmpty ? () {} : () => _launchSupportUrl('tel:$_supportPhone'),
             ),
             const SizedBox(height: 12),
             _buildContactOption(
               icon: Icons.email,
               title: "Email Support",
               subtitle: _supportEmail.isEmpty ? "Email support not configured" : _supportEmail,
               color: Colors.orange,
               onTap: _supportEmail.isEmpty ? () {} : () => _launchSupportUrl('mailto:$_supportEmail'),
             ),
             const SizedBox(height: 12),
             _buildContactOption(
               icon: Icons.chat,
               title: "WhatsApp",
               subtitle: _supportWhatsapp.isEmpty ? "WhatsApp support not configured" : "Chat with us now",
               color: Colors.green,
               onTap: _supportWhatsapp.isEmpty ? () {} : () => _launchSupportUrl('https://wa.me/$_supportWhatsapp'),
             ),

             const SizedBox(height: 32),
             Text("Frequently Asked Questions", style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
             const SizedBox(height: 16),
             
             _buildExpansionTile("How do I track my order?", "You can track your order status in the 'My Orders' section of the app."),
             _buildExpansionTile("What payment methods do you accept?", "We currently accept Cash on Delivery (COD) only."),
             _buildExpansionTile("How can I return an item?", "Please contact our support team within 24 hours of delivery for returns."),
             _buildExpansionTile("Do you deliver to my area?", "You can place orders from any location. Please enter your delivery address clearly and allow location access at checkout so we can capture accurate GPS coordinates."),
          ],
        ),
      ),
    );
  }

  Widget _buildContactOption({required IconData icon, required String title, required String subtitle, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                Text(subtitle, style: GoogleFonts.inter(color: Colors.grey, fontSize: 12)),
              ],
            ),
            const Spacer(),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildExpansionTile(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[200]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ExpansionTile(
        title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(content, style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 13, height: 1.5)),
          ),
        ],
      ),
    );
  }
}
