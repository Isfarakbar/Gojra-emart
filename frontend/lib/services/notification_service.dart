import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import 'app_navigation.dart';

class NotificationService {
  static const _channel = AndroidNotificationChannel(
    'gojra_emart_updates',
    'Order and Store Updates',
    description: 'Order status, delivery, support, and store notifications.',
    importance: Importance.high,
  );

  final FirebaseMessaging _firebaseMessaging;
  final FlutterLocalNotificationsPlugin _localNotifications;
  final ApiService _apiService;
  bool _initialized = false;

  NotificationService(
    this._apiService, {
    FirebaseMessaging? firebaseMessaging,
    FlutterLocalNotificationsPlugin? localNotifications,
  }) : _firebaseMessaging = firebaseMessaging ?? FirebaseMessaging.instance,
       _localNotifications =
           localNotifications ?? FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    if (_initialized || kIsWeb || !Platform.isAndroid) return;
    _initialized = true;

    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/launcher_icon'),
    );
    await _localNotifications.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (response) {
        _handlePayload(response.payload);
      },
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_channel);

    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    if (settings.authorizationStatus != AuthorizationStatus.authorized &&
        settings.authorizationStatus != AuthorizationStatus.provisional) {
      return;
    }

    final token = await _firebaseMessaging.getToken();
    if (token != null) await _sendTokenToBackend(token);
    _firebaseMessaging.onTokenRefresh.listen(_sendTokenToBackend);

    FirebaseMessaging.onMessage.listen((message) async {
      final notification = message.notification;
      if (notification == null) return;
      await _localNotifications.show(
        id: message.messageId.hashCode,
        title: notification.title ?? 'Gojra E-Mart',
        body: notification.body ?? '',
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            'gojra_emart_updates',
            'Order and Store Updates',
            channelDescription:
                'Order status, delivery, support, and store notifications.',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/launcher_icon',
          ),
        ),
        payload: jsonEncode(message.data),
      );
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleData(message.data);
    });
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleData(initialMessage.data);
      });
    }
  }

  void _handlePayload(String? payload) {
    if (payload == null || payload.isEmpty) return;
    try {
      final data = jsonDecode(payload);
      if (data is Map) _handleData(Map<String, dynamic>.from(data));
    } catch (error) {
      debugPrint('Notification payload ignored: $error');
    }
  }

  void _handleData(Map<String, dynamic> data) {
    final orderId = data['orderId']?.toString();
    if (orderId != null) AppNavigation.openOrder(orderId);
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      await _apiService.dio.put('/users/fcm-token', data: {'fcmToken': token});
    } catch (error) {
      debugPrint('Failed to register FCM token: $error');
    }
  }
}
