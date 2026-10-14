import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
// import 'package:panorama_viewer/panorama_viewer.dart';
import 'package:real_estate_app/features/virtual_tour_section/controller/virtual_tour_controller.dart';

// 🔹 صفحة رفع الصور 360°
class UploadPage extends StatelessWidget {
  const UploadPage({super.key});

  @override
  Widget build(BuildContext context) {
    final TourController controller = Get.put(TourController());

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blueAccent,
        centerTitle: true,
        title: Text(
          "رفع صور 360°",
          style: GoogleFonts.cairo(color: Colors.white),
        ),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,color: Colors.white,),
          onPressed: () => safeBack(),
        ),
      ),
      body: Obx(() {
        if (controller.images.isEmpty) {
          return Center(child: Text("لم يتم رفع أي صور 360° بعد" ,style: GoogleFonts.cairo()));
        }
        return GridView.builder(
          padding: const EdgeInsets.all(12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
          ),
          itemCount: controller.images.length,
          itemBuilder: (context, index) {
            return GestureDetector(
              onTap: () {
                // فتح الصورة في شاشة عرض 360°
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        View360Page(imageFile: controller.images[index]),
                  ),
                );
              },
              child: Stack(
                children: [
                  Image.file(
                    controller.images[index],
                    fit: BoxFit.cover,
                    width: double.infinity,
                  ),
                  const Positioned(
                    right: 8,
                    top: 8,
                    child: Icon(
                      Icons.threesixty,
                      color: Colors.white,
                      size: 30,
                    ),
                  ),
                ],
              ),
            );
          },
        );
      }),
      floatingActionButton: FloatingActionButton(
        onPressed: controller.pickImage,
        child: const Icon(Icons.add_a_photo),
      ),
    );
  }
}

// 🔹 شاشة عرض صورة 360°
class View360Page extends StatelessWidget {
  final File imageFile;

  const View360Page({super.key, required this.imageFile});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("عرض صورة 360°")),
      // body: PanoramaViewer(
      //   child: Image.file(imageFile),
      //   animSpeed: 1.0, // سرعة دوران إذا بدك حركة تلقائية
      // ),
    );
  }
}
