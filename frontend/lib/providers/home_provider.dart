import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/banner_model.dart';
import '../models/home_section_model.dart';

class HomeProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<AppBanner> _banners = [];
  List<HomeSection> _sections = [];
  bool _isLoading = false;

  List<AppBanner> get banners => _banners;
  List<HomeSection> get sections => _sections;
  bool get isLoading => _isLoading;

  Future<void> fetchHomeLayout() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiService.dio.get('/layout/home');
      
      final bannersData = response.data['banners'] as List;
      _banners = bannersData.map((e) => AppBanner.fromJson(e)).toList();

      final sectionsData = response.data['sections'] as List;
      _sections = sectionsData.map((e) => HomeSection.fromJson(e)).toList();
      
    } catch (e) {
      debugPrint("Error fetching home layout: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
