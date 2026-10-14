import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/features/property_details_section/controller/comment_controller.dart';
import 'package:real_estate_app/features/property_details_section/widget/build_section.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/features_admin/admin_users_section/view/admin_users_screen.dart';

class CommentWidget extends StatelessWidget {
  const CommentWidget({super.key, required this.property, this.isHotel = false});

  final Map property;
  final bool isHotel;

  @override
  Widget build(BuildContext context) {
    final userCtr = Get.find<UserController>();
    final commentCtrl = Get.find<CommentController>();

    // حالة لتتبع ما إذا كان المستخطط مفتوحًا أم لا
    final RxBool showAllComments = false.obs;

    return BuildProDetailsSection(
      title: "تعليقات الزوار",
      child: Column(
        children: [
          // زر إضافة تعليق
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () {
                if (userCtr.isLoggedIn.value == false) {
                  showSnackBar("تحذير", "يجب تسجيل الدخول لإضافة تعليق");
                  return;
                }
                commentCtrl.showAddCommentSheet(
                  propertyId: property['id'],
                  propertyTitle: property['title'] ?? property['hotel_name'] ?? 'بدون عنوان',
                  userId: userCtr.userId.value,
                  isHotel: isHotel,
                );
              },
              icon: const Icon(Icons.add_comment, color: Colors.blue),
              label: Text(
                "أضف تعليقك",
                style: GoogleFonts.cairo(color: Colors.blue, fontWeight: FontWeight.bold),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // عرض التعليقات
          StreamBuilder<QuerySnapshot>(
            stream: commentCtrl.getCommentsStream(property['id']),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return Text(
                  "خطأ في تحميل التعليقات",
                  style: GoogleFonts.cairo(color: Colors.red),
                );
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Text(
                  "لا توجد تعليقات بعد. كن أول من يعلق!",
                  style: GoogleFonts.cairo(color: Colors.grey[600], fontSize: 15),
                  textAlign: TextAlign.center,
                );
              }

              final comments = snapshot.data!.docs;
              final int totalComments = comments.length;

              return Obx(() {
                final bool expanded = showAllComments.value;
                final int displayCount = expanded ? totalComments : (totalComments > 5 ? 5 : totalComments);

                return Column(
                  children: [
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: displayCount,
                      itemBuilder: (context, index) {
                        final data = comments[index].data() as Map<String, dynamic>;
                        final String commentId = comments[index].id;
                        final bool hasBooked = data['hasBooked'] ?? false;
                        final String commentUserId = data['userId'] ?? '';
                        final Timestamp? createdAt = data['createdAt'] as Timestamp?;
                        final Timestamp? updatedAt = data['updatedAt'] as Timestamp?;

                        final bool isPropertyOwner = userCtr.userId.value == commentUserId;

                        // تنسيق التاريخ
                        String dateText = "غير محدد";
                        if (createdAt != null) {
                          final date = createdAt.toDate();
                          final now = DateTime.now();
                          final diff = now.difference(date);

                          if (diff.inDays > 30) {
                            dateText = DateFormat('dd/MM/yyyy').format(date);
                          } else if (diff.inDays > 0) {
                            dateText = "${diff.inDays} يوم مضى";
                          } else if (diff.inHours > 0) {
                            dateText = "${diff.inHours} ساعة مضت";
                          } else if (diff.inMinutes > 0) {
                            dateText = "${diff.inMinutes} دقيقة مضت";
                          } else {
                            dateText = "الآن";
                          }

                          if (updatedAt != null && updatedAt != createdAt) {
                            dateText += " (معدل)";
                          }
                        }

                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: hasBooked ? Colors.green.shade50 : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: hasBooked ? Colors.green.shade300 : Colors.grey.shade300,
                              width: 1.2,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 14,
                                    backgroundColor: hasBooked ? Colors.green.shade600 : Colors.grey.shade400,
                                    child: Icon(
                                      hasBooked ? Icons.check : Icons.person,
                                      size: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      data['userName'] ?? 'مجهول',
                                      style: GoogleFonts.cairo(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14.5,
                                        color: hasBooked ? Colors.green.shade900 : Colors.black87,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (hasBooked)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.green.shade100,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        "مستأجر فعلي",
                                        style: GoogleFonts.cairo(fontSize: 10, color: Colors.green.shade800, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  const Spacer(),
                                  if (userCtr.userId.value == commentUserId || userCtr.isOwner.value || userCtr.isAdmin.value)
                                    PopupMenuButton<String>(
                                      icon: Icon(Icons.more_vert, size: 18, color: Colors.grey[600]),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      elevation: 8,
                                      onSelected: (value) async {
                                        if (value == 'delete') {
                                          await commentCtrl.deleteComment(
                                            propertyId: property['id'],
                                            commentId: commentId,
                                            commentUserId: commentUserId,
                                            isAdminOrOwner: userCtr.isOwner.value || userCtr.isAdmin.value,
                                          );
                                        } 
                                        else if (value == 'edit' && userCtr.userId.value == commentUserId) {
                                          commentCtrl.showEditCommentSheet(
                                            propertyId: property['id'],
                                            commentId: commentId,
                                            currentComment: data['comment'],
                                          );
                                        }
                                        else if (value == 'show_user') {
                                          // تحقق من أن userId موجود
                                          final String? userId = data['userId']?.toString().trim();
                                          if (userId == null || userId.isEmpty) {
                                            showSnackBar("خطأ", "معرف المستخدم غير متوفر", backgroundColor: Colors.orange);
                                            return;
                                          }

                                          try {
                                            // جلب بيانات المستخدم من Firestore
                                            final userDoc = await FirebaseFirestore.instance
                                                .collection('users')
                                                .doc(userId)
                                                .get();

                                            if (!userDoc.exists) {
                                              showSnackBar("غير موجود", "هذا المستخدم غير موجود في النظام", backgroundColor: Colors.red);
                                              return;
                                            }

                                            final userData = userDoc.data()!;
                                            final String? userEmail = userData['email']?.toString().trim();

                                            if (userEmail == null || userEmail.isEmpty) {
                                              showSnackBar("لا يوجد إيميل", "هذا المستخدم ليس لديه بريد إلكتروني", backgroundColor: Colors.orange);
                                              return;
                                            }

                                            // الانتقال مع تمرير الإيميل
                                            Get.to(
                                              () => const AdminUsersScreen(),
                                              arguments: {
                                                'search_email': userEmail,
                                              },
                                            );

                                            // اختياري: يمكنك أيضًا تمرير userId إضافيًا إذا أردت
                                            // arguments: {'search_email': userEmail, 'highlight_uid': userId},

                                          } catch (e) {
                                            showSnackBar("فشل", "فشل جلب بيانات المستخدم: $e", backgroundColor: Colors.red);
                                          }
                                        }
                                      },
                                      itemBuilder: (context) {
                                        final List<PopupMenuEntry<String>> items = [];

                                        // إذا كان صاحب التعليق
                                        if (userCtr.userId.value == commentUserId) {
                                          items.addAll([
                                            const PopupMenuItem(
                                              value: 'edit',
                                              child: Row(
                                                children: [
                                                  Icon(Icons.edit, size: 18, color: Colors.blue),
                                                  SizedBox(width: 10),
                                                  Text("تعديل", style: TextStyle(color: Colors.blue)),
                                                ],
                                              ),
                                            ),
                                            const PopupMenuItem(
                                              value: 'delete',
                                              child: Row(
                                                children: [
                                                  Icon(Icons.delete, size: 18, color: Colors.red),
                                                  SizedBox(width: 10),
                                                  Text("حذف", style: TextStyle(color: Colors.red)),
                                                ],
                                              ),
                                            ),
                                          ]);
                                        }

                                        // إذا كان مشرف أو مالك (وليس صاحب التعليق)
                                        else if (userCtr.isOwner.value || userCtr.isAdmin.value) {
                                          items.addAll([
                                            if(userCtr.isOwner.value)
                                            const PopupMenuItem(
                                              value: 'show_user',
                                              child: Row(
                                                children: [
                                                  Icon(Icons.person_search, size: 20, color: Colors.indigo),
                                                  SizedBox(width: 10),
                                                  Text("عرض المستخدم", style: TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold)),
                                                ],
                                              ),
                                            ),
                                            const PopupMenuItem(
                                              value: 'delete',
                                              child: Row(
                                                children: [
                                                  Icon(Icons.delete_forever, size: 20, color: Colors.red),
                                                  SizedBox(width: 10),
                                                  Text("حذف التعليق", style: TextStyle(color: Colors.red)),
                                                ],
                                              ),
                                            ),
                                          ]);
                                        }

                                        return items;
                                      },
                                    ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                data['comment'] ?? '',
                                style: GoogleFonts.cairo(fontSize: 14.5, height: 1.6),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                dateText,
                                style: GoogleFonts.cairo(fontSize: 11.5, color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        );
                      },
                    ),

                    // زر "عرض المزيد" أو "إظهار أقل"
                    if (totalComments > 5)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: TextButton.icon(
                          onPressed: () {
                            showAllComments.value = !showAllComments.value;
                          },
                          icon: Icon(
                            expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                            color: Colors.blue.shade700,
                          ),
                          label: Text(
                            expanded ? "إظهار أقل" : "عرض كل التعليقات ($totalComments)",
                            style: GoogleFonts.cairo(
                              color: Colors.blue.shade700,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              });
            },
          ),
        ],
      ),
    );
  }
}