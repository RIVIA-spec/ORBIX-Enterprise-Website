// lib/features/property_details_scetion/widget/panorama_tour_section.dart

import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';

// lib/features/property_details_scetion/widget/panorama_tour_section.dart

class PanoramaTourSection extends StatelessWidget {
  final String propertyId;
  const PanoramaTourSection({super.key, required this.propertyId});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .collection('panorama_tour')
          .doc('main')
          .get(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || !snapshot.data!.exists) return const SizedBox.shrink();

        final data = snapshot.data!.data() as Map<String, dynamic>;
        final List panoramas = data['images'] ?? [];

        if (panoramas.isEmpty) return const SizedBox.shrink();

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            gradient: const LinearGradient(
              colors: [Color(0xFF0D47A1), Color(0xFF1976D2), Color(0xFF42A5F5)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.blue.withOpacity(0.5),
                blurRadius: 30,
                offset: const Offset(0, 15),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(30),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.45),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.cyan.withOpacity(0.3),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.vrpano, color: Colors.cyan, size: 36),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            "جولة بانورامية 360° تفاعلية",
                            style: GoogleFonts.cairo(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              shadows: const [Shadow(color: Colors.black54, blurRadius: 8)],
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.cyan,
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            "${panoramas.length} مشاهد",
                            style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.black),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // معاينة الصور مع تأثير زجاجي
                    SizedBox(
                      height: 130,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: panoramas.length.clamp(0, 8),
                        itemBuilder: (ctx, i) {
                          if (i == 7 && panoramas.length > 8) {
                            return Container(
                              width: 130,
                              margin: const EdgeInsets.only(left: 12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                color: Colors.white.withOpacity(0.2),
                              ),
                              child: Center(
                                child: Text(
                                  "+${panoramas.length - 7}",
                                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
                                ),
                              ),
                            );
                          }

                          final url = panoramas[i]['url'];
                          final name = panoramas[i]['name'] ?? 'غرفة ${i + 1}';

                          return Container(
                            width: 130,
                            margin: const EdgeInsets.only(left: 12),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Stack(
                                children: [
                                  if (url != null && url.isNotEmpty)
                                    Image.network(url, fit: BoxFit.cover, width: 130, height: 130)
                                  else
                                    const Icon(Icons.image, size: 30),
                                  Container(
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [Colors.transparent, Colors.black87],
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 8,
                                    left: 8,
                                    right: 8,
                                    child: Text(
                                      name,
                                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                      textAlign: TextAlign.center,
                                      maxLines: 2,
                                    ),
                                  ),
                                  Positioned.fill(
                                    child: Material(
                                      color: Colors.transparent,
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(20),
                                        onTap: () => Get.to(() => PanoramaViewerScreen(panoramas: panoramas, startIndex: i)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 24),

                    // زر الدخول للجولة
                    SizedBox(
                      width: double.infinity,
                      child: CustomButton(
                        text: "ادخل الجولة الافتراضية الآن",
                        leadingIcon: Icons.vrpano_rounded,
                        padding: EdgeInsets.symmetric(horizontal: 0, vertical: 5),
                        backgroundColor: Colors.cyan.shade600,
                        foregroundColor: Colors.white,
                        fontSize: 17,
                        height: 60,
                        onPressed: () {
                          Get.to(() => PanoramaViewerScreen(panoramas: panoramas, startIndex: 0));
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}