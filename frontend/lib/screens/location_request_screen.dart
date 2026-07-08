import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lottie/lottie.dart';
import 'splash_screen.dart';

class LocationRequestScreen extends StatefulWidget {
  const LocationRequestScreen({super.key});

  @override
  State<LocationRequestScreen> createState() => _LocationRequestScreenState();
}

class _LocationRequestScreenState extends State<LocationRequestScreen> {
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _requestLocation() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      bool serviceEnabled;
      LocationPermission permission;

      // 1. Check if location services are enabled.
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Location services are not enabled don't continue
        // accessing the position and request users of the 
        // App to enable the location services.
         await Geolocator.openLocationSettings();
         serviceEnabled = await Geolocator.isLocationServiceEnabled();
         if (!serviceEnabled) {
            setState(() {
              _isLoading = false;
              _errorMessage = "Location services are disabled. Please enable them to continue.";
            });
            return;
         }
      }

      // 2. Check current permission
      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
           setState(() {
              _isLoading = false;
              _errorMessage = "Permission denied. We need location access to capture accurate delivery coordinates.";
            });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        // Permissions are denied forever, handle appropriately. 
        setState(() {
            _isLoading = false;
             _errorMessage = "Location permission is permanently denied. Please enable it in settings.";
        });
        await Geolocator.openAppSettings();
        return;
      } 

      // 3. Permission Granted!
      if (mounted) {
         // Restart Splash to perform check
         Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const SplashScreen()),
        );
      }

    } catch (e) {
       setState(() {
         _isLoading = false;
         _errorMessage = e.toString();
       });
    } finally {
      if(mounted && _errorMessage == null) {
          setState(() {
            _isLoading = false;
          });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(30.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Beautiful Lottie Animation
              // Using a network Lottie for location
              Expanded(
                flex: 3,
                child: Lottie.network(
                  'https://assets2.lottiefiles.com/packages/lf20_9wjm14ni.json',
                  errorBuilder: (context, error, stackTrace) {
                     return const Icon(Icons.location_on, size: 100, color: Colors.blue);
                  },
                ),
              ),
              
              const SizedBox(height: 20),
              
              const Text(
                "Enable Location",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              
              const SizedBox(height: 10),
              
              const Text(
                "We use your location only to capture accurate GPS coordinates for delivery.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                  height: 1.5,
                ),
              ),
              
              const Spacer(flex: 1),
              
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Text(
                    _errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red, fontSize: 14),
                  ),
                ),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _requestLocation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 5,
                  ),
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        "Allow Location Access",
                        style: TextStyle(
                          fontSize: 18, 
                          fontWeight: FontWeight.w600,
                          color: Colors.white
                        ),
                      ),
                ),
              ),
              
              const SizedBox(height: 20),

              // Strict Mode: No manual entry
              /*
              TextButton(
                onPressed: () { ... },
                child: const Text("Enter Manually", ...),
              ),
              */
              
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
