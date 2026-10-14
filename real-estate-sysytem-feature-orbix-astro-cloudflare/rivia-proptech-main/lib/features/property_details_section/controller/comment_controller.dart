// lib/features/property_details_scetion/controller/comment_controller.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class CommentController extends GetxController {
  final TextEditingController commentController = TextEditingController();
  var isLoading = false.obs;

  // عرض BottomSheet لإضافة تعليق
  void showAddCommentSheet({
    required String propertyId,
    required String propertyTitle,
    required bool isHotel,
    required String userId,
  }) {
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
            Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10))),
            const SizedBox(height: 16),

            // العنوان
            Text(isHotel ? "أضف تعليقك على الفندق" : "أضف تعليقك على العقار", style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(propertyTitle, style: GoogleFonts.cairo(color: Colors.grey[700]), textAlign: TextAlign.center),
            const SizedBox(height: 20),

            // حقل التعليق
            CustomTextFormField(
              controller: commentController,
              hint: "اكتب تعليقك هنا...",
              maxLines: 5,
              // minLines: 3,
              keyboardType: TextInputType.multiline,
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
                        onPressed: isLoading.value
                            ? null
                            : () => _submitComment(
                                  propertyId: propertyId,
                                  userId: userId,
                                ),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                        child: isLoading.value
                            ? LoadingProgressiveDots()
                            : Text("إرسال", style: GoogleFonts.cairo(color: Colors.white)),
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

  Future<void> _submitComment({
    required String propertyId,
    required String userId,
  }) async {
    final comment = commentController.text.trim();
    if (comment.isEmpty) {
      showSnackBar("خطأ", "لا يمكن إرسال تعليق فارغ");
      return;
    }

    isLoading.value = true;
    try {
      final authUser = FirebaseAuth.instance.currentUser;
      if (authUser == null || authUser.uid != userId) {
        showSnackBar("خطأ", "جلسة منتهية، يرجى تسجيل الدخول مجددًا");
        return;
      }

      // جلب اسم المستخدم من Firestore (أو من email إذا لم يكن موجودًا)
      String userName = 'مجهول';
      try {
        final userDoc = await FirebaseFirestore.instance
            .collection('users')
            .doc(userId)
            .get();

        if (userDoc.exists) {
          userName = userDoc.data()?['username'] ?? authUser.displayName ?? 'مجهول';
        } else {
          userName = authUser.displayName ?? authUser.email?.split('@')[0] ?? 'مجهول';
        }
      } catch (e) {
        userName = authUser.email?.split('@')[0] ?? 'مجهول';
      }

      final hasBooked = await _checkIfUserHasConfirmedBooking(userId, propertyId);

      final commentRef = FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .collection('comments')
          .doc();

      await commentRef.set({
        'id': commentRef.id,
        'userId': userId,
        'userName': userName,
        'comment': comment,
        'hasBooked': hasBooked,
        'createdAt': FieldValue.serverTimestamp(),
      });

      commentController.clear();
      safeBack();
      showSnackBar("تم", "تم إضافة تعليقك بنجاح", backgroundColor: Colors.green, colorText: Colors.white);
    } catch (e) {
      showSnackBar("فشل", "تعذر إضافة التعليق: $e", backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isLoading.value = false;
    }
  }

  // تحقق من وجود حجز مؤكد
  Future<bool> _checkIfUserHasConfirmedBooking(String userId, String propertyId) async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('user_bookings')
          .where('property_id', isEqualTo: propertyId)
          .where('status', isEqualTo: 'confirmed')
          .limit(1)
          .get();

      return snapshot.docs.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  // جلب التعليقات (لعرضها)
  Stream<QuerySnapshot> getCommentsStream(String propertyId) {
    return FirebaseFirestore.instance
        .collection('properties')
        .doc(propertyId)
        .collection('comments')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // --- تعديل التعليق ---
  void showEditCommentSheet({
    required String propertyId,
    required String commentId,
    required String currentComment,
  }) {
    commentController.text = currentComment;

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
            Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10))),
            const SizedBox(height: 16),
            Text("تعديل التعليق", style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),

            CustomTextFormField(
              controller: commentController,
              hint: "اكتب تعليقك المعدل...",
              maxLines: 5,
              // minLines: 3,
              keyboardType: TextInputType.multiline,
            ),

            const SizedBox(height: 16),

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
                        onPressed: isLoading.value
                            ? null
                            : () => _updateComment(
                                  propertyId: propertyId,
                                  commentId: commentId,
                                ),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                        child: isLoading.value
                            ? LoadingProgressiveDots()
                            : Text("حفظ التعديل", style: GoogleFonts.cairo(color: Colors.white)),
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

  // --- حفظ التعديل ---
  Future<void> _updateComment({
    required String propertyId,
    required String commentId,
  }) async {
    final newComment = commentController.text.trim();
    if (newComment.isEmpty) {
      showSnackBar("خطأ", "لا يمكن حفظ تعليق فارغ");
      return;
    }

    isLoading.value = true;
    try {
      await FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .collection('comments')
          .doc(commentId)
          .update({
        'comment': newComment,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      commentController.clear();
      safeBack();
      showSnackBar("تم", "تم تعديل التعليق", backgroundColor: Colors.orange, colorText: Colors.white);
    } catch (e) {
      showSnackBar("فشل", "فشل التعديل: $e", backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isLoading.value = false;
    }
  }

  // --- حذف التعليق ---
  Future<void> deleteComment({
    required String propertyId,
    required String commentId,
    required String commentUserId,
    bool? isAdminOrOwner,
  }) async {
    var reason = '';
    // إذا كان مشرف أو مالك → نطلب سبب الحذف
    if (isAdminOrOwner == true) {
      final TextEditingController reasonController = TextEditingController();
      
      final confirmed = await Get.bottomSheet<bool>(
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        isScrollControlled: true, // ضروري لتجاوز لوحة المفاتيح
        Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(Get.context!).viewInsets.bottom + 24, // لتجنب تداخل الكيبورد
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // شريط السحب العلوي (اختياري، جمالي)
              Center(
                child: Container(
                  width: 50,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // العنوان
              Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
                  const SizedBox(width: 12),
                  Text(
                    "حذف التعليق",
                    style: GoogleFonts.cairo(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Text(
                "سيتم حذف التعليق نهائيًا ولن يمكن استرجاعه.",
                style: GoogleFonts.cairo(fontSize: 15, color: Colors.grey[800]),
              ),
              const SizedBox(height: 24),

              // حقل السبب
              Text(
                "سبب الحذف (سيظهر للمستخدم)",
                style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),

              CustomTextFormField(
                controller: reasonController,
                hint: "مثال: مخالفة قواعد النشر، إعلانات، سبام، محتوى غير لائق...",
                maxLines: 4,
                // textInputAction: TextInputAction.newline,
                onChanged: (value) {
                  // لتحديث الـ UI إذا أردت (مثل تفعيل الزر)
                },
              ),
              const SizedBox(height: 28),

              // الأزرار
              Row(
                children: [
                  // زر الإلغاء
                  Expanded(
                    child: SizedBox(
                      height: 50,
                      child: OutlinedButton(
                        onPressed: () => safeBack(result: false),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.grey.shade400),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Text(
                          "إلغاء",
                          style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey[700]),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),

                  // زر الحذف
                  Expanded(
                    child: SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          final text = reasonController.text.trim();
                          if (text.isEmpty) {
                            showSnackBar("مطلوب", "يرجى كتابة سبب الحذف", backgroundColor: Colors.orange);
                            return;
                          }
                          safeBack(result: true);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          elevation: 3,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Text(
                          "حذف التعليق",
                          style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );

      if (confirmed != true) return;

      reason = reasonController.text.trim();
    } 
    // إذا كان المستخدم يحذف تعليقه بنفسه → نؤكد فقط بدون سبب
    else {
      final confirm = await Get.dialog<bool>(
        AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text("حذف التعليق", style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
          content: Text("هل أنت متأكد من حذف تعليقك؟", style: GoogleFonts.cairo()),
          actions: [
            TextButton(onPressed: () => safeBack(result: false), child: Text("لا")),
            TextButton(
              onPressed: () => safeBack(result: true),
              child: Text("نعم، احذف", style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      );

      if (confirm != true) return;
    }

    try {
      // حذف التعليق من Firestore
      await FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .collection('comments')
          .doc(commentId)
          .delete();

      // إذا كان حذف من مشرف/مالك → أرسل إشعار لصاحب التعليق
      if (isAdminOrOwner == true && reason != null && reason.isNotEmpty) {
        final notificationData = {
          'type': 'comment_deleted',
          'title': 'تم حذف تعليقك',
          'body': 'تم حذف تعليقك على إعلان عقاري للأسباب التالية:\n\n"$reason"',
          'propertyId': propertyId,
          'commentId': commentId,
          'read': false,
          'created_at': FieldValue.serverTimestamp(),
        };

        await FirebaseFirestore.instance
            .collection('users')
            .doc(commentUserId)
            .collection('notifications')
            .add(notificationData);
      }

      // رسالة نجاح موحدة
      showSnackBar(
        "تم الحذف",
        isAdminOrOwner == true
            ? "تم حذف التعليق وإرسال إشعار للمستخدم"
            : "تم حذف تعليقك بنجاح",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } catch (e) {
      showSnackBar("فشل", "فشل حذف التعليق: $e", backgroundColor: Colors.red, colorText: Colors.white);
    }
  }
}