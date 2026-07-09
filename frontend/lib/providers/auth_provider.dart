import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import '../services/api_service.dart';
import '../services/notification_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final _storage = const FlutterSecureStorage();
  static const String _googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue:
        '357186664125-bb22gkb81i3klrcl7jttc1sive0vake6.apps.googleusercontent.com',
  );

  String? _token;
  Map<String, dynamic>? _user;
  bool _notificationsInitialized = false;

  AuthProvider() {
    ApiService.accountAccessError.addListener(_handleAccountAccessError);
  }

  void _handleAccountAccessError() {
    if (ApiService.accountAccessError.value == null || _token == null) return;
    _user = null;
    _token = null;
    _notificationsInitialized = false;
    notifyListeners();
  }

  @override
  void dispose() {
    ApiService.accountAccessError.removeListener(_handleAccountAccessError);
    super.dispose();
  }

  bool get isAuthenticated => _token != null;
  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  List<dynamic> get addresses => List<dynamic>.from(_user?['addresses'] ?? []);
  Map<String, dynamic>? get defaultAddress {
    for (final address in addresses) {
      if (address is Map && address['isDefault'] == true) {
        return Map<String, dynamic>.from(address);
      }
    }
    if (addresses.isNotEmpty && addresses.first is Map) {
      return Map<String, dynamic>.from(addresses.first);
    }
    return null;
  }

  bool get needsProfileSetup {
    final name = (_user?['name'] ?? '').toString().trim();
    final address = (_user?['address'] ?? '').toString().trim();
    return _token != null &&
        (name.isEmpty || name.toLowerCase() == 'new user' || address.isEmpty);
  }

  Future<String?> googleLogin() async {
    try {
      final signIn = GoogleSignIn.instance;
      await signIn.initialize(serverClientId: _googleWebClientId);
      final account = await signIn.authenticate();
      final googleIdToken = account.authentication.idToken;

      if (googleIdToken == null) {
        return 'Google could not verify your account. Please try again.';
      }

      // Sign into Firebase Auth with the Google credential to get a Firebase ID token
      final credential = fb.GoogleAuthProvider.credential(
        idToken: googleIdToken,
      );
      final fbUser = await fb.FirebaseAuth.instance.signInWithCredential(
        credential,
      );
      final firebaseIdToken = await fbUser.user?.getIdToken();

      if (firebaseIdToken == null) {
        return 'Firebase authentication failed. Please try again.';
      }

      final response = await _apiService.dio.post(
        '/auth/google',
        data: {'token': firebaseIdToken},
      );

      if (response.statusCode == 200) {
        _token = response.data['token'];
        _user = {
          ...Map<String, dynamic>.from(response.data),
          'photoUrl': account.photoUrl,
        };
        await _saveSession();
        await _registerNotifications();
        notifyListeners();
        return null;
      }
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) {
        return 'Google sign-in was cancelled.';
      }
      return e.description ?? 'Google sign-in failed.';
    } on DioException catch (e) {
      return e.response?.data['message'] ?? 'Google sign-in failed.';
    } catch (e) {
      return 'Google sign-in is not configured on this device yet.';
    }
    return 'Google sign-in failed.';
  }

  Future<String?> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      if (response.statusCode == 200) {
        _token = response.data['token'];
        _user = response.data;
        await _saveSession();
        await _registerNotifications();
        notifyListeners();
        return null; // No error
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return e.response?.data['message'] ?? 'Login failed';
      }
      return 'Connection error. Please check your internet.';
    } catch (e) {
      return 'An unexpected error occurred.';
    }
    return 'Login failed';
  }

  Future<String?> register(
    String name,
    String email,
    String password,
    String phone,
  ) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
        },
      );

      if (response.statusCode == 201) {
        _token = response.data['token'];
        _user = response.data;
        await _saveSession();
        await _registerNotifications();
        notifyListeners();
        return null; // No error
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return e.response?.data['message'] ?? 'Registration failed';
      }
      return 'Connection error. Please check your internet.';
    } catch (e) {
      return 'An unexpected error occurred.';
    }
    return 'Registration failed';
  }

  Future<String?> updateProfile(
    String name,
    String phone,
    String address, {
    String? password,
  }) async {
    try {
      final data = {'name': name, 'phone': phone, 'address': address};
      if (password != null && password.isNotEmpty) {
        data['password'] = password;
      }

      final response = await _apiService.dio.put('/users/profile', data: data);

      if (response.statusCode == 200) {
        // Update local user data
        // API returns the full user object
        _user = {
          ...Map<String, dynamic>.from(response.data),
          if (_user?['photoUrl'] != null) 'photoUrl': _user!['photoUrl'],
        };
        await _saveSession();
        notifyListeners();
        return null;
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return e.response?.data['message'] ?? 'Update failed';
      }
      return 'Connection error.';
    } catch (e) {
      return 'An unexpected error occurred.';
    }
    return 'Update failed';
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    _notificationsInitialized = false;
    await _storage.delete(key: 'token');
    await _storage.delete(key: 'user');
    notifyListeners();
  }

  // --- Password Recovery ---
  Future<String?> forgotPassword(String email) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
      if (response.statusCode == 200) {
        return null; // Success
      }
      return 'Unknown error occurred';
    } on DioException catch (e) {
      return e.response?.data['message'] ?? e.message;
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> verifyOTP(String email, String otp) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/verify-otp',
        data: {'email': email, 'otp': otp},
      );
      if (response.statusCode == 200) {
        return null; // Success
      }
      return 'Unknown error occurred';
    } on DioException catch (e) {
      return e.response?.data['message'] ?? e.message;
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/reset-password',
        data: {'email': email, 'otp': otp, 'newPassword': newPassword},
      );
      if (response.statusCode == 200) {
        return null; // Success
      }
      return 'Unknown error occurred';
    } on DioException catch (e) {
      return e.response?.data['message'] ?? e.message;
    } catch (e) {
      return e.toString();
    }
  }

  // --- Firebase Phone Login ---
  Future<String?> firebasePhoneLogin(String firebaseIdToken) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/phone',
        data: {'firebaseIdToken': firebaseIdToken},
      );

      if (response.statusCode == 200) {
        _user = response.data;
        _token = _user!['token'];

        await _saveSession();
        await _registerNotifications();

        notifyListeners();
        return null; // Success
      }
      return 'Login failed';
    } on DioException catch (e) {
      return e.response?.data['message'] ?? e.message;
    } catch (e) {
      return 'An unexpected error occurred.';
    }
  }

  Future<bool> tryAutoLogin() async {
    final token = await _storage.read(key: 'token');
    if (token == null) return false;

    _token = token;
    final storedUser = await _storage.read(key: 'user');
    if (storedUser != null) {
      _user = jsonDecode(storedUser);
    }

    try {
      final response = await _apiService.dio.get('/users/profile');
      _user = {
        ...Map<String, dynamic>.from(response.data),
        if (_user?['photoUrl'] != null) 'photoUrl': _user!['photoUrl'],
      };
      await _saveSession();
      await _registerNotifications();
      notifyListeners();
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  Future<String?> addAddress(Map<String, dynamic> address) async {
    try {
      final response = await _apiService.dio.post(
        '/users/addresses',
        data: address,
      );
      _mergeAddressResponse(response.data);
      await _saveSession();
      notifyListeners();
      return null;
    } on DioException catch (e) {
      return e.response?.data['message'] ?? 'Failed to save address.';
    } catch (_) {
      return 'Failed to save address.';
    }
  }

  Future<String?> updateAddress(String id, Map<String, dynamic> address) async {
    try {
      final response = await _apiService.dio.put(
        '/users/addresses/$id',
        data: address,
      );
      _mergeAddressResponse(response.data);
      await _saveSession();
      notifyListeners();
      return null;
    } on DioException catch (e) {
      return e.response?.data['message'] ?? 'Failed to update address.';
    } catch (_) {
      return 'Failed to update address.';
    }
  }

  Future<String?> deleteAddress(String id) async {
    try {
      final response = await _apiService.dio.delete('/users/addresses/$id');
      _mergeAddressResponse(response.data);
      await _saveSession();
      notifyListeners();
      return null;
    } on DioException catch (e) {
      return e.response?.data['message'] ?? 'Failed to delete address.';
    } catch (_) {
      return 'Failed to delete address.';
    }
  }

  Future<String?> setDefaultAddress(String id) async {
    try {
      final response = await _apiService.dio.put(
        '/users/addresses/$id/default',
      );
      _mergeAddressResponse(response.data);
      await _saveSession();
      notifyListeners();
      return null;
    } on DioException catch (e) {
      return e.response?.data['message'] ?? 'Failed to update address.';
    } catch (_) {
      return 'Failed to update address.';
    }
  }

  Future<void> _saveSession() async {
    if (_token != null) {
      await _storage.write(key: 'token', value: _token);
    }
    if (_user != null) {
      await _storage.write(key: 'user', value: jsonEncode(_user));
    }
  }

  void _mergeAddressResponse(dynamic data) {
    if (_user == null || data is! Map) return;
    _user = {
      ..._user!,
      if (data['address'] != null) 'address': data['address'],
      if (data['addresses'] != null) 'addresses': data['addresses'],
    };
  }

  Future<void> _registerNotifications() async {
    if (_notificationsInitialized || _token == null) return;

    try {
      await NotificationService(_apiService).initialize();
      _notificationsInitialized = true;
    } catch (error) {
      debugPrint('Notification setup failed: $error');
    }
  }
}
