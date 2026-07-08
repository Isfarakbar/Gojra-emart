import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart' as app_auth;
import 'admin/admin_dashboard.dart';
import 'main_screen.dart';
import 'profile_setup_screen.dart';

enum _AuthStep {
  welcome,
  phone,
  phoneOtp,
  email,
  forgotEmail,
  forgotOtp,
  resetPassword,
  resetSuccess,
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  static const _green = Color(0xFF2E7D32);
  static const _orange = Color(0xFFFF6F00);

  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _forgotEmailController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmNewPasswordController = TextEditingController();
  final List<TextEditingController> _otpControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  late final AnimationController _entranceController;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  _AuthStep _step = _AuthStep.welcome;
  bool _isLoginMode = true;
  bool _isLoading = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _showNewPassword = false;
  String? _inlineError;
  String? _inlineSuccess;
  String? _verificationId;
  int? _resendToken;
  String? _verifiedResetOtp;
  int _secondsRemaining = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );
    _fade = CurvedAnimation(
      parent: _entranceController,
      curve: Curves.easeOutCubic,
    );
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: Curves.easeOutCubic,
    ));
    _entranceController.forward();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _entranceController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _confirmPasswordController.dispose();
    _forgotEmailController.dispose();
    _newPasswordController.dispose();
    _confirmNewPasswordController.dispose();
    for (final controller in _otpControllers) {
      controller.dispose();
    }
    for (final node in _otpFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _goTo(_AuthStep step) {
    setState(() {
      _step = step;
      _inlineError = null;
      _inlineSuccess = null;
      _isLoading = false;
    });
    _clearOtp();
    _entranceController.forward(from: 0);
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _secondsRemaining = 59);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_secondsRemaining <= 1) {
        timer.cancel();
        setState(() => _secondsRemaining = 0);
      } else {
        setState(() => _secondsRemaining--);
      }
    });
  }

  String get _phoneDigits =>
      _phoneController.text.replaceAll(RegExp(r'\D'), '');

  String get _fullPhone => '+92$_phoneDigits';

  String get _otp => _otpControllers.map((c) => c.text).join();

  bool get _isPhoneOtp => _step == _AuthStep.phoneOtp;

  void _clearOtp() {
    for (final controller in _otpControllers) {
      controller.clear();
    }
  }

  String _maskPhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 12) return phone;
    return '+92 ${digits.substring(2, 5)} ${digits.substring(5, 8)} ${digits.substring(8)}';
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainder = seconds % 60;
    return '$minutes:${remainder.toString().padLeft(2, '0')}';
  }

  bool _validEmail(String value) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim());
  }

  Future<void> _sendPhoneOtp({bool resend = false}) async {
    if (_phoneDigits.length != 10) {
      setState(() => _inlineError = 'Enter a valid 10 digit Pakistani mobile number.');
      return;
    }

    setState(() {
      _isLoading = true;
      _inlineError = null;
      _inlineSuccess = null;
    });

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: _fullPhone,
        forceResendingToken: resend ? _resendToken : null,
        verificationCompleted: (credential) async {
          try {
            final result =
                await FirebaseAuth.instance.signInWithCredential(credential);
            final idToken = await result.user?.getIdToken();
            if (idToken != null) {
              await _completePhoneLogin(idToken);
            }
          } catch (_) {
            if (mounted) {
              setState(() => _inlineError = 'Auto verification failed. Enter the OTP manually.');
            }
          }
        },
        verificationFailed: (error) {
          if (!mounted) return;
          setState(() {
            _isLoading = false;
            _inlineError =
                error.message ?? 'Could not send OTP. Please try again.';
          });
        },
        codeSent: (verificationId, resendToken) {
          if (!mounted) return;
          setState(() {
            _verificationId = verificationId;
            _resendToken = resendToken;
            _isLoading = false;
            _inlineSuccess = resend ? 'OTP resent successfully.' : null;
          });
          _goTo(_AuthStep.phoneOtp);
          _startTimer();
        },
        codeAutoRetrievalTimeout: (verificationId) {
          _verificationId = verificationId;
        },
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _inlineError = 'Network error. Please check your connection.';
      });
    }
  }

  Future<void> _verifyPhoneOtp() async {
    if (_otp.length != 6 || _verificationId == null) return;

    setState(() {
      _isLoading = true;
      _inlineError = null;
    });

    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: _otp,
      );
      final result = await FirebaseAuth.instance.signInWithCredential(credential);
      final idToken = await result.user?.getIdToken();

      if (idToken == null) {
        throw FirebaseAuthException(code: 'missing-token');
      }

      await _completePhoneLogin(idToken);
    } on FirebaseAuthException {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _inlineError = 'The OTP is incorrect or expired. Please try again.';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _inlineError = 'Could not verify OTP. Please try again.';
      });
    }
  }

  Future<void> _completePhoneLogin(String idToken) async {
    final error =
        await context.read<app_auth.AuthProvider>().firebasePhoneLogin(idToken);
    if (!mounted) return;
    setState(() => _isLoading = false);
    if (error == null) {
      _routeAfterAuth();
    } else {
      setState(() => _inlineError = error);
    }
  }

  Future<void> _submitEmailAuth() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (!_validEmail(email)) {
      setState(() => _inlineError = 'Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setState(() => _inlineError = 'Password must be at least 6 characters.');
      return;
    }
    if (!_isLoginMode) {
      if (_nameController.text.trim().length < 2) {
        setState(() => _inlineError = 'Enter your full name.');
        return;
      }
      if (password != _confirmPasswordController.text) {
        setState(() => _inlineError = 'Passwords do not match.');
        return;
      }
    }

    setState(() {
      _isLoading = true;
      _inlineError = null;
    });

    final auth = context.read<app_auth.AuthProvider>();
    final error = _isLoginMode
        ? await auth.login(email, password)
        : await auth.register(
            _nameController.text.trim(),
            email,
            password,
            '',
          );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error == null) {
      _routeAfterAuth();
    } else {
      setState(() => _inlineError = error);
    }
  }

  Future<void> _submitGoogle() async {
    setState(() {
      _isLoading = true;
      _inlineError = null;
    });

    final error = await context.read<app_auth.AuthProvider>().googleLogin();
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error == null) {
      _routeAfterAuth();
    } else {
      setState(() => _inlineError = error);
    }
  }

  void _routeAfterAuth() {
    final auth = context.read<app_auth.AuthProvider>();
    final user = auth.user;

    if (user?['role'] == 'admin') {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const AdminDashboard()),
        (route) => false,
      );
      return;
    }

    if (auth.needsProfileSetup) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const ProfileSetupScreen()),
        (route) => false,
      );
      return;
    }

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const MainScreen()),
      (route) => false,
    );
  }

  Future<void> _sendResetOtp() async {
    final email = _forgotEmailController.text.trim();
    if (!_validEmail(email)) {
      setState(() => _inlineError = 'Enter a valid email address.');
      return;
    }

    setState(() {
      _isLoading = true;
      _inlineError = null;
    });

    final error =
        await context.read<app_auth.AuthProvider>().forgotPassword(email);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error == null) {
      _goTo(_AuthStep.forgotOtp);
      _startTimer();
    } else {
      setState(() => _inlineError = error);
    }
  }

  Future<void> _verifyResetOtp() async {
    if (_otp.length != 6) return;

    setState(() {
      _isLoading = true;
      _inlineError = null;
    });

    final error = await context
        .read<app_auth.AuthProvider>()
        .verifyOTP(_forgotEmailController.text.trim(), _otp);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error == null) {
      _verifiedResetOtp = _otp;
      _goTo(_AuthStep.resetPassword);
    } else {
      setState(() => _inlineError = error);
    }
  }

  Future<void> _resetPassword() async {
    final password = _newPasswordController.text;
    if (password.length < 6) {
      setState(() => _inlineError = 'Password must be at least 6 characters.');
      return;
    }
    if (password != _confirmNewPasswordController.text) {
      setState(() => _inlineError = 'Passwords do not match.');
      return;
    }

    setState(() {
      _isLoading = true;
      _inlineError = null;
    });

    final error = await context.read<app_auth.AuthProvider>().resetPassword(
          _forgotEmailController.text.trim(),
          _verifiedResetOtp ?? '',
          password,
        );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error == null) {
      _goTo(_AuthStep.resetSuccess);
    } else {
      setState(() => _inlineError = error);
    }
  }

  void _onOtpChanged(int index, String value) {
    if (value.length > 1) {
      final chars = value.replaceAll(RegExp(r'\D'), '').split('');
      for (var i = 0; i < chars.length && i < 6; i++) {
        _otpControllers[i].text = chars[i];
      }
      final next = chars.length >= 6 ? 5 : chars.length;
      _otpFocusNodes[next].requestFocus();
    } else if (value.isNotEmpty && index < 5) {
      _otpFocusNodes[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _otpFocusNodes[index - 1].requestFocus();
    }

    if (_otp.length == 6 && !_isLoading) {
      if (_isPhoneOtp) {
        _verifyPhoneOtp();
      } else if (_step == _AuthStep.forgotOtp) {
        _verifyResetOtp();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          child: SlideTransition(
            key: ValueKey(_step),
            position: _slide,
            child: FadeTransition(
              opacity: _fade,
              child: _buildStep(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case _AuthStep.welcome:
        return _buildWelcome();
      case _AuthStep.phone:
        return _buildPhone();
      case _AuthStep.phoneOtp:
        return _buildOtp(
          title: 'Verify your number',
          subtitle: 'We sent a code to ${_maskPhone(_fullPhone)}',
          onVerify: _verifyPhoneOtp,
          onResend: () => _sendPhoneOtp(resend: true),
        );
      case _AuthStep.email:
        return _buildEmail();
      case _AuthStep.forgotEmail:
        return _buildForgotEmail();
      case _AuthStep.forgotOtp:
        return _buildOtp(
          title: 'Check your email',
          subtitle: 'We sent a code to ${_forgotEmailController.text.trim()}',
          onVerify: _verifyResetOtp,
          onResend: _sendResetOtp,
        );
      case _AuthStep.resetPassword:
        return _buildResetPassword();
      case _AuthStep.resetSuccess:
        return _buildResetSuccess();
    }
  }

  Widget _buildShell({
    required List<Widget> children,
    bool showBack = true,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight - 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (showBack)
                  IconButton(
                    onPressed: () => _goTo(_AuthStep.welcome),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded),
                    color: const Color(0xFF243226),
                    padding: EdgeInsets.zero,
                    alignment: Alignment.centerLeft,
                  ),
                ...children,
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWelcome() {
    return _buildShell(
      showBack: false,
      children: [
        const SizedBox(height: 8),
        Center(
          child: SizedBox(
            height: 230,
            child: Lottie.network(
              'https://assets7.lottiefiles.com/packages/lf20_2m1smtya.json',
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) => _GroceryIllustration(),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Hero(
            tag: 'auth-logo',
            child: Container(
              width: 74,
              height: 74,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: _green.withValues(alpha: 0.14),
                    blurRadius: 24,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Image.asset(
                  'assets/logo.png',
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const Icon(
                    Icons.local_grocery_store_rounded,
                    color: _green,
                    size: 38,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 18),
        Center(
          child: Text(
            'Gojra E-Mart',
            style: GoogleFonts.poppins(
              fontSize: 30,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF17211A),
            ),
          ),
        ),
        Center(
          child: Text(
            'Fresh groceries delivered to your door',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              color: Colors.black54,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(height: 34),
        _PrimaryButton(
          label: 'Continue with Phone',
          icon: Icons.phone_iphone_rounded,
          isLoading: _isLoading,
          onPressed: () => _goTo(_AuthStep.phone),
        ),
        const SizedBox(height: 12),
        _SecondaryButton(
          label: 'Continue with Email',
          icon: Icons.mail_outline_rounded,
          onPressed: () => _goTo(_AuthStep.email),
        ),
        const SizedBox(height: 14),
        _GoogleButton(onPressed: _isLoading ? null : _submitGoogle),
        if (_inlineError != null) ...[
          const SizedBox(height: 14),
          _InlineMessage(message: _inlineError!, isError: true),
        ],
        const SizedBox(height: 28),
        Center(
          child: Text(
            'By continuing, you agree to our Terms & Privacy Policy',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              color: Colors.black45,
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPhone() {
    return _buildShell(
      children: [
        const SizedBox(height: 22),
        _StepHeader(
          title: 'Enter your phone number',
          subtitle: 'We will send a secure OTP to verify your account.',
        ),
        const SizedBox(height: 30),
        Row(
          children: [
            Container(
              height: 58,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE4ECE5)),
              ),
              child: Center(
                child: Text('🇵🇰  +92',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    )),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                  _PakPhoneFormatter(),
                ],
                style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                decoration: _inputDecoration(
                  label: '3XX XXX XXXX',
                  icon: Icons.phone_android_rounded,
                ),
                onChanged: (_) => setState(() => _inlineError = null),
              ),
            ),
          ],
        ),
        if (_inlineError != null) ...[
          const SizedBox(height: 14),
          _InlineMessage(message: _inlineError!, isError: true),
        ],
        const SizedBox(height: 26),
        _PrimaryButton(
          label: 'Send OTP',
          icon: Icons.arrow_forward_rounded,
          isLoading: _isLoading,
          onPressed: () => _sendPhoneOtp(),
        ),
      ],
    );
  }

  Widget _buildOtp({
    required String title,
    required String subtitle,
    required VoidCallback onVerify,
    required VoidCallback onResend,
  }) {
    return _buildShell(
      children: [
        const SizedBox(height: 22),
        _StepHeader(title: title, subtitle: subtitle),
        const SizedBox(height: 30),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (index) {
            return SizedBox(
              width: 46,
              height: 56,
              child: TextField(
                controller: _otpControllers[index],
                focusNode: _otpFocusNodes[index],
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                maxLength: 1,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
                decoration: InputDecoration(
                  counterText: '',
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: EdgeInsets.zero,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFFE3ECE4)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: _green, width: 2),
                  ),
                ),
                onChanged: (value) => _onOtpChanged(index, value),
              ),
            );
          }),
        ),
        const SizedBox(height: 18),
        Center(
          child: _secondsRemaining > 0
              ? Text(
                  'Resend OTP in ${_formatTime(_secondsRemaining)}',
                  style: GoogleFonts.poppins(
                    color: Colors.black54,
                    fontWeight: FontWeight.w600,
                  ),
                )
              : TextButton(
                  onPressed: _isLoading ? null : onResend,
                  child: Text(
                    'Resend OTP',
                    style: GoogleFonts.poppins(
                      color: _orange,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
        ),
        if (_inlineError != null) ...[
          const SizedBox(height: 10),
          _InlineMessage(message: _inlineError!, isError: true),
        ],
        if (_inlineSuccess != null) ...[
          const SizedBox(height: 10),
          _InlineMessage(message: _inlineSuccess!, isError: false),
        ],
        const SizedBox(height: 26),
        _PrimaryButton(
          label: 'Verify Code',
          icon: Icons.verified_user_outlined,
          isLoading: _isLoading,
          onPressed: onVerify,
        ),
      ],
    );
  }

  Widget _buildEmail() {
    return _buildShell(
      children: [
        const SizedBox(height: 18),
        _StepHeader(
          title: _isLoginMode ? 'Welcome back' : 'Create your account',
          subtitle: _isLoginMode
              ? 'Login with your email to continue shopping.'
              : 'Sign up once and enjoy faster grocery orders.',
        ),
        const SizedBox(height: 26),
        if (!_isLoginMode) ...[
          _PremiumTextField(
            controller: _nameController,
            label: 'Full name',
            icon: Icons.person_outline_rounded,
          ),
          const SizedBox(height: 14),
        ],
        _PremiumTextField(
          controller: _emailController,
          label: 'Email address',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 14),
        _PremiumTextField(
          controller: _passwordController,
          label: 'Password',
          icon: Icons.lock_outline_rounded,
          obscureText: !_showPassword,
          suffix: IconButton(
            onPressed: () => setState(() => _showPassword = !_showPassword),
            icon: Icon(_showPassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined),
          ),
        ),
        if (!_isLoginMode) ...[
          const SizedBox(height: 14),
          _PremiumTextField(
            controller: _confirmPasswordController,
            label: 'Confirm password',
            icon: Icons.lock_reset_rounded,
            obscureText: !_showConfirmPassword,
            suffix: IconButton(
              onPressed: () => setState(
                  () => _showConfirmPassword = !_showConfirmPassword),
              icon: Icon(_showConfirmPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined),
            ),
          ),
        ],
        if (_isLoginMode)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                _forgotEmailController.text = _emailController.text.trim();
                _goTo(_AuthStep.forgotEmail);
              },
              child: Text(
                'Forgot Password?',
                style: GoogleFonts.poppins(
                  color: _orange,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        if (_inlineError != null) ...[
          const SizedBox(height: 8),
          _InlineMessage(message: _inlineError!, isError: true),
        ],
        const SizedBox(height: 22),
        _PrimaryButton(
          label: _isLoginMode ? 'Login' : 'Sign Up',
          icon: Icons.arrow_forward_rounded,
          isLoading: _isLoading,
          onPressed: _submitEmailAuth,
        ),
        const SizedBox(height: 18),
        Center(
          child: TextButton(
            onPressed: () {
              setState(() {
                _isLoginMode = !_isLoginMode;
                _inlineError = null;
              });
            },
            child: Text(
              _isLoginMode
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Login',
              style: GoogleFonts.poppins(
                color: _green,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildForgotEmail() {
    return _buildShell(
      children: [
        const SizedBox(height: 22),
        const _StepHeader(
          title: 'Reset your password',
          subtitle: 'Enter your email and we will send a secure verification code.',
        ),
        const SizedBox(height: 30),
        _PremiumTextField(
          controller: _forgotEmailController,
          label: 'Email address',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        if (_inlineError != null) ...[
          const SizedBox(height: 14),
          _InlineMessage(message: _inlineError!, isError: true),
        ],
        const SizedBox(height: 26),
        _PrimaryButton(
          label: 'Send Code',
          icon: Icons.mark_email_read_outlined,
          isLoading: _isLoading,
          onPressed: _sendResetOtp,
        ),
      ],
    );
  }

  Widget _buildResetPassword() {
    return _buildShell(
      children: [
        const SizedBox(height: 22),
        const _StepHeader(
          title: 'Create new password',
          subtitle: 'Choose a secure password to protect your grocery account.',
        ),
        const SizedBox(height: 30),
        _PremiumTextField(
          controller: _newPasswordController,
          label: 'New password',
          icon: Icons.lock_outline_rounded,
          obscureText: !_showNewPassword,
          suffix: IconButton(
            onPressed: () => setState(() => _showNewPassword = !_showNewPassword),
            icon: Icon(_showNewPassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined),
          ),
        ),
        const SizedBox(height: 14),
        _PremiumTextField(
          controller: _confirmNewPasswordController,
          label: 'Confirm password',
          icon: Icons.lock_reset_rounded,
          obscureText: true,
        ),
        if (_inlineError != null) ...[
          const SizedBox(height: 14),
          _InlineMessage(message: _inlineError!, isError: true),
        ],
        const SizedBox(height: 26),
        _PrimaryButton(
          label: 'Reset Password',
          icon: Icons.check_rounded,
          isLoading: _isLoading,
          onPressed: _resetPassword,
        ),
      ],
    );
  }

  Widget _buildResetSuccess() {
    return _buildShell(
      showBack: false,
      children: [
        const SizedBox(height: 80),
        Center(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.7, end: 1),
            duration: const Duration(milliseconds: 520),
            curve: Curves.elasticOut,
            builder: (context, value, child) =>
                Transform.scale(scale: value, child: child),
            child: Container(
              width: 112,
              height: 112,
              decoration: BoxDecoration(
                color: _green.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded,
                  color: _green, size: 82),
            ),
          ),
        ),
        const SizedBox(height: 32),
        Center(
          child: Text(
            'Password updated',
            style: GoogleFonts.poppins(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF17211A),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            'You can now login with your new password.',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(color: Colors.black54),
          ),
        ),
        const SizedBox(height: 34),
        _PrimaryButton(
          label: 'Back to Login',
          icon: Icons.login_rounded,
          isLoading: false,
          onPressed: () {
            _isLoginMode = true;
            _emailController.text = _forgotEmailController.text.trim();
            _goTo(_AuthStep.email);
          },
        ),
      ],
    );
  }

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFE4ECE5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFE4ECE5)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _green, width: 2),
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 28,
            height: 1.15,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF17211A),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: GoogleFonts.poppins(
            fontSize: 14,
            height: 1.5,
            color: Colors.black54,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _PremiumTextField extends StatelessWidget {
  const _PremiumTextField({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.suffix,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        suffixIcon: suffix,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFFE4ECE5)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFFE4ECE5)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: _LoginScreenState._green, width: 2),
        ),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({
    required this.label,
    required this.icon,
    required this.isLoading,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final bool isLoading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? const SizedBox.shrink()
            : Icon(icon, size: 20, color: Colors.white),
        label: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.4,
                ),
              )
            : Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
        style: ElevatedButton.styleFrom(
          backgroundColor: _LoginScreenState._green,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  const _SecondaryButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, color: _LoginScreenState._green),
        label: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: _LoginScreenState._green,
          ),
        ),
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          side: const BorderSide(color: Color(0xFFDDE9DE)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
  }
}

class _GoogleButton extends StatelessWidget {
  const _GoogleButton({required this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          side: const BorderSide(color: Color(0xFFE2E5E2)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.network(
              'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png',
              height: 22,
              errorBuilder: (context, error, stackTrace) => Text(
                'G',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  color: Colors.blue,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Continue with Google',
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF222222),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InlineMessage extends StatelessWidget {
  const _InlineMessage({required this.message, required this.isError});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? Colors.red.shade700 : _LoginScreenState._green;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        children: [
          Icon(
            isError ? Icons.error_outline_rounded : Icons.check_circle_outline,
            color: color,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.poppins(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GroceryIllustration extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _LoginScreenState._green.withValues(alpha: 0.08),
        shape: BoxShape.circle,
      ),
      child: Stack(
        alignment: Alignment.center,
        children: const [
          Icon(Icons.shopping_basket_rounded,
              color: _LoginScreenState._green, size: 112),
          Positioned(
            right: 48,
            top: 52,
            child: Icon(Icons.eco_rounded,
                color: _LoginScreenState._orange, size: 34),
          ),
        ],
      ),
    );
  }
}

class _PakPhoneFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final buffer = StringBuffer();

    for (var i = 0; i < digits.length; i++) {
      if (i == 3 || i == 6) buffer.write(' ');
      buffer.write(digits[i]);
    }

    final text = buffer.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
