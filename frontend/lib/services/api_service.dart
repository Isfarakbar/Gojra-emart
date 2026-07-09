import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final ValueNotifier<String?> accountAccessError =
      ValueNotifier<String?>(null);
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://gojra-emart-backend.onrender.com/api',
  );

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  final _storage = const FlutterSecureStorage();

  ApiService() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException error, handler) {
          final statusCode = error.response?.statusCode;
          final message = error.response?.data?['message'] ?? error.message;
          if (statusCode == 403 &&
              error.response?.data?['code'] == 'ACCOUNT_SUSPENDED') {
            _storage.delete(key: 'token');
            _storage.delete(key: 'user');
            accountAccessError.value =
                message?.toString() ?? 'Your account has been suspended.';
          }
          debugPrint('API Error [$statusCode]: $message');
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
