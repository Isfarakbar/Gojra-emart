import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/store_settings_provider.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';
import 'order_success_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  late TextEditingController _nameController;
  late TextEditingController _streetController;
  late TextEditingController _areaController;
  late TextEditingController _cityController;
  late TextEditingController _phoneController;
  late TextEditingController _promoController;

  bool _isLoading = false;
  bool _settingsLoaded = false;
  bool _isApplyingPromo = false;
  Map<String, dynamic>? _appliedPromo;
  Map<String, dynamic>? _selectedDeliverySlot;
  DateTime? _selectedDeliveryDate;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final defaultAddress = Provider.of<AuthProvider>(
      context,
      listen: false,
    ).defaultAddress;
    _nameController = TextEditingController(text: user?['name'] ?? '');
    _streetController = TextEditingController(
      text: defaultAddress?['street'] ?? user?['address'] ?? '',
    );
    _areaController = TextEditingController(
      text: defaultAddress?['area'] ?? '',
    );
    _cityController = TextEditingController(
      text: defaultAddress?['city'] ?? '',
    );
    _phoneController = TextEditingController(
      text: defaultAddress?['phone'] ?? user?['phone'] ?? '',
    );
    _promoController = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final settings = Provider.of<StoreSettingsProvider>(
        context,
        listen: false,
      );
      await settings.fetchSettings();
      if (mounted) {
        setState(() {
          _settingsLoaded = true;
          _selectFirstAvailableSchedule(settings);
        });
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _streetController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _promoController.dispose();
    super.dispose();
  }

  double get _discountAmount {
    final discount = _appliedPromo?['discountAmount'];
    return discount is num ? discount.toDouble() : 0;
  }

  List<DateTime> _deliveryDates(StoreSettingsProvider settings) {
    final today = DateTime.now();
    return List.generate(
      settings.deliveryDaysAhead,
      (index) => DateTime(today.year, today.month, today.day + index),
    );
  }

  List<Map<String, dynamic>> _availableSlots(
    StoreSettingsProvider settings,
    DateTime date,
  ) {
    final now = DateTime.now();
    final minimumStart = now.add(
      Duration(minutes: settings.minimumSlotLeadMinutes),
    );
    return settings.activeDeliverySlots.where((slot) {
      final parts = (slot['startTime'] ?? '').toString().split(':');
      if (parts.length != 2) return false;
      final start = DateTime(
        date.year,
        date.month,
        date.day,
        int.tryParse(parts[0]) ?? 0,
        int.tryParse(parts[1]) ?? 0,
      );
      return start.isAfter(minimumStart);
    }).toList();
  }

  void _selectFirstAvailableSchedule(StoreSettingsProvider settings) {
    if (!settings.enableDeliverySlots || settings.activeDeliverySlots.isEmpty) {
      return;
    }
    for (final date in _deliveryDates(settings)) {
      final slots = _availableSlots(settings, date);
      if (slots.isNotEmpty) {
        _selectedDeliveryDate = date;
        _selectedDeliverySlot = slots.first;
        return;
      }
    }
  }

  Future<void> _applyPromo() async {
    final code = _promoController.text.trim();
    if (code.isEmpty) {
      _showError('Enter a promo code first.');
      return;
    }

    final cart = Provider.of<CartProvider>(context, listen: false);
    setState(() => _isApplyingPromo = true);
    try {
      final response = await _apiService.dio.post(
        '/promos/validate',
        data: {'code': code, 'itemsPrice': cart.totalAmount},
      );
      if (!mounted) return;
      setState(() => _appliedPromo = Map<String, dynamic>.from(response.data));
      Helpers.showSnackBar(context, 'Promo applied successfully.');
    } catch (error) {
      if (!mounted) return;
      setState(() => _appliedPromo = null);
      _showError('Promo code is invalid or cannot be applied.');
    } finally {
      if (mounted) setState(() => _isApplyingPromo = false);
    }
  }

  void _removePromo() {
    setState(() {
      _appliedPromo = null;
      _promoController.clear();
    });
  }

  Future<void> _handleCheckout() async {
    if (!_formKey.currentState!.validate()) return;

    final cart = Provider.of<CartProvider>(context, listen: false);
    final settings = Provider.of<StoreSettingsProvider>(context, listen: false);

    if (!settings.isStoreOpen) {
      _showError(settings.closedMessage);
      return;
    }

    if (!settings.meetsMinimumOrder(cart.totalAmount)) {
      _showError(
        'Minimum order is ${Helpers.formatCurrency(settings.minimumOrderAmount)}. Please add more items.',
      );
      return;
    }

    if (settings.enableDeliverySlots &&
        settings.activeDeliverySlots.isNotEmpty &&
        _selectedDeliverySlot == null) {
      _showError('Please select a delivery slot.');
      return;
    }
    if (settings.enableDeliverySlots &&
        settings.activeDeliverySlots.isNotEmpty &&
        _selectedDeliveryDate == null) {
      _showError('Please select a delivery date.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await cart.placeOrder(
        _streetController.text.trim(),
        _areaController.text.trim(),
        _cityController.text.trim(),
        _phoneController.text.trim(),
        paymentMethod: 'COD',
        promoCode: _appliedPromo?['code']?.toString(),
        deliverySlot: _selectedDeliverySlot,
        deliveryDate: _selectedDeliveryDate == null
            ? null
            : DateFormat('yyyy-MM-dd').format(_selectedDeliveryDate!),
      );

      if (result.isSuccess && result.order != null) {
        _showSuccess(result.order!);
      } else {
        throw Exception(result.error ?? 'Failed to place order.');
      }
    } catch (error) {
      final message = error.toString().replaceFirst('Exception: ', '').trim();
      _showError(message.isEmpty ? 'Failed to place order.' : message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSuccess(Map<String, dynamic> order) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => OrderSuccessScreen(order: order)),
      (route) => false,
    );
  }

  void _showError(String message) {
    Helpers.showSnackBar(context, message, isError: true);
  }

  void _applyAddress(Map<String, dynamic> address) {
    setState(() {
      _streetController.text = address['street'] ?? '';
      _areaController.text = address['area'] ?? '';
      _cityController.text = address['city'] ?? '';
      _phoneController.text = address['phone'] ?? '';
    });
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final settings = Provider.of<StoreSettingsProvider>(context);
    final deliveryFee = settings.deliveryFeeFor(cart.totalAmount);
    final grandTotal = (settings.totalFor(cart.totalAmount) - _discountAmount)
        .clamp(0, double.infinity);
    final canPlaceOrder =
        !_isLoading &&
        _settingsLoaded &&
        !settings.isLoading &&
        settings.isStoreOpen &&
        settings.meetsMinimumOrder(cart.totalAmount);

    return Scaffold(
      appBar: AppBar(title: const Text("Checkout"), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (settings.isLoading || !_settingsLoaded)
                const Padding(
                  padding: EdgeInsets.only(bottom: 16),
                  child: LinearProgressIndicator(minHeight: 3),
                ),
              if (!settings.isStoreOpen)
                _buildNotice(settings.closedMessage, isError: true),
              if (settings.isStoreOpen &&
                  !settings.meetsMinimumOrder(cart.totalAmount))
                _buildNotice(
                  'Minimum order is ${Helpers.formatCurrency(settings.minimumOrderAmount)}.',
                  isError: true,
                ),
              if (auth.addresses.isNotEmpty) _buildSavedAddressSelector(auth),
              _buildSectionTitle("Shipping Address"),
              const SizedBox(height: 10),
              _buildTextField("Full Name", _nameController, Icons.person),
              const SizedBox(height: 10),
              _buildTextField(
                "Phone Number",
                _phoneController,
                Icons.phone,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 10),
              _buildTextField(
                "Street Address",
                _streetController,
                Icons.home,
                maxLines: 2,
              ),
              const SizedBox(height: 10),
              _buildTextField("Area / Mohalla", _areaController, Icons.place),
              const SizedBox(height: 10),
              _buildTextField("City", _cityController, Icons.location_city),
              const SizedBox(height: 24),
              _buildDeliverySlotSection(settings),
              const SizedBox(height: 24),
              _buildSectionTitle("Promo Code"),
              const SizedBox(height: 10),
              _buildPromoBox(),
              const SizedBox(height: 24),
              _buildSectionTitle("Payment Method"),
              _buildPaymentOption("Cash on Delivery", 'COD', Icons.money),
              const SizedBox(height: 24),
              _buildSectionTitle("Order Summary"),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    _buildSummaryRow(
                      "Items",
                      Helpers.formatCurrency(cart.totalAmount),
                    ),
                    const SizedBox(height: 8),
                    _buildSummaryRow(
                      "Delivery",
                      deliveryFee == 0
                          ? "Free"
                          : Helpers.formatCurrency(deliveryFee),
                    ),
                    if (_discountAmount > 0) ...[
                      const SizedBox(height: 8),
                      _buildSummaryRow(
                        "Discount (${_appliedPromo?['code'] ?? ''})",
                        "-${Helpers.formatCurrency(_discountAmount)}",
                      ),
                    ],
                    const Divider(height: 22),
                    _buildSummaryRow(
                      "Total Amount",
                      Helpers.formatCurrency(grandTotal),
                      isTotal: true,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.timer_outlined,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "Estimated delivery: ${settings.estimatedDeliveryMinutes} minutes",
                          style: GoogleFonts.inter(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: canPlaceOrder ? _handleCheckout : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          "Place Order",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildSavedAddressSelector(AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle("Saved Addresses"),
        const SizedBox(height: 10),
        SizedBox(
          height: 98,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: auth.addresses.length,
            separatorBuilder: (context, index) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final address = Map<String, dynamic>.from(auth.addresses[index]);
              final isDefault = address['isDefault'] == true;
              return InkWell(
                onTap: () => _applyAddress(address),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: 230,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDefault
                          ? Theme.of(context).colorScheme.primary
                          : Colors.grey.shade200,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              address['label'] ?? 'Address',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          if (isDefault)
                            Icon(
                              Icons.check_circle,
                              color: Theme.of(context).colorScheme.primary,
                              size: 16,
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${address['street']}, ${address['area']}, ${address['city']}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          color: Colors.grey[600],
                          fontSize: 12,
                          height: 1.25,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 18),
      ],
    );
  }

  Widget _buildNotice(String message, {bool isError = false}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError
            ? Colors.red.withValues(alpha: 0.08)
            : Colors.green.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            isError ? Icons.info_outline : Icons.check_circle_outline,
            size: 18,
            color: isError
                ? Colors.redAccent
                : Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isError
                    ? Colors.redAccent
                    : Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliverySlotSection(StoreSettingsProvider settings) {
    final dates = _deliveryDates(settings);
    final selectedDate = _selectedDeliveryDate;
    final slots = selectedDate == null
        ? <Map<String, dynamic>>[]
        : _availableSlots(settings, selectedDate);

    if (!settings.enableDeliverySlots || settings.activeDeliverySlots.isEmpty) {
      return _buildNotice(
        'Delivery time: estimated ${settings.estimatedDeliveryMinutes} minutes after confirmation.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Delivery Date'),
        const SizedBox(height: 10),
        SizedBox(
          height: 70,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: dates.length,
            separatorBuilder: (context, index) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final date = dates[index];
              final hasSlots = _availableSlots(settings, date).isNotEmpty;
              final isSelected =
                  selectedDate != null &&
                  DateUtils.isSameDay(selectedDate, date);
              return InkWell(
                onTap: hasSlots
                    ? () {
                        final available = _availableSlots(settings, date);
                        setState(() {
                          _selectedDeliveryDate = date;
                          _selectedDeliverySlot = available.first;
                        });
                      }
                    : null,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 82,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Theme.of(
                            context,
                          ).colorScheme.primary.withValues(alpha: 0.08)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Colors.grey.shade300,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        index == 0
                            ? 'Today'
                            : index == 1
                            ? 'Tomorrow'
                            : DateFormat('EEE').format(date),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: hasSlots ? Colors.grey[700] : Colors.grey[400],
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        DateFormat('d MMM').format(date),
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: hasSlots
                              ? (isSelected
                                    ? Theme.of(context).colorScheme.primary
                                    : Colors.black87)
                              : Colors.grey[400],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 18),
        _buildSectionTitle('Delivery Slot'),
        const SizedBox(height: 10),
        if (slots.isEmpty)
          _buildNotice('No delivery slots remain for this date.', isError: true)
        else
          SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: slots.length,
              separatorBuilder: (context, index) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final slot = slots[index];
                final isSelected =
                    _selectedDeliverySlot?['label'] == slot['label'] &&
                    _selectedDeliverySlot?['startTime'] == slot['startTime'] &&
                    _selectedDeliverySlot?['endTime'] == slot['endTime'];

                return InkWell(
                  onTap: () => setState(() => _selectedDeliverySlot = slot),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    width: 170,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Theme.of(
                              context,
                            ).colorScheme.primary.withValues(alpha: 0.08)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected
                            ? Theme.of(context).colorScheme.primary
                            : Colors.grey.shade300,
                        width: isSelected ? 1.4 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                slot['label'] ?? 'Delivery',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check_circle,
                                size: 17,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${slot['startTime']} - ${slot['endTime']}',
                          style: GoogleFonts.inter(
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
            fontSize: isTotal ? 16 : 14,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: isTotal ? 18 : 14,
            color: isTotal
                ? Theme.of(context).colorScheme.primary
                : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildPromoBox() {
    final appliedCode = _appliedPromo?['code']?.toString();
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: appliedCode != null
              ? Theme.of(context).colorScheme.primary
              : Colors.grey.shade300,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _promoController,
                  enabled: appliedCode == null && !_isApplyingPromo,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'Enter promo code',
                    prefixIcon: const Icon(Icons.local_offer_outlined),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isApplyingPromo
                      ? null
                      : appliedCode == null
                      ? _applyPromo
                      : _removePromo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: appliedCode == null
                        ? Theme.of(context).colorScheme.primary
                        : Colors.redAccent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: _isApplyingPromo
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(appliedCode == null ? 'Apply' : 'Remove'),
                ),
              ),
            ],
          ),
          if (appliedCode != null) ...[
            const SizedBox(height: 10),
            Text(
              '$appliedCode applied. You saved ${Helpers.formatCurrency(_discountAmount)}.',
              style: GoogleFonts.inter(
                color: Theme.of(context).colorScheme.primary,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    IconData icon, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      inputFormatters: keyboardType == TextInputType.phone
          ? [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(11),
            ]
          : [],
      validator: (value) {
        if (value == null || value.trim().isEmpty) return "Required";
        if (keyboardType == TextInputType.phone && value.trim().length < 10) {
          return "Invalid phone number";
        }
        return null;
      },
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20, color: Colors.grey),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(
          vertical: 14,
          horizontal: 16,
        ),
      ),
    );
  }

  Widget _buildPaymentOption(String title, String value, IconData icon) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: Colors.black54),
      title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
      trailing: Icon(
        Icons.check_circle,
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}
