class ProductVariant {
  final String unit;
  final double price;
  final int stock;
  final double? oldPrice;

  ProductVariant({
    required this.unit,
    required this.price,
    required this.stock,
    this.oldPrice,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      unit: json['unit'],
      price: (json['price'] as num).toDouble(),
      stock: json['stock'] ?? 0,
      oldPrice: json['oldPrice'] != null ? (json['oldPrice'] as num).toDouble() : null,
    );
  }
}

class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String imageUrl;
  final int stock;
  final double? oldPrice;
  final bool isFeatured;
  final List<ProductVariant> variants;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.stock,
    this.oldPrice,
    this.isFeatured = false,
    this.variants = const [],
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'],
      name: json['name'],
      description: json['description'] ?? '',
      price: (json['price'] as num).toDouble(),
      imageUrl: json['imageUrl'] ?? '',
      stock: json['stock'] ?? 0,
      oldPrice: json['oldPrice'] != null ? (json['oldPrice'] as num).toDouble() : null,
      isFeatured: json['isFeatured'] ?? false,
      variants: (json['variants'] as List<dynamic>?)
              ?.map((v) => ProductVariant.fromJson(v))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'price': price,
      'imageUrl': imageUrl,
      'stock': stock,
      'oldPrice': oldPrice,
      'isFeatured': isFeatured,
      'variants': variants
          .map((variant) => {
                'unit': variant.unit,
                'price': variant.price,
                'stock': variant.stock,
                'oldPrice': variant.oldPrice,
              })
          .toList(),
    };
  }
}
