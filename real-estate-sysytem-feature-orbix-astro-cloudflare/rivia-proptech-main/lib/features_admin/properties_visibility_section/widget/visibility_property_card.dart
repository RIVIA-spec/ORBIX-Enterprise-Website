// lib/features/admin/visibility/widgets/visibility_property_card.dart
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';

class VisibilityPropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final String docId;
  final Function(String, bool) onToggleVisibility;
  final bool isLoading;

  VisibilityPropertyCard({
    super.key,
    required this.property,
    required this.docId,
    required this.onToggleVisibility,
    required this.isLoading,
  });
  

  @override
  Widget build(BuildContext context) {
    final String title = property['title'] ?? 'بدون عنوان';
    final String type = property['property_type'] ?? '';
    final int area = property['area'] ?? 0;
    final String areaUnit = property['area_unit'] ?? 'م²';
    final String mainImage = property['mainImage'] ?? '';
    final bool isVisible = property['isVisible'] == true;

    String priceText = '';
    if (type == 'إيجار') {
      final daily = property['daily_price'] ?? '';
      final currency = property['daily_price_currency'] ?? '';
      priceText = daily.isNotEmpty ? '$daily $currency / يوم' : 'غير محدد';
    } else if (type == 'بيع') {
      final price = property['selling_price'] ?? '';
      final currency = property['selling_price_currency'] ?? '';
      priceText = price.isNotEmpty ? '$price $currency' : 'غير محدد';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        child: Row(
          children: [
            // === زر الرؤية (يسار) ===
            SizedBox(
              width: Get.width * 0.165,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: isLoading
                    ? LoadingThreeArchedCircle(
                        size: 28,
                        color: isVisible ? Colors.grey : Colors.green,
                      )
                    : IconButton(
                        icon: Icon(
                          isVisible ? Icons.visibility : Icons.visibility_off,
                          color: isVisible ? Colors.green : Colors.grey,
                          size: 28,
                        ),
                        onPressed: () async {
                          await onToggleVisibility(docId, isVisible);
                        },
                      ),
              ),
            ),

            // === الصورة + المعلومات ===
            Expanded(
              child: Row(
                children: [
                  // الصورة
                  ClipRRect(
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      bottomLeft: Radius.circular(12),
                    ),
                    child: mainImage.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: mainImage,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(color: Colors.grey[300]),
                            errorWidget: (_, __, ___) => const Icon(Icons.broken_image, size: 40),
                          )
                        : Container(
                            width: 100,
                            height: 100,
                            color: Colors.grey[300],
                            child: const Icon(Icons.image, size: 40),
                          ),
                  ),

                  const SizedBox(width: 12),

                  // النصوص
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.cairo(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "$type • $area $areaUnit",
                            style: TextStyle(color: Colors.grey[600], fontSize: 13),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            priceText,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: isVisible ? Colors.green.shade100 : Colors.red.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isVisible ? "مرئي" : "مخفي",
                              style: TextStyle(
                                color: isVisible ? Colors.green.shade700 : Colors.red.shade700,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}