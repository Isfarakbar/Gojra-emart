import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

class ApiService {
  // -----------------------------------------------------------------------
  // BASE URL CONFIGURATION
  // - Windows desktop / iOS Simulator:  http://127.0.0.1:5000/api
  // - Android Emulator (AVD):           http://10.0.2.2:5000/api
  // - Physical Android device:          http://<YOUR_MACHINE_LAN_IP>:5000/api
  //   e.g. http://192.168.1.5:5000/api
  // -----------------------------------------------------------------------
  static const String baseUrl = 'http://127.0.0.1:5000/api';

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
