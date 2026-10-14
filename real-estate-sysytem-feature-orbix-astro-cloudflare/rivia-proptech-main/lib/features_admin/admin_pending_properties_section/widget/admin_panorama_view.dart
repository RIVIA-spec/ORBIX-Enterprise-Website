import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';

class AdminPanoramaView extends StatelessWidget {
  const AdminPanoramaView({super.key, required this.request});

  final Map request;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // === جلب وعرض صور الـ 360° (panorama) من Firestore ===
        FutureBuilder<DocumentSnapshot>(
          future: FirebaseFirestore.instance
              .collection('property_requests') // افترضنا أن البطاقة تخص طلب نشر؛ استخدم نفس المسار الذي تحفظ فيه الصور
              .doc(request['request_id'])
              .collection('panorama_tour')
              .doc('main')
              .get(),
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              // عرض Loading داخل مساحة ثابتة حتى لا يغيّر ارتفاع البطاقة كثيرًا
              return SizedBox(
                height: 140,
                child: Center(child: CircularProgressIndicator()),
              );
            }

            if (!snap.hasData || !snap.data!.exists) {
              return const SizedBox.shrink();
            }

            final data = snap.data!.data() as Map<String, dynamic>;
            final List panoramas = data['images'] ?? [];

            if (panoramas.isEmpty) return const SizedBox.shrink();

            // عرض مختصر لمعاينة البانوراما
            return Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.cyan.withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.vrpano, color: Colors.cyan, size: 26),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "جولة بانورامية 360°",
                          style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.cyan.shade50,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Text(
                          "${panoramas.length} مشاهد",
                          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.cyan.shade700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  SizedBox(
                    height: 120,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: panoramas.length.clamp(0, 8),
                      itemBuilder: (ctx, i) {
                        if (i == 7 && panoramas.length > 8) {
                          return Container(
                            width: 120,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              color: Colors.black.withOpacity(0.08),
                            ),
                            child: Center(
                              child: Text(
                                "+${panoramas.length - 7}",
                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                              ),
                            ),
                          );
                        }

                        final url = panoramas[i]['url'];
                        final name = panoramas[i]['name'] ?? 'مشهد ${i + 1}';

                        return Container(
                          width: 120,
                          margin: const EdgeInsets.only(right: 8),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Stack(
                              children: [
                                Image.network(url, fit: BoxFit.cover, width: 120, height: 120),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [Colors.transparent, Colors.black.withOpacity(0.45)],
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  bottom: 6,
                                  left: 6,
                                  right: 6,
                                  child: Text(
                                    name,
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    textAlign: TextAlign.center,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Positioned.fill(
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
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

                  const SizedBox(height: 12),

                  // زر الدخول للجولة (نسخة أصغر لتناسب البطاقة)
                  SizedBox(
                    width: double.infinity,
                    child: CustomButton(
                      text: "اطلع على الجولة الكاملة",
                      leadingIcon: Icons.vrpano_rounded,
                      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 6),
                      backgroundColor: Colors.cyan.shade600,
                      foregroundColor: Colors.white,
                      fontSize: 14,
                      height: 46,
                      onPressed: () {
                        Get.to(() => PanoramaViewerScreen(panoramas: panoramas, startIndex: 0));
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        ),

        if (request['panorama_tour'] != null && (request['panorama_tour'] as List).isNotEmpty)
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "جولة بانورامية 360°",
                  style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: (request['panorama_tour'] as List).length,
                    itemBuilder: (ctx, i) {
                      final pano = request['panorama_tour'][i];
                      final url = pano['url'];
                      final name = pano['name'] ?? "غرفة ${i + 1}";
                      return Container(
                        width: 120,
                        margin: const EdgeInsets.only(right: 8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Stack(
                            children: [
                              Image.network(url, width: 120, height: 120, fit: BoxFit.cover),
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [Colors.transparent, Colors.black.withOpacity(0.6)],
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: 6,
                                left: 6,
                                right: 6,
                                child: Text(
                                  name,
                                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Positioned.fill(
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: () => Get.to(() => PanoramaViewerScreen(
                                          panoramas: request['panorama_tour'],
                                          startIndex: i,
                                        )),
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
              ],
            ),
          ),
      ],
    );
  }
}