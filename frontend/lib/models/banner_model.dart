class AppBanner {
  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String linkType;
  final String linkId;

  AppBanner({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.linkType,
    required this.linkId,
  });

  factory AppBanner.fromJson(Map<String, dynamic> json) {
    return AppBanner(
      id: json['_id'],
      title: json['title'] ?? '',
      subtitle: json['subtitle'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      linkType: json['linkType'] ?? 'none',
      linkId: json['linkId'] ?? '',
    );
  }
}
