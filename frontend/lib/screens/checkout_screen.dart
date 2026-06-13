import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import 'package:flutter/services.dart';
import '../utils/helpers.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _streetController;
  late TextEditingController _areaController;
  late TextEditingController _cityController;
  late TextEditingController _phoneController;
  
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _nameController = TextEditingController(text: user?['name'] ?? '');
    _streetController = TextEditingController(text: user?['address'] ?? '');
    _areaController = TextEditingController();
    _cityController = TextEditingController(text: 'Gojra'); // Default
    _phoneController = TextEditingController(text: user?['phone'] ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _streetController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleCheckout() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final cart = Provider.of<CartProvider>(context, listen: false);

    try {
      await _processCODPayment(cart);
    } catch (e) {
       // Clean error message if it's an exception
       final msg = e.toString().contains("Exception:") ? e.toString().replaceAll("Exception: ", "") : e.toString();
       _showError(msg);
    } finally {
        if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _processCODPayment(CartProvider cart) async {
      final error = await cart.placeOrder(
          _streetController.text,
          _areaController.text,
          _cityController.text,
          _phoneController.text,
          paymentMethod: 'COD'
      );
      if (error == null) _showSuccess();
      else throw Exception(error);
  }

  void _showSuccess() {
      Helpers.showSnackBar(context, 'Order Placed Successfully! 🎉');
      Navigator.of(context).popUntil((route) => route.isFirst); // Go to Home
  }

  void _showError(String message) {
      Helpers.showSnackBar(context, message, isError: true);
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("Checkout"), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               _buildSectionTitle("Shipping Address"),
               const SizedBox(height: 10),
               _buildTextField("Full Name", _nameController, Icons.person),
               const SizedBox(height: 10),
               _buildTextField("Phone Number", _phoneController, Icons.phone, keyboardType: TextInputType.phone),
               const SizedBox(height: 10),
               _buildTextField("Street Address", _streetController, Icons.home, maxLines: 2),
               const SizedBox(height: 10),
               _buildTextField("Area / Mohalla", _areaController, Icons.place),
               const SizedBox(height: 10),
               _buildTextField("City", _cityController, Icons.location_city),
               
                const SizedBox(height: 24),
                _buildSectionTitle("Payment Method"),
                _buildPaymentOption("Cash on Delivery", 'COD', Icons.money),
               
               const SizedBox(height: 24),
               _buildSectionTitle("Order Summary"),
               Container(
                   padding: const EdgeInsets.all(16),
                   decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(12)),
                   child: Row(
                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
                       children: [
                           const Text("Total Amount", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                           Text(Helpers.formatCurrency(cart.totalAmount), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Theme.of(context).colorScheme.primary)),
                       ],
                   ),
               ),

               const SizedBox(height: 32),
               SizedBox(
                   width: double.infinity,
                   height: 50,
                   child: ElevatedButton(
                       onPressed: _isLoading ? null : _handleCheckout,
                       style: ElevatedButton.styleFrom(
                           backgroundColor: Theme.of(context).colorScheme.primary,
                           shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                       ),
                       child: _isLoading 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text("Place Order", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                   ),
               )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
      return Text(title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold));
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {TextInputType keyboardType = TextInputType.text, int maxLines = 1}) {
      return TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          inputFormatters: keyboardType == TextInputType.phone 
              ? [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(11)] 
              : [],
          validator: (val) {
             if (val == null || val.isEmpty) return "Required";
             if (keyboardType == TextInputType.phone) {
                if (val.length < 10) return "Invalid Phone Number";
             }
             return null;
          },
          decoration: InputDecoration(
              labelText: label,
              prefixIcon: Icon(icon, size: 20, color: Colors.grey),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
          ),
      );
  }

  Widget _buildPaymentOption(String title, String value, IconData icon) {
      return RadioListTile(
          value: value, 
          groupValue: 'COD', 
          onChanged: null,
          title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
          secondary: Icon(icon, color: Colors.black54),
          activeColor: Theme.of(context).colorScheme.primary,
          contentPadding: EdgeInsets.zero,
      );
  }
}
