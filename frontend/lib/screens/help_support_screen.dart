import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/store_settings_provider.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _apiService = ApiService();

  bool _isLoading = true;
  bool _isSubmitting = false;
  String _category = 'order_issue';
  String? _selectedOrderId;
  List<dynamic> _orders = [];
  List<dynamic> _tickets = [];

  final List<Map<String, String>> _categories = const [
    {'value': 'order_issue', 'label': 'Order issue'},
    {'value': 'delivery_issue', 'label': 'Delivery issue'},
    {'value': 'product_quality', 'label': 'Product quality'},
    {'value': 'refund_return', 'label': 'Return or refund'},
    {'value': 'account_issue', 'label': 'Account issue'},
    {'value': 'other', 'label': 'Other'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<StoreSettingsProvider>(context, listen: false).fetchSettings();
    });
    _loadSupportData();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadSupportData() async {
    setState(() => _isLoading = true);
    try {
      final responses = await Future.wait([
        _apiService.dio.get('/orders/myorders'),
        _apiService.dio.get('/support/my'),
      ]);

      if (!mounted) return;
      final ticketsData = responses[1].data;
      setState(() {
        _orders = responses[0].data is List ? responses[0].data : [];
        _tickets = ticketsData is List ? ticketsData : (ticketsData['tickets'] ?? []);
      });
    } catch (error) {
      debugPrint('Failed to load support data: $error');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      await _apiService.dio.post('/support', data: {
        'subject': _subjectController.text.trim(),
        'message': _messageController.text.trim(),
        'category': _category,
        if (_selectedOrderId != null) 'order': _selectedOrderId,
      });

      _subjectController.clear();
      _messageController.clear();
      setState(() => _selectedOrderId = null);
      await _loadSupportData();

      if (mounted) {
        Helpers.showSnackBar(context, 'Support request submitted.');
      }
    } catch (error) {
      String message = 'Could not submit support request.';
      if (error is DioException) {
        message = error.response?.data?['message'] ?? message;
      }
      if (mounted) Helpers.showSnackBar(context, message, isError: true);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _launchSupportUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<StoreSettingsProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        title: Text(
          'Help & Support',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.black),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadSupportData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 20),
              _buildTicketForm(),
              const SizedBox(height: 20),
              _buildContactSection(settings),
              const SizedBox(height: 20),
              _buildTicketHistory(),
              const SizedBox(height: 20),
              _buildFaqSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF2E7D32),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.support_agent, color: Colors.white, size: 34),
          const SizedBox(height: 14),
          Text(
            'How can we help?',
            style: GoogleFonts.poppins(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            'Report an order issue, ask a question, or contact our team directly.',
            style: GoogleFonts.inter(color: Colors.white.withValues(alpha: 0.86), height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketForm() {
    return _sectionCard(
      title: 'Submit a request',
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            DropdownButtonFormField<String>(
              initialValue: _category,
              items: _categories.map((category) {
                return DropdownMenuItem(
                  value: category['value'],
                  child: Text(category['label']!, style: GoogleFonts.inter()),
                );
              }).toList(),
              onChanged: (value) => setState(() => _category = value ?? 'other'),
              decoration: _inputDecoration('Issue type'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _selectedOrderId,
              items: [
                DropdownMenuItem<String>(
                  value: null,
                  child: Text('No specific order', style: GoogleFonts.inter()),
                ),
                ..._orders.take(10).map((order) {
                  final id = order['_id']?.toString() ?? '';
                  return DropdownMenuItem<String>(
                    value: id,
                    child: Text(
                      'Order #${id.length > 6 ? id.substring(id.length - 6).toUpperCase() : id}',
                      style: GoogleFonts.inter(),
                    ),
                  );
                }),
              ],
              onChanged: (value) => setState(() => _selectedOrderId = value),
              decoration: _inputDecoration('Related order'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _subjectController,
              textInputAction: TextInputAction.next,
              decoration: _inputDecoration('Subject'),
              validator: (value) {
                if (value == null || value.trim().length < 4) {
                  return 'Please enter a clear subject';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _messageController,
              minLines: 4,
              maxLines: 6,
              maxLength: 1000,
              decoration: _inputDecoration('Tell us what happened'),
              validator: (value) {
                if (value == null || value.trim().length < 10) {
                  return 'Please add a little more detail';
                }
                return null;
              },
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitTicket,
                icon: _isSubmitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send_rounded),
                label: Text(_isSubmitting ? 'Submitting...' : 'Submit Request'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactSection(StoreSettingsProvider settings) {
    return _sectionCard(
      title: 'Contact us',
      child: Column(
        children: [
          _buildContactOption(
            icon: Icons.headset_mic,
            title: 'Customer Service',
            subtitle: settings.supportPhone.isEmpty ? 'Phone support not configured' : settings.supportPhone,
            color: Colors.blue,
            onTap: settings.supportPhone.isEmpty ? () {} : () => _launchSupportUrl('tel:${settings.supportPhone}'),
          ),
          const SizedBox(height: 10),
          _buildContactOption(
            icon: Icons.email,
            title: 'Email Support',
            subtitle: settings.supportEmail.isEmpty ? 'Email support not configured' : settings.supportEmail,
            color: Colors.orange,
            onTap: settings.supportEmail.isEmpty ? () {} : () => _launchSupportUrl('mailto:${settings.supportEmail}'),
          ),
          const SizedBox(height: 10),
          _buildContactOption(
            icon: Icons.chat,
            title: 'WhatsApp',
            subtitle: settings.supportWhatsapp.isEmpty ? 'WhatsApp support not configured' : 'Chat with us now',
            color: Colors.green,
            onTap: settings.supportWhatsapp.isEmpty ? () {} : () => _launchSupportUrl('https://wa.me/${settings.supportWhatsapp}'),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketHistory() {
    return _sectionCard(
      title: 'Your requests',
      child: _isLoading
          ? const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
          : _tickets.isEmpty
              ? Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text('No support requests yet.', style: GoogleFonts.inter(color: Colors.grey[600])),
                )
              : Column(
                  children: _tickets.take(5).map((ticket) => _buildTicketTile(ticket)).toList(),
                ),
    );
  }

  Widget _buildTicketTile(dynamic ticket) {
    final status = ticket['status'] ?? 'Open';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  ticket['subject'] ?? 'Support request',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14),
                ),
              ),
              _statusBadge(status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            ticket['message'] ?? '',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(color: Colors.grey[700], fontSize: 13, height: 1.35),
          ),
          if ((ticket['adminReply'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF2E7D32).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                ticket['adminReply'],
                style: GoogleFonts.inter(color: const Color(0xFF1B5E20), fontSize: 13, height: 1.35),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFaqSection() {
    return _sectionCard(
      title: 'Frequently asked questions',
      child: Column(
        children: [
          _buildExpansionTile('How do I track my order?', 'You can track your order status in the My Orders section of the app.'),
          _buildExpansionTile('What payment methods do you accept?', 'We currently accept Cash on Delivery only.'),
          _buildExpansionTile('How can I return an item?', 'Submit a support request within 24 hours of delivery and include the order number.'),
          _buildExpansionTile('Do you deliver to my area?', 'You can place orders from any location. Add a clear address and allow location access at checkout.'),
        ],
      ),
    );
  }

  Widget _sectionCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
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
          Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _buildContactOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                  Text(subtitle, style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 12)),
                ],
              ),
            ),
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
        borderRadius: BorderRadius.circular(12),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 14),
        title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Text(content, style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 13, height: 1.5)),
          ),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    final color = status == 'Resolved'
        ? Colors.green
        : status == 'In Progress'
            ? Colors.blue
            : status == 'Closed'
                ? Colors.grey
                : Colors.orange;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(status, style: GoogleFonts.inter(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.inter(color: Colors.grey[600]),
      filled: true,
      fillColor: Colors.grey[50],
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey[200]!)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey[200]!)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF2E7D32), width: 1.4)),
    );
  }
}
