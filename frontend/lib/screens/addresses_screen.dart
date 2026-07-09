import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/helpers.dart';

class AddressesScreen extends StatelessWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final addresses = auth.addresses;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "My Addresses",
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: addresses.isEmpty
          ? _EmptyAddresses(onAdd: () => _openAddressSheet(context))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: addresses.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final address = Map<String, dynamic>.from(addresses[index]);
                return _AddressCard(
                  address: address,
                  onEdit: () => _openAddressSheet(context, address: address),
                  onDelete: () => _deleteAddress(context, address),
                  onDefault: () => _setDefault(context, address),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddressSheet(context),
        icon: const Icon(Icons.add_location_alt_outlined),
        label: const Text("Add Address"),
      ),
    );
  }

  Future<void> _setDefault(
    BuildContext context,
    Map<String, dynamic> address,
  ) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final error = await auth.setDefaultAddress(address['_id']);
    if (!context.mounted) return;
    Helpers.showSnackBar(
      context,
      error ?? 'Default address updated.',
      isError: error != null,
    );
  }

  Future<void> _deleteAddress(
    BuildContext context,
    Map<String, dynamic> address,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete address?'),
        content: const Text('This address will be removed from your account.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final error = await auth.deleteAddress(address['_id']);
    if (!context.mounted) return;
    Helpers.showSnackBar(
      context,
      error ?? 'Address deleted.',
      isError: error != null,
    );
  }

  Future<void> _openAddressSheet(
    BuildContext context, {
    Map<String, dynamic>? address,
  }) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _AddressForm(address: address),
    );
  }
}

class _AddressCard extends StatelessWidget {
  final Map<String, dynamic> address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onDefault;

  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
    required this.onDefault,
  });

  @override
  Widget build(BuildContext context) {
    final isDefault = address['isDefault'] == true;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDefault
              ? Theme.of(context).colorScheme.primary
              : Colors.grey.shade200,
          width: isDefault ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  address['label'] ?? 'Address',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              if (isDefault)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).colorScheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Text(
                    'Default',
                    style: GoogleFonts.inter(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 11,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '${address['street']}, ${address['area']}, ${address['city']}',
            style: GoogleFonts.inter(color: Colors.grey[700], height: 1.4),
          ),
          const SizedBox(height: 4),
          Text(
            address['phone'] ?? '',
            style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 12),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (!isDefault)
                TextButton(
                  onPressed: onDefault,
                  child: const Text('Set default'),
                ),
              const Spacer(),
              IconButton(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined),
              ),
              IconButton(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AddressForm extends StatefulWidget {
  final Map<String, dynamic>? address;

  const _AddressForm({this.address});

  @override
  State<_AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends State<_AddressForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _labelController;
  late final TextEditingController _streetController;
  late final TextEditingController _areaController;
  late final TextEditingController _cityController;
  late final TextEditingController _phoneController;
  bool _isDefault = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final address = widget.address;
    _labelController = TextEditingController(text: address?['label'] ?? 'Home');
    _streetController = TextEditingController(text: address?['street'] ?? '');
    _areaController = TextEditingController(text: address?['area'] ?? '');
    _cityController = TextEditingController(text: address?['city'] ?? '');
    _phoneController = TextEditingController(text: address?['phone'] ?? '');
    _isDefault = address?['isDefault'] == true;
  }

  @override
  void dispose() {
    _labelController.dispose();
    _streetController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    final payload = {
      'label': _labelController.text.trim(),
      'street': _streetController.text.trim(),
      'area': _areaController.text.trim(),
      'city': _cityController.text.trim(),
      'phone': _phoneController.text.trim(),
      'isDefault': _isDefault,
    };

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final error = widget.address == null
        ? await auth.addAddress(payload)
        : await auth.updateAddress(widget.address!['_id'], payload);

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (error == null) {
      Navigator.pop(context);
      Helpers.showSnackBar(context, 'Address saved.');
    } else {
      Helpers.showSnackBar(context, error, isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.address == null ? 'Add Address' : 'Edit Address',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
              ),
              const SizedBox(height: 16),
              _field('Label', _labelController, Icons.label_outline),
              _field(
                'Street Address',
                _streetController,
                Icons.home_outlined,
                maxLines: 2,
              ),
              _field('Area / Mohalla', _areaController, Icons.place_outlined),
              _field('City', _cityController, Icons.location_city_outlined),
              _field(
                'Phone',
                _phoneController,
                Icons.phone_outlined,
                keyboardType: TextInputType.phone,
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: _isDefault,
                onChanged: (value) => setState(() => _isDefault = value),
                title: Text(
                  'Use as default address',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  child: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Save Address'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController controller,
    IconData icon, {
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        validator: (value) =>
            value == null || value.trim().isEmpty ? 'Required' : null,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}

class _EmptyAddresses extends StatelessWidget {
  final VoidCallback onAdd;

  const _EmptyAddresses({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.location_off_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No saved addresses',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add your delivery address once and use it faster at checkout.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add_location_alt_outlined),
              label: const Text('Add Address'),
            ),
          ],
        ),
      ),
    );
  }
}
