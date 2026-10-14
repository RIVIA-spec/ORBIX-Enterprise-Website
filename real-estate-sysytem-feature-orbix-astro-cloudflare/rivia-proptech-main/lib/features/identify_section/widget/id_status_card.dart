// lib/widgets/id_status_card.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import '../controller/identity_controller.dart';

class IdStatusCard extends StatelessWidget {
  final IdentityController ctrl;

  const IdStatusCard({super.key, required this.ctrl});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final status = ctrl.verificationStatus.value;
      final frontUrl = ctrl.frontIdUrl.value;
      final backUrl = ctrl.backIdUrl.value;

      if (status == null) return const SizedBox.shrink();

      return Card(
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 4,
        child: Column(
          children: [
            // === البطاقة الملونة (عرض كامل) ===
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: _getColor(status),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                gradient: LinearGradient(
                  colors: [_getColor(status).withOpacity(0.9), _getColor(status)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                children: [
                  Icon(_getIcon(status), size: 56, color: Colors.white),
                  const SizedBox(height: 16),
                  Text(
                    _getMessage(status),
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  if (status == 'rejected' && ctrl.rejectionReason.value != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        "السبب: ${ctrl.rejectionReason.value}",
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                    ),
                ],
              ),
            ),

            // === صور الهوية (أيقونات صغيرة) ===
            if (frontUrl != null || backUrl != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    if (frontUrl != null)
                      _buildImageThumb(frontUrl, "الوجه الأمامي"),
                    if (backUrl != null)
                      _buildImageThumb(backUrl, "الوجه الخلفي"),
                  ],
                ),
              ),
          ],
        ),
      );
    });
  }

  Widget _buildImageThumb(String url, String label) {
    return GestureDetector(
      onTap: () => Get.dialog(
        Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          backgroundColor: Colors.transparent,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        label,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SizedBox(
                        height: Get.height * 0.6,
                        width: Get.width * 0.9,
                        child: InteractiveViewer(
                          child: Image.network(
                            url,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Icon(Icons.error_outline, color: Colors.red, size: 50),
                          ),
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () => safeBack(),
                      child: const Text("إغلاق", style: TextStyle(color: Colors.white, fontSize: 16)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 80,
              height: 80,
              color: Colors.grey[100],
              child: Image.network(
                url,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Center(
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                          : null,
                      strokeWidth: 2,
                      color: Colors.grey,
                    ),
                  );
                },
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.error_outline,
                  color: Colors.red,
                  size: 32,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ],
      ),
    );
  }

  Color _getColor(String status) {
    return {
      'verified': Colors.green[600]!,
      'pending': Colors.orange[600]!,
      'rejected': Colors.red[600]!,
    }[status] ?? Colors.grey[600]!;
  }

  IconData _getIcon(String status) {
    return {
      'verified': Icons.check_circle_outline,
      'pending': Icons.hourglass_empty,
      'rejected': Icons.cancel_outlined,
    }[status] ?? Icons.help_outline;
  }

  String _getMessage(String status) {
    return {
      'verified': "تم التحقق من هويتك بنجاح!",
      'pending': "طلبك قيد المراجعة...",
      'rejected': "تم رفض الطلب",
    }[status] ?? "";
  }
}