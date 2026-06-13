import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

class ApiService {
  // BASE URL CONFIGURATION
  static const String baseUrl = 'https://gojra-emart-backend.onrender.com/api';

  final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {
      'Content-Type': 'application/json',
    },
  ));

  final _storage = const FlutterSecureStorage();

  ApiService() {
    _dio.interceptors.add(InterceptorsWrapper(
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
      onError: (DioException e, handler) {
        // Log errors for debugging
        final statusCode = e.response?.statusCode;
        final message = e.response?.data?['message'] ?? e.message;
        print('🔴 API Error [$statusCode]: $message');
        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;
}
