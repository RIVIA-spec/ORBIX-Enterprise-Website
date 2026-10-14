// lib/features_admin/ads/widget/ad_tile.dart

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:photo_view/photo_view.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/features_admin/ads_section/ad_model.dart';
import '../controller/ads_managment_controller.dart';

class AdTile extends StatelessWidget {
  final AdModel ad;
  final AdsManagmentController controller;

  const AdTile({required this.ad, required this.controller, super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // الشريط العلوي: زر تعديل (يسار) + رقم الإعلان (منتصف) + زر حذف (يمين)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // زر التعديل (يسار)
                IconButton(
                  onPressed: () => controller.showEditAdBottomSheet(ad),
                  icon: const Icon(Icons.edit_rounded, color: Colors.blueAccent, size: 26),
                  tooltip: 'تعديل الإعلان',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),

                // رقم الإعلان (منتصف)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.blueAccent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(color: Colors.blueAccent, width: 1.5),
                  ),
                  child: Text(
                    'إعلان #${ad.order}',
                    style: GoogleFonts.cairo(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.blueAccent,
                    ),
                  ),
                ),

                // زر الحذف (يمين)
                IconButton(
                  onPressed: () => controller.showDeleteConfirmationBottomSheet(ad),
                  icon: const Icon(Icons.delete_forever_rounded, color: Colors.red, size: 26),
                  tooltip: 'حذف الإعلان',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),

          // الصورة - قابلة للنقر للتكبير
          GestureDetector(
            onTap: () {
              // فتح الصورة بملء الشاشة مع تكبير
              Get.dialog(
                Scaffold(
                  backgroundColor: Colors.black,
                  appBar: AppBar(
                    backgroundColor: Colors.transparent,
                    elevation: 0,
                    leading: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => safeBack(),
                    ),
                  ),
                  body: PhotoView(
                    imageProvider: CachedNetworkImageProvider(ad.imageUrl),
                    minScale: PhotoViewComputedScale.contained,
                    maxScale: PhotoViewComputedScale.covered * 3,
                    loadingBuilder: (context, event) => const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
                  ),
                ),
                barrierColor: Colors.black.withOpacity(0.9),
                transitionDuration: const Duration(milliseconds: 300),
              );
            },
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
              child: Hero(
                tag: 'ad_image_${ad.id}', // لتأثير انتقال جميل
                child: CachedNetworkImage(
                  imageUrl: ad.imageUrl,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: Colors.grey[200],
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.grey[300],
                    child: const Icon(Icons.broken_image, size: 60, color: Colors.redAccent),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}