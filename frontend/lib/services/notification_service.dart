import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final ApiService _apiService;

  NotificationService(this._apiService);

  Future<void> initialize() async {
    // Request permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted permission for notifications');
      
      // Get FCM token
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        await _sendTokenToBackend(token);
      }

      // Listen for token refreshes
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        _sendTokenToBackend(newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Received foreground message: ${message.notification?.title}');
        // You can use a local notification package here to show a snackbar or native popup
      });
      
    } else {
      debugPrint('User declined or has not accepted permission');
    }
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      await _apiService.dio.put('/users/fcm-token', data: {
        'fcmToken': token,
      });
      debugPrint('FCM Token successfully registered with backend');
    } catch (e) {
      debugPrint('Failed to register FCM Token: $e');
    }
  }
}
