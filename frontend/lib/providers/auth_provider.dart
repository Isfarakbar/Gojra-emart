import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// import 'package:google_sign_in/google_sign_in.dart'; // Uncomment for Android
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final _storage = const FlutterSecureStorage();
  
  String? _token;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _token != null;
  Map<String, dynamic>? get user => _user;
  String? get token => _token;

  Future<String?> googleLogin() async {
    return 'Google Sign-In is only supported on Android/iOS. Please test on a real device.';
  }

  Future<String?> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        _token = response.data['token'];
        _user = response.data;
        await _saveToken(_token!);
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

  Future<String?> register(String name, String email, String password, String phone) async {
    try {
      final response = await _apiService.dio.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
      });

      if (response.statusCode == 201) {
        _token = response.data['token'];
        _user = response.data;
        await _saveToken(_token!);
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



  Future<String?> updateProfile(String name, String phone, String address, {String? password}) async {
    try {
      final data = {
        'name': name,
        'phone': phone,
        'address': address,
      };
      if (password != null && password.isNotEmpty) {
        data['password'] = password;
      }

      final response = await _apiService.dio.put('/users/profile', data: data);

      if (response.statusCode == 200) {
        // Update local user data
        // API returns the full user object
        _user = response.data;
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
    await _storage.delete(key: 'token');
    await _storage.delete(key: 'user');
    notifyListeners();
  }

  // --- Password Recovery ---
  Future<String?> forgotPassword(String email) async {
    try {
      final response = await _apiService.dio.post('/auth/forgot-password', data: {
        'email': email,
      });
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
      final response = await _apiService.dio.post('/auth/verify-otp', data: {
        'email': email,
        'otp': otp,
      });
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

  Future<String?> resetPassword(String email, String otp, String newPassword) async {
    try {
      final response = await _apiService.dio.post('/auth/reset-password', data: {
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      });
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
      final response = await _apiService.dio.post('/auth/phone', data: {
        'firebaseIdToken': firebaseIdToken,
      });

      if (response.statusCode == 200) {
        _user = response.data;
        _token = _user!['token'];
        
        await _storage.write(key: 'token', value: _token);
        await _storage.write(key: 'user', value: jsonEncode(_user));
        
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
    // Optionally fetch user profile again here using the token
    // For now, we assume token validity or let the API reject it later
    notifyListeners();
    return true;
  }

  Future<void> _saveToken(String token) async {
    await _storage.write(key: 'token', value: token);
  }
}
