class HomeSection {
  final String id;
  final String title;
  final String type; // 'horizontal' or 'grid'
  final String filterType; // 'latest', 'featured', 'category'
  final String categoryId;

  HomeSection({
    required this.id,
    required this.title,
    required this.type,
    required this.filterType,
    required this.categoryId,
  });

  factory HomeSection.fromJson(Map<String, dynamic> json) {
    return HomeSection(
      id: json['_id'],
      title: json['title'] ?? '',
      type: json['type'] ?? 'horizontal',
      filterType: json['filterType'] ?? 'latest',
      categoryId: json['categoryId'] ?? '',
    );
  }
}
