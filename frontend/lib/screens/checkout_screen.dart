import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart'; // Direct API call for mock payment intent if needed, or put inside provider

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _phoneController;
  
  String _paymentMethod = 'COD'; // COD or Card
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _nameController = TextEditingController(text: user?['name'] ?? '');
    _addressController = TextEditingController(text: user?['address'] ?? '');
    _cityController = TextEditingController(text: 'Gojra'); // Default
    _phoneController = TextEditingController(text: user?['phone'] ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleCheckout() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final cart = Provider.of<CartProvider>(context, listen: false);

    try {
      if (_paymentMethod == 'Card') {
         await _processCardPayment(cart);
      } else {
         await _processCODPayment(cart);
      }
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
          _addressController.text,
          _cityController.text,
          _phoneController.text,
          paymentMethod: 'COD'
      );
      if (error == null) _showSuccess();
      else throw Exception(error);
  }

  Future<void> _processCardPayment(CartProvider cart) async {
      // 1. Create Payment Intent (Mock)
      final apiService = ApiService();
      final response = await apiService.dio.post('/payments/create-payment-intent', data: {
          'amount': cart.totalAmount,
      });

      if (response.statusCode == 200) {
          final clientSecret = response.data['clientSecret'];
          final id = response.data['id'];
          
          // 2. Simulate User entering card details and paying...
          await Future.delayed(const Duration(seconds: 2)); // Fake processing

          // 3. Confirm Order
          final error = await cart.placeOrder(
              _addressController.text,
              _cityController.text,
              _phoneController.text,
              paymentMethod: 'Card',
              paymentResult: {
                  'id': id,
                  'status': 'succeeded',
                  'update_time': DateTime.now().toIso8601String(),
                  'email_address': _nameController.text // placeholder
              }
          );
          
          if (error == null) _showSuccess();
          else throw Exception(error);

      } else {
          throw Exception("Payment initialization failed");
      }
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
               _buildTextField("Address", _addressController, Icons.home, maxLines: 2),
               const SizedBox(height: 10),
               _buildTextField("City", _cityController, Icons.location_city),
               
               const SizedBox(height: 24),
               _buildSectionTitle("Payment Method"),
               _buildPaymentOption("Cash on Delivery", 'COD', Icons.money),
               _buildPaymentOption("Credit/Debit Card (Stripe)", 'Card', Icons.credit_card),
               
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
                        : Text(_paymentMethod == 'COD' ? "Place Order" : "Pay Now (Mock)", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
          groupValue: _paymentMethod, 
          onChanged: (val) => setState(() => _paymentMethod = val.toString()),
          title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
          secondary: Icon(icon, color: Colors.black54),
          activeColor: Theme.of(context).colorScheme.primary,
          contentPadding: EdgeInsets.zero,
      );
  }
}
