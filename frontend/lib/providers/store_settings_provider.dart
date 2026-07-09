import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class StoreSettingsProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  bool _isStoreOpen = true;
  String _closedMessage = 'Store is currently closed. Please try again later.';
  double _minimumOrderAmount = 0;
  double _deliveryFee = 0;
  double _freeDeliveryAbove = 0;
  int _estimatedDeliveryMinutes = 45;
  bool _enableDeliverySlots = true;
  int _deliveryDaysAhead = 7;
  int _minimumSlotLeadMinutes = 60;
  List<Map<String, dynamic>> _deliverySlots = [];
  String _supportPhone = '';
  String _supportEmail = '';
  String _supportWhatsapp = '';

  bool get isLoading => _isLoading;
  bool get isStoreOpen => _isStoreOpen;
  String get closedMessage => _closedMessage;
  double get minimumOrderAmount => _minimumOrderAmount;
  double get deliveryFee => _deliveryFee;
  double get freeDeliveryAbove => _freeDeliveryAbove;
  int get estimatedDeliveryMinutes => _estimatedDeliveryMinutes;
  bool get enableDeliverySlots => _enableDeliverySlots;
  int get deliveryDaysAhead => _deliveryDaysAhead;
  int get minimumSlotLeadMinutes => _minimumSlotLeadMinutes;
  List<Map<String, dynamic>> get deliverySlots =>
      List.unmodifiable(_deliverySlots);
  List<Map<String, dynamic>> get activeDeliverySlots => _deliverySlots
      .where((slot) => slot['isActive'] != false)
      .toList(growable: false);
  String get supportPhone => _supportPhone;
  String get supportEmail => _supportEmail;
  String get supportWhatsapp => _supportWhatsapp;

  double deliveryFeeFor(double subtotal) {
    if (_freeDeliveryAbove > 0 && subtotal >= _freeDeliveryAbove) {
      return 0;
    }
    return _deliveryFee;
  }

  double totalFor(double subtotal) => subtotal + deliveryFeeFor(subtotal);

  bool meetsMinimumOrder(double subtotal) => subtotal >= _minimumOrderAmount;

  Future<void> fetchSettings() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.dio.get('/settings/store');
      final data = response.data as Map<String, dynamic>;

      _isStoreOpen = data['isStoreOpen'] ?? true;
      _closedMessage = data['closedMessage'] ?? _closedMessage;
      _minimumOrderAmount = _toDouble(data['minimumOrderAmount']);
      _deliveryFee = _toDouble(data['deliveryFee']);
      _freeDeliveryAbove = _toDouble(data['freeDeliveryAbove']);
      _estimatedDeliveryMinutes =
          (data['estimatedDeliveryMinutes'] as num?)?.toInt() ?? 45;
      _enableDeliverySlots = data['enableDeliverySlots'] ?? true;
      _deliveryDaysAhead =
          (data['deliveryDaysAhead'] as num?)?.toInt().clamp(1, 30) ?? 7;
      _minimumSlotLeadMinutes =
          (data['minimumSlotLeadMinutes'] as num?)?.toInt().clamp(0, 1440) ??
          60;
      _deliverySlots = (data['deliverySlots'] as List? ?? [])
          .map((slot) => Map<String, dynamic>.from(slot))
          .toList();
      _supportPhone = data['supportPhone'] ?? '';
      _supportEmail = data['supportEmail'] ?? '';
      _supportWhatsapp = data['supportWhatsapp'] ?? '';
    } catch (error) {
      debugPrint('Failed to load store settings: $error');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }
}
