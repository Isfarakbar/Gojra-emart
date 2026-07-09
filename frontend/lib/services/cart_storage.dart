import 'package:shared_preferences/shared_preferences.dart';

abstract class CartStorage {
  Future<String?> read();
  Future<void> write(String value);
  Future<void> clear();
}

class SharedPreferencesCartStorage implements CartStorage {
  static const _key = 'shopping_cart_v1';

  @override
  Future<String?> read() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_key);
  }

  @override
  Future<void> write(String value) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_key, value);
  }

  @override
  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_key);
  }
}
