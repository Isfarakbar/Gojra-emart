import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'main_screen.dart';
import 'admin/admin_dashboard.dart';
import 'profile_setup_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1500));
    
    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
        CurvedAnimation(parent: _controller, curve: Curves.elasticOut));
        
    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeIn));

    _controller.forward();

    _checkLogin();
  }

  Future<void> _checkLogin() async {
    // Artificial delay for splash animation
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.tryAutoLogin();

    if (!mounted) return;

    if (success && authProvider.user != null && authProvider.user!['role'] == 'admin') {
         Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const AdminDashboard()));
         return;
    }

    if (success && authProvider.needsProfileSetup) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const ProfileSetupScreen()),
      );
      return;
    }

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainScreen()),
      );
    }
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).primaryColor,
              Theme.of(context).primaryColor.withValues(alpha: 0.8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.shopping_cart_rounded,
                  size: 80,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ),
            const SizedBox(height: 20),
            FadeTransition(
              opacity: _opacityAnimation,
              child: Text(
                "Gojra E-Mart",
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  color: Colors.white,
                  fontSize: 36,
                ),
              ),
            ),
             const SizedBox(height: 10),
            FadeTransition(
              opacity: _opacityAnimation,
              child: const Text(
                "Freshness Delivered.",
                style: TextStyle(color: Colors.white70, fontSize: 18),
              ),
            ),
            const SizedBox(height: 50),
            const CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
