import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import 'home_screen.dart';
import 'register_screen.dart';
import 'main_screen.dart';
import 'admin/admin_dashboard.dart';
import 'forgot_password_screen.dart';
import 'phone_auth_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    setState(() => _isLoading = true);
    final email = _emailController.text;
    final password = _passwordController.text;

    final error = await Provider.of<AuthProvider>(context, listen: false).login(email, password);

    setState(() => _isLoading = false);

    if (error == null && mounted) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null && user['role'] == 'admin') {
         Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const AdminDashboard()));
      } else {
         if (Navigator.canPop(context)) {
            Navigator.of(context).pop(); // Return to previous screen (Cart/Checkout)
         } else {
            Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MainScreen()));
         }
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? "Login Failed", style: GoogleFonts.inter()),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        )
      );
    }
  }

  Future<void> _googleLogin() async {
    setState(() => _isLoading = true);
    final error = await Provider.of<AuthProvider>(context, listen: false).googleLogin();
    setState(() => _isLoading = false);

    if (error == null && mounted) {
      if (Navigator.canPop(context)) {
         Navigator.of(context).pop();
      } else {
         Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MainScreen()));
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error ?? "Google Login Failed"), backgroundColor: Colors.redAccent));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                 padding: const EdgeInsets.all(20),
                 decoration: BoxDecoration(
                   color: theme.colorScheme.primary.withOpacity(0.1),
                   shape: BoxShape.circle,
                 ),
                 child: Icon(Icons.shopping_bag_outlined, size: 60, color: theme.colorScheme.primary),
              ),
              const SizedBox(height: 24),
              Text(
                "Welcome Back!",
                style: theme.textTheme.displayMedium,
              ),
              const SizedBox(height: 8),
              Text(
                "Login to access your personalized shopping experience.",
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
              ),
              const SizedBox(height: 32),
              
              Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      TextField(
                        controller: _emailController,
                        decoration: const InputDecoration(
                          labelText: "Email Address",
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),

                      TextField(
                        controller: _passwordController,
                        decoration: const InputDecoration(
                          labelText: "Password",
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        obscureText: true,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {
                            Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => const ForgotPasswordScreen(),
                            ));
                          },
                          child: Text("Forgot Password?", style: TextStyle(color: theme.colorScheme.primary)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: _isLoading
                            ? Center(child: CircularProgressIndicator(color: theme.colorScheme.primary))
                            : ElevatedButton(
                                onPressed: _login,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: theme.colorScheme.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text("Log In"),
                              ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: OutlinedButton.icon(
                          onPressed: _isLoading ? null : _googleLogin,
                          icon: Image.network(
                            'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png',
                            height: 24,
                            errorBuilder: (context, error, stackTrace) => const Icon(Icons.login), 
                          ),
                          label: const Text("Sign in with Google"),
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => const PhoneAuthScreen(),
                            ));
                          },
                          icon: Icon(Icons.phone_android, color: theme.colorScheme.primary),
                          label: Text('Sign in with Phone',
                              style: TextStyle(color: theme.colorScheme.primary, fontSize: 16)),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: theme.colorScheme.primary),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("New to Gojra E-Mart?", style: GoogleFonts.inter(color: Colors.grey[600])),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RegisterScreen()));
                    },
                    child: Text("Register Now", style: TextStyle(fontWeight: FontWeight.bold, color: theme.colorScheme.primary)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
