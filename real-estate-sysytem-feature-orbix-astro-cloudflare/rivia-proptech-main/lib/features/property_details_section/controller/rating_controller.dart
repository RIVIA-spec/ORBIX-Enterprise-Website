// lib/features/property_details_scetion/controller/rating_controller.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class RatingController extends GetxController {
  final TextEditingController reviewController = TextEditingController();
  var selectedRating = 0.0.obs;
  var isLoading = false.obs;

  // عرض BottomSheet للتقييم
  void showRatingSheet({
    required String propertyId,
    required String propertyTitle,
    required String userId,
    double? initialRating,
    String? initialReview,
  }) {
    selectedRating.value = initialRating ?? 0;
    reviewController.text = initialReview ?? '';

    Get.bottomSheet(
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(Get.context!).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // مقبض السحب
            Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10)),
            ),
            const SizedBox(height: 16),

            // العنوان
            Text(
              "قيّم تجربتك في $propertyTitle",
              style:
                  GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              "فقط المستأجرون الفعليون يمكنهم التقييم",
              style:
                  GoogleFonts.cairo(fontSize: 12, color: Colors.green.shade700),
            ),
            const SizedBox(height: 20),

            // النجوم
            Center(
              child: Obx(() => Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(5, (i) {
                      return GestureDetector(
                        onTap: () => selectedRating.value = (i + 1).toDouble(),
                        child: Icon(
                          i < selectedRating.value
                              ? Icons.star
                              : Icons.star_border,
                          color: Colors.amber,
                          size: 40,
                        ),
                      );
                    }),
                  )),
            ),
            const SizedBox(height: 8),
            Text(
              _getRatingText(selectedRating.value),
              style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey[700]),
            ),
            const SizedBox(height: 20),

            // حقل المراجعة (اختياري)
            CustomTextFormField(
              controller: reviewController,
              hint: "اكتب مراجعتك (اختياري)...",
              maxLines: 3,
              // minLines: 2,
            ),

            const SizedBox(height: 16),

            // الأزرار
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => safeBack(),
                    child: Text("إلغاء", style: GoogleFonts.cairo()),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Obx(() => ElevatedButton(
                        onPressed: isLoading.value || selectedRating.value == 0
                            ? null
                            : () => _submitRating(
                                  propertyId: propertyId,
                                  userId: userId,
                                ),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.amber.shade700),
                        child: isLoading.value
                            ? LoadingProgressiveDots()
                            : Text("إرسال التقييم",
                                style: GoogleFonts.cairo(color: Colors.white)),
                      )),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  String _getRatingText(double rating) {
    switch (rating.toInt()) {
      case 1:
        return "سيء جدًا";
      case 2:
        return "سيء";
      case 3:
        return "متوسط";
      case 4:
        return "جيد";
      case 5:
        return "ممتاز!";
      default:
        return "اختر تقييمك";
    }
  }

  Future<void> _submitRating({
    required String propertyId,
    required String userId,
  }) async {
    if (selectedRating.value == 0) return;

    isLoading.value = true;
    try {
      final authUser = FirebaseAuth.instance.currentUser;
      if (authUser == null || authUser.uid != userId) {
        showSnackBar("خطأ", "جلسة منتهية");
        return;
      }

      // تحقق من الحجز المؤكد
      final hasConfirmedBooking =
          await checkConfirmedBooking(userId, propertyId);
      if (!hasConfirmedBooking) {
        showSnackBar("غير مسموح", "لا يمكنك التقييم إلا بعد الحجز والإقامة");

        return;
      }

      final ratingRef = FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .collection('ratings')
          .doc(userId); // واحد لكل مستخدم

      await ratingRef.set({
        'rating': selectedRating.value,
        'review': reviewController.text.trim(),
        'userId': userId,
        'userName': await _getUserName(userId),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      // تحديث متوسط التقييم في العقار
      await _updatePropertyAverageRating(propertyId);

      showSnackBar("تم!", "تم إرسال تقييمك بنجاح",
          backgroundColor: Colors.amber.shade700, colorText: Colors.white);
    } catch (e) {
      showSnackBar("فشل", "تعذر إرسال التقييم: $e",
          backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isLoading.value = false;
    }
  }

  // في RatingController
  Future<bool> checkConfirmedBooking(String userId, String propertyId) async {
    try {
      final snap = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .where('property_id', isEqualTo: propertyId)
          .where('status', isEqualTo: 'confirmed')
          .limit(1)
          .get();
      return snap.docs.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  Future<String> _getUserName(String userId) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();
      return doc.data()?['username'] ?? 'مجهول';
    } catch (e) {
      return 'مجهول';
    }
  }

  Future<void> _updatePropertyAverageRating(String propertyId) async {
    final ratingsSnap = await FirebaseFirestore.instance
        .collection('properties')
        .doc(propertyId)
        .collection('ratings')
        .get();

    if (ratingsSnap.docs.isEmpty) {
      await FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .update({
        'rating': {
          'average': 0.0,
          'count': 0,
        },
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return;
    }

    double sum = 0;
    for (var doc in ratingsSnap.docs) {
      sum += (doc.data()['rating'] as num).toDouble();
    }

    final average = sum / ratingsSnap.docs.length;

    await FirebaseFirestore.instance
        .collection('properties')
        .doc(propertyId)
        .update({
      'rating': {
        'average': double.parse(average.toStringAsFixed(1)),
        'count': ratingsSnap.docs.length,
      },
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  // جلب تقييم المستخدم الحالي
  Stream<DocumentSnapshot> getUserRatingStream(
      String propertyId, String userId) {
    return FirebaseFirestore.instance
        .collection('properties')
        .doc(propertyId)
        .collection('ratings')
        .doc(userId)
        .snapshots();
  }

  // جلب جميع التقييمات
  Stream<QuerySnapshot> getRatingsStream(String propertyId) {
    return FirebaseFirestore.instance
        .collection('properties')
        .doc(propertyId)
        .collection('ratings')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }
}
