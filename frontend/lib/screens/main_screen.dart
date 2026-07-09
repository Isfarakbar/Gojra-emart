import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import 'home_screen.dart';
import 'cart_screen.dart';
import 'my_orders_screen.dart';
import 'profile_screen.dart';
import 'login_screen.dart';
import '../providers/auth_provider.dart';
import 'package:google_fonts/google_fonts.dart';

class MainScreen extends StatefulWidget {
  final DateTime Function()? now;
  final Future<void> Function()? exitApp;
  final bool? forceAndroidExitPolicy;
  final List<Widget>? screens;

  const MainScreen({
    super.key,
    this.now,
    this.exitApp,
    this.forceAndroidExitPolicy,
    this.screens,
  });

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  DateTime? _firstExitAttempt;

  @override
  Widget build(BuildContext context) {
    // Determine if we should show badge
    final cartItemCount = Provider.of<CartProvider>(context).items.length;
    final auth = Provider.of<AuthProvider>(context);
    final theme = Theme.of(context);
    final screens =
        widget.screens ??
        [
          const HomeScreen(),
          const CartScreen(),
          auth.isAuthenticated ? const MyOrdersScreen() : const SizedBox(),
          auth.isAuthenticated ? const ProfileScreen() : const SizedBox(),
        ];

    final useAndroidExitPolicy =
        widget.forceAndroidExitPolicy ?? (!kIsWeb && Platform.isAndroid);

    return PopScope(
      canPop: !useAndroidExitPolicy,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop || !useAndroidExitPolicy) return;
        if (_currentIndex != 0) {
          setState(() => _currentIndex = 0);
          return;
        }

        final now = widget.now?.call() ?? DateTime.now();
        if (_firstExitAttempt != null &&
            now.difference(_firstExitAttempt!) <= const Duration(seconds: 2)) {
          await (widget.exitApp?.call() ?? SystemNavigator.pop());
          return;
        }

        _firstExitAttempt = now;
        if (!context.mounted) return;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('Press back again to exit'),
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ),
          );
      },
      child: Scaffold(
        body: IndexedStack(index: _currentIndex, children: screens),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              if (index == 2 || index == 3) {
                if (auth.token == null || auth.token!.isEmpty) {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                  return; // Don't switch tab
                }
              }
              setState(() => _currentIndex = index);
            },
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.white,
            selectedItemColor: theme.colorScheme.primary,
            unselectedItemColor: Colors.grey[400],
            selectedLabelStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
            unselectedLabelStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w500,
              fontSize: 12,
            ),
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Badge(
                  isLabelVisible: cartItemCount > 0,
                  label: Text(cartItemCount.toString()),
                  child: const Icon(Icons.shopping_cart_outlined),
                ),
                activeIcon: Badge(
                  isLabelVisible: cartItemCount > 0,
                  label: Text(cartItemCount.toString()),
                  child: const Icon(Icons.shopping_cart),
                ),
                label: 'Cart',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.shopping_bag_outlined),
                activeIcon: Icon(Icons.shopping_bag),
                label: 'Orders',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.person_outline),
                activeIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
