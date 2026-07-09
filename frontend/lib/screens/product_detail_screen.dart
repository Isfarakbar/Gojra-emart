import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';

class ProductDetailScreen extends StatefulWidget {
  final Map<String, dynamic> product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _reviewController = TextEditingController();
  int _quantity = 1;
  int _reviewRating = 5;
  Map<String, dynamic>? _selectedVariant;
  late double _currentPrice;
  late double _rating;
  late int _reviewCount;
  List<dynamic> _reviews = [];
  bool _loadingReviews = true;
  bool _submittingReview = false;
  bool _eligibleToReview = false;
  Map<String, dynamic>? _existingReview;

  String get _productId => widget.product['_id'].toString();
  int get _availableStock =>
      ((_selectedVariant?['stock'] ?? widget.product['stock'] ?? 0) as num)
          .toInt();

  @override
  void initState() {
    super.initState();
    final variants = widget.product['variants'] as List<dynamic>?;
    if (variants != null && variants.isNotEmpty) {
      _selectedVariant = Map<String, dynamic>.from(variants.first);
      _currentPrice = (_selectedVariant!['price'] as num).toDouble();
    } else {
      _currentPrice = (widget.product['price'] as num).toDouble();
    }
    _rating = (widget.product['rating'] as num?)?.toDouble() ?? 0;
    _reviewCount = (widget.product['reviewCount'] as num?)?.toInt() ?? 0;
    _loadReviews();
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _loadReviews() async {
    try {
      final reviewsResponse = await _api.dio.get(
        '/reviews/product/$_productId',
      );
      Map<String, dynamic>? eligibility;
      if (mounted && context.read<AuthProvider>().isAuthenticated) {
        final response = await _api.dio.get('/reviews/eligibility/$_productId');
        eligibility = Map<String, dynamic>.from(response.data);
      }

      if (!mounted) return;
      setState(() {
        _reviews = List<dynamic>.from(reviewsResponse.data['reviews'] ?? []);
        _reviewCount =
            (reviewsResponse.data['total'] as num?)?.toInt() ?? _reviewCount;
        _eligibleToReview = eligibility?['eligible'] == true;
        if (eligibility?['existingReview'] is Map) {
          _existingReview = Map<String, dynamic>.from(
            eligibility!['existingReview'],
          );
          _reviewRating = (_existingReview!['rating'] as num?)?.toInt() ?? 5;
          _reviewController.text =
              _existingReview!['comment']?.toString() ?? '';
        }
        _loadingReviews = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingReviews = false);
    }
  }

  Future<void> _submitReview() async {
    final comment = _reviewController.text.trim();
    if (comment.length < 3) {
      _showMessage('Please write at least 3 characters.');
      return;
    }

    setState(() => _submittingReview = true);
    try {
      final response = await _api.dio.post(
        '/reviews',
        data: {
          'productId': _productId,
          'rating': _reviewRating,
          'comment': comment,
        },
      );
      if (!mounted) return;
      setState(() {
        _existingReview = Map<String, dynamic>.from(response.data['review']);
        _submittingReview = false;
      });
      _showMessage(response.data['message'] ?? 'Review submitted.');
    } on DioException catch (error) {
      if (!mounted) return;
      setState(() => _submittingReview = false);
      _showMessage(
        error.response?.data?['message'] ?? 'Could not submit your review.',
      );
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final inStock = _availableStock > 0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: theme.colorScheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: widget.product['_id'],
                child: Image.network(
                  widget.product['imageUrl'] ?? '',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: Colors.grey[100],
                    child: const Icon(
                      Icons.image_not_supported_outlined,
                      size: 54,
                      color: Colors.grey,
                    ),
                  ),
                ),
              ),
            ),
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.92),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.black),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          widget.product['name'] ?? 'Product',
                          style: GoogleFonts.poppins(
                            fontSize: 23,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Rs. ${_currentPrice.toStringAsFixed(_currentPrice % 1 == 0 ? 0 : 2)}',
                        style: GoogleFonts.poppins(
                          fontSize: 21,
                          fontWeight: FontWeight.w700,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color:
                              (inStock ? const Color(0xFF2E7D32) : Colors.red)
                                  .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          inStock ? 'In stock' : 'Out of stock',
                          style: TextStyle(
                            color: inStock
                                ? const Color(0xFF2E7D32)
                                : Colors.red,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.star_rounded,
                        color: Color(0xFFFFB300),
                        size: 22,
                      ),
                      Text(
                        _reviewCount == 0
                            ? ' No reviews yet'
                            : ' ${_rating.toStringAsFixed(1)} ($_reviewCount)',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _sectionTitle('Description'),
                  const SizedBox(height: 8),
                  Text(
                    widget.product['description']?.toString().isNotEmpty == true
                        ? widget.product['description']
                        : 'Product information is being updated.',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors.grey[700],
                      height: 1.55,
                    ),
                  ),
                  if ((widget.product['variants'] as List?)?.isNotEmpty ==
                      true) ...[
                    const SizedBox(height: 24),
                    _sectionTitle('Select option'),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<Map<String, dynamic>>(
                      initialValue: _selectedVariant,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.grey[50],
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Colors.grey[300]!),
                        ),
                      ),
                      items: (widget.product['variants'] as List).map((item) {
                        final variant = Map<String, dynamic>.from(item);
                        return DropdownMenuItem(
                          value: variant,
                          child: Text(
                            '${variant['unit']}  -  Rs. ${variant['price']}',
                          ),
                        );
                      }).toList(),
                      onChanged: (variant) {
                        if (variant == null) return;
                        setState(() {
                          _selectedVariant = variant;
                          _currentPrice = (variant['price'] as num).toDouble();
                          _quantity = 1;
                        });
                      },
                    ),
                  ],
                  const SizedBox(height: 26),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _sectionTitle('Quantity'),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove),
                              onPressed: _quantity > 1
                                  ? () => setState(() => _quantity--)
                                  : null,
                            ),
                            SizedBox(
                              width: 28,
                              child: Text(
                                '$_quantity',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add),
                              onPressed: _quantity < _availableStock
                                  ? () => setState(() => _quantity++)
                                  : null,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  _buildReviews(theme),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Colors.grey[200]!)),
          ),
          child: SizedBox(
            height: 54,
            child: ElevatedButton.icon(
              onPressed: inStock
                  ? () {
                      context.read<CartProvider>().addToCart(
                        widget.product,
                        _quantity,
                        selectedVariant: _selectedVariant,
                      );
                      _showMessage(
                        '${widget.product['name']} added to your cart.',
                      );
                    }
                  : null,
              icon: const Icon(Icons.shopping_bag_outlined),
              label: Text(
                inStock
                    ? 'Add to cart - Rs. ${(_currentPrice * _quantity).toStringAsFixed(0)}'
                    : 'Out of stock',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReviews(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _sectionTitle('Customer reviews'),
            if (_reviewCount > 0)
              Text(
                '$_reviewCount verified',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
          ],
        ),
        if (_eligibleToReview) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF7FAF7),
              border: Border.all(color: const Color(0xFFDCE9DC)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _existingReview == null
                      ? 'Rate your purchase'
                      : 'Update your review',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Row(
                  children: List.generate(5, (index) {
                    final value = index + 1;
                    return IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(
                        minWidth: 38,
                        minHeight: 38,
                      ),
                      onPressed: () => setState(() => _reviewRating = value),
                      icon: Icon(
                        value <= _reviewRating
                            ? Icons.star_rounded
                            : Icons.star_border_rounded,
                        color: const Color(0xFFFFB300),
                        size: 30,
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _reviewController,
                  minLines: 3,
                  maxLines: 5,
                  maxLength: 1000,
                  decoration: InputDecoration(
                    hintText: 'What did you think of this product?',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submittingReview ? null : _submitReview,
                    child: _submittingReview
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            _existingReview == null
                                ? 'Submit for approval'
                                : 'Update review',
                          ),
                  ),
                ),
                if (_existingReview != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Status: ${_existingReview!['status']}',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        if (_loadingReviews)
          const Center(child: CircularProgressIndicator())
        else if (_reviews.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 28),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Column(
              children: [
                Icon(Icons.reviews_outlined, color: Colors.grey),
                SizedBox(height: 8),
                Text(
                  'No approved reviews yet.',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          )
        else
          ..._reviews.map((item) {
            final review = Map<String, dynamic>.from(item);
            final user = review['user'] is Map
                ? Map<String, dynamic>.from(review['user'])
                : <String, dynamic>{};
            final rating = (review['rating'] as num?)?.toInt() ?? 0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: theme.colorScheme.primary.withValues(
                          alpha: 0.1,
                        ),
                        child: Text(
                          (user['name']?.toString().trim().isNotEmpty == true
                                  ? user['name'].toString().trim()[0]
                                  : 'C')
                              .toUpperCase(),
                          style: TextStyle(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user['name'] ?? 'Customer',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Row(
                              children: List.generate(
                                5,
                                (index) => Icon(
                                  Icons.star_rounded,
                                  size: 15,
                                  color: index < rating
                                      ? const Color(0xFFFFB300)
                                      : Colors.grey[300],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Row(
                        children: [
                          Icon(
                            Icons.verified,
                            size: 15,
                            color: Color(0xFF2E7D32),
                          ),
                          SizedBox(width: 3),
                          Text(
                            'Verified',
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFF2E7D32),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    review['comment'] ?? '',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      height: 1.5,
                      color: Colors.grey[800],
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700),
    );
  }
}
