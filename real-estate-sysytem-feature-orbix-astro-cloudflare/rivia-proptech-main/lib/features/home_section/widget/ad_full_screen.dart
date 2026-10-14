import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:photo_view/photo_view.dart';
import 'package:real_estate_app/features_admin/ads_section/ad_model.dart';
import 'package:url_launcher/url_launcher.dart';

class AdFullScreenView extends StatelessWidget {
  final AdModel ad;

  const AdFullScreenView({required this.ad, super.key});

  Future<void> _launchUrl() async {
    final uri = Uri.tryParse(ad.link);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      Get.snackbar('خطأ', 'لا يمكن فتح الرابط');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // الصورة بملء الشاشة مع تكبير
          PhotoView(
            imageProvider: NetworkImage(ad.imageUrl),
            minScale: PhotoViewComputedScale.contained,
            maxScale: PhotoViewComputedScale.covered * 3,
            loadingBuilder: (context, event) => const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
            errorBuilder: (context, error, stackTrace) => const Center(
              child: Icon(Icons.broken_image, color: Colors.white, size: 80),
            ),
          ),

          // زر الإغلاق في الأعلى
          Positioned(
            top: 40,
            left: 16,
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.white, size: 32),
              onPressed: () => Get.back(),
            ),
          ),

          // زر الرابط في الأسفل إذا كان موجودًا
          if (ad.link.isNotEmpty)
            Positioned(
              bottom: 40,
              left: 24,
              right: 24,
              child: ElevatedButton.icon(
                onPressed: _launchUrl,
                icon: const Icon(Icons.link, color: Colors.white),
                label: Text(
                  "اطلع على التفاصيل",
                  style: GoogleFonts.cairo(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 8,
                ),
              ),
            ),
        ],
      ),
    );
  }
}