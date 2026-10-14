// lib/features/user/my_property/widget/compact_property_request_card.dart
import 'package:flutter/material.dart';
import 'package:real_estate_app/core/widgets/image_preview_widget.dart';

class CompactPropertyRequestCard extends StatelessWidget {
  final Map<String, dynamic> request;
  const CompactPropertyRequestCard({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            // الصورة المصغرة
            // SizedBox(
            //   width: 40, height: 60,
            //   child: request['mainImage'] == null || request['mainImage'] == "" ?
            //   Icon(Icons.image_not_supported_outlined) :
            //   Image.network(request['mainImage'],
            //     height: 60,
            //     fit: BoxFit.contain,
            //   ),
            // ),
            const SizedBox(width: 10),

            // التفاصيل (مصغرة)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    request['title'] ?? 'بدون عنوان',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "${request['city'] ?? ''}, ${request['country'] ?? ''}",
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 12, color: Colors.orange[700]),
                      const SizedBox(width: 4),
                      Text(
                        "قيد المراجعة",
                        style: TextStyle(color: Colors.orange[700], fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // حالة
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.orange.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                "معلق",
                style: TextStyle(color: Colors.orange.shade800, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}