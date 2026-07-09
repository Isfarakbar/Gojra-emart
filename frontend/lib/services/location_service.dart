import 'package:geolocator/geolocator.dart';

abstract class LocationService {
  Future<Map<String, double>?> getCurrentCoordinates();
}

class GeolocatorLocationService implements LocationService {
  @override
  Future<Map<String, double>?> getCurrentCoordinates() async {
    if (!await Geolocator.isLocationServiceEnabled()) return null;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    return {'latitude': position.latitude, 'longitude': position.longitude};
  }
}
