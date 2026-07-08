import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

class OutOfServiceScreen extends StatelessWidget {
  const OutOfServiceScreen({super.key});

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
              Expanded(
                flex: 3,
                child: Lottie.network(
                  'https://assets9.lottiefiles.com/packages/lf20_qpwbq166.json', // Generic location/map error
                  errorBuilder: (context, error, stackTrace) {
                     return const Icon(Icons.location_off, size: 100, color: Colors.red);
                  },
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Service Unavailable",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                "We could not read your current location. Please enable location access and try again.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                  height: 1.5,
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
