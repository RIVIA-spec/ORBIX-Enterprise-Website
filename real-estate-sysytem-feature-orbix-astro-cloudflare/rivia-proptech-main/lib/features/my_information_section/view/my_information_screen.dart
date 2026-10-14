import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/widgets/booking_card.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/core/widgets/stautes_button.dart';
import 'package:real_estate_app/features/my_information_section/controller/my_information_controller.dart';

class MyInformationScreen extends StatelessWidget {
  const MyInformationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final myInfoCtr = Get.put(MyInformationController());
    final userCtr = Get.put(UserController());
    
    return Scaffold(
      appBar: CustomAppBar(title: "تفاصيل الملف الشخصي"),
      body: ListView(
        padding: const EdgeInsets.all(8),
        children: [
          SectionContainer(
            title: "الملف الشخصي",
            child: Obx(
              () =>
              !userCtr.isLoggedIn.value ? 
              Center(child: Text("قم بتسجيل الدخول أولاً")) :
               Container(
                margin: EdgeInsets.symmetric(horizontal: 10),
                 child: Form(
                  key: myInfoCtr.formKey,
                   child: 
                   Obx(() {

                      // ============================================================
                      // 1) واجهة تغيير كلمة المرور فقط
                      // ============================================================
                      if (myInfoCtr.isChangingPassword.value) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CustomTextFormField(
                              controller: myInfoCtr.oldPasswordController,
                              hint: "كلمة المرور الحالية",
                              // prefixIcon: Icon(Icons.lock),
                              obscureText: myInfoCtr.isPasswordHidden.value,
                              onToggleVisibility: myInfoCtr.togglePassword,
                              validator: (value) {
                                if (value == null || value.isEmpty) return "هذا الحقل مطلوب";
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            CustomTextFormField(
                              controller: myInfoCtr.newPasswordController,
                              hint: "كلمة المرور الجديدة",
                              // suffixIcon: Icon(Icons.lock),
                              obscureText: myInfoCtr.isConfirmPasswordHidden.value,
                              onToggleVisibility: myInfoCtr.toggleConfirmPassword,
                              validator: (value) {
                                if (value == null || value.isEmpty) return "هذا الحقل مطلوب";
                                return null;
                              },
                            ),
                            const SizedBox(height: 25),

                            CustomButton(
                              width: Get.width * 0.8,
                              text: "حفظ التغيير",
                              isLoading: myInfoCtr.isLoading,
                              onPressed: () {
                                if (myInfoCtr.formKey.currentState!.validate()) {
                                  myInfoCtr.updatePasswordOnly();
                                }
                              },
                            ),
                            const SizedBox(height: 10),
                            CustomButton(
                              width: Get.width * 0.8,
                              text: "إلغاء",
                              backgroundColor: Colors.grey.shade300,
                              foregroundColor: Colors.black,
                              onPressed: () {
                                myInfoCtr.cancelChangeMode();
                              },
                            ),
                          ],
                        );
                      }

                      // ============================================================
                      // 2) واجهة تغيير البريد الإلكتروني فقط
                      // ============================================================
                      if (myInfoCtr.isChangingEmail.value) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CustomTextFormField(
                              controller: myInfoCtr.newEmailController,
                              hint: "البريد الجديد",
                              suffixIcon: Icon(Icons.email),
                              validator: (value) {
                                if (value == null || value.isEmpty) return "هذا الحقل مطلوب";
                                else if (value.trim() == userCtr.email.trim()) return "لم يتغير الإيميل";
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            CustomTextFormField(
                              controller: myInfoCtr.oldPasswordController,
                              hint: "كلمة المرور الحالية",
                              prefixIcon: Icon(Icons.lock),
                              obscureText: myInfoCtr.isPasswordHidden.value,
                              onToggleVisibility: myInfoCtr.togglePassword,
                              validator: (value) {
                                if (value == null || value.isEmpty) return "هذا الحقل مطلوب";
                                return null;
                              },
                            ),
                            const SizedBox(height: 25),

                            CustomButton(
                              width: Get.width * 0.8,
                              text: "تحديث البريد الإلكتروني",
                              isLoading: myInfoCtr.isLoading,
                              onPressed: () {
                                if (myInfoCtr.formKey.currentState!.validate()) {
                                  myInfoCtr.updateEmailOnly();
                                }
                              },
                            ),
                            const SizedBox(height: 10),
                            CustomButton(
                              width: Get.width * 0.8,
                              text: "إلغاء",
                              backgroundColor: Colors.grey.shade300,
                              foregroundColor: Colors.black,
                              onPressed: () {
                                myInfoCtr.cancelChangeMode();
                              },
                            ),
                          ],
                        );
                      }

                      // ============================================================
                      // 3) الوضع الأساسي (عرض المعلومات + الأزرار)
                      // ============================================================
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CustomTextFormField(
                            controller: myInfoCtr.userNameController,
                            hint: "ادخل اسم المستخدم",
                            suffixIcon: Icon(Icons.person),
                            validator: (value) {
                              if (value == null || value.isEmpty) return "هذا الحقل مطلوب";
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          CustomTextFormField(
                            controller: myInfoCtr.emailController,
                            hint: "البريد الإلكتروني",
                            suffixIcon: Icon(Icons.email),
                            readOnly: true,
                            validator: (value) {
                              if (value == null || value.isEmpty) return "هذا الحقل مطلوب";
                              return null;
                            },
                          ),
                          const SizedBox(height: 25),

                          CustomButton(
                            width: Get.width * 0.8,
                            text: "تغيير كلمة المرور",
                            onPressed: myInfoCtr.startChangePassword,
                          ),
                          const SizedBox(height: 10),

                          CustomButton(
                            width: Get.width * 0.8,
                            text: "تغيير البريد الإلكتروني",
                            onPressed: myInfoCtr.startChangeEmail,
                          ),
                          const SizedBox(height: 25),

                          CustomButton(
                            width: Get.width * 0.8,
                            text: "حفظ معلومات الحساب",
                            isLoading: myInfoCtr.isLoading,
                            onPressed: () {
                              if (myInfoCtr.formKey.currentState!.validate()) {
                                myInfoCtr.updateBasicInfo(); // فقط الاسم والبريد
                              }
                            },
                          ),
                        ],
                      );
                    })

                 ),
               ),
            )
          ),

          // SectionContainer(
          //   title: "عقاراتي",
          //   child: Column(
          //     children: const [
          //       PropertyCard(
          //         title: "شقة فاخرة بإطلالة بحرية",
          //         status: "نشط",
          //         imagePath: "assets/images/Selection (2).png",
          //       ),
          //       PropertyCard(
          //         title: "منزل عائلي مريح في الضواحي",
          //         status: "مسودة",
          //         imagePath: "assets/images/Selection (4).png",
          //       ),
          //       PropertyCard(
          //         title: "استوديو حديث في وسط المدينة",
          //         status: "نشط",
          //         imagePath: "assets/images/Selection (3).png",
          //       ),
          //     ],
          //   ),
          // ),

          // SectionContainer(
          //   title: "حجوزاتي",
          //   child: Column(
          //     children: const [
          //       dashbordBookingCard(
          //         title: "شقة فاخرة بإطلالة بحرية",
          //         status: "مؤكدة",
          //         date: "25-30 يوليو 2024",
          //         imagePath: "assets/images/Selection (5).png",
          //       ),
          //       dashbordBookingCard(
          //         title: "منزل عائلي مريح في الضواحي",
          //         status: "قيد الانتظار",
          //         date: "10-15 أغسطس 2024",
          //         imagePath: "assets/images/Selection (6).png",
          //       ),
          //     ],
          //   ),
          // ),

          // SectionContainer(
          //   title: "التقييمات والمراجعات",
          //   subtitle: "⭐ 4.8 من 120 مراجعة",
          //   child: Column(
          //     crossAxisAlignment: CrossAxisAlignment.start,
          //     children: [
          //       Text("فاطمة الزهراء", style: GoogleFonts.cairo()),
          //       const SizedBox(height: 4),
          //       Text("إقامة رائعة! المضيف كان ودوداً والمكان نظيف.",
          //           style: GoogleFonts.cairo()),
          //       Align(
          //         alignment: Alignment.centerLeft,
          //         child: TextButton(
          //           onPressed: () {},
          //           child: Text("عرض الكل", style: GoogleFonts.cairo()),
          //         ),
          //       )
          //     ],
          //   ),
          // ),
        ],
      ),
    );
  }
}


class PropertyCard extends StatelessWidget {
  final String title;
  final String status;
  final String imagePath;

  const PropertyCard({
    super.key,
    required this.title,
    required this.status,
    required this.imagePath,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(imagePath,
                  width: 80, height: 80, fit: BoxFit.cover),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: GoogleFonts.cairo(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: StatusButton(text: status, type: status),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}