import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/features/home_section/controller/home_controller.dart';

class NoDataYet extends StatelessWidget {
  const NoDataYet({super.key});

  @override
  Widget build(BuildContext context) {
    final homeCtr = Get.find<HomeController>();
    return Center(
      child: Padding(
        padding: EdgeInsets.only(top: Get.height * 0.1),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // أيقونة جميلة رمزية
            Container(
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(20),
              child: Icon(
                Icons.home_outlined,
                color: Colors.orange[700],
                size: 60,
              ),
            ),
            const SizedBox(height: 16),

            // النص الرئيسي
            const Text(
              "لا توجد بيانات بعد",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),

            const SizedBox(height: 6),

            // النص الثانوي الهادئ
            Text(
              "سيتم عرض العقارات هنا فور توفرها",
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 24),

            // زر تحديث بسيط (اختياري)
            ElevatedButton.icon(
              onPressed: () => homeCtr.loadData(),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text("تحديث الآن"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange[700],
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
              ),
            ),
          ],
        ),
      ),
    );
  }
}