// lib/features_admin/ads/models/ad_model.dart

class AdModel {
  final String id;
  final String imageUrl;
  final int order;
  final String link; // جديد: رابط اختياري

  AdModel({
    required this.id,
    required this.imageUrl,
    required this.order,
    this.link = '', // افتراضي فارغ = اختياري
  });

  factory AdModel.fromMap(String id, Map<String, dynamic> data) {
    return AdModel(
      id: id,
      imageUrl: data['imageUrl'] ?? '',
      order: data['order'] ?? 999,
      link: data['link'] ?? '', // قراءة الرابط إن وجد
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'imageUrl': imageUrl,
      'order': order,
      'link': link,
    };
  }
}