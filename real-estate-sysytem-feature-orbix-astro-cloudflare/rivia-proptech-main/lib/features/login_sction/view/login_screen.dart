import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/login_sction/controller/login_controller.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/controller/settings_controller.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:mailto/mailto.dart';
import 'package:real_estate_app/features/sign_up_section/view/sign_up_screen.dart';

class LoginScreen extends StatelessWidget {
  final LoginController loginCtr = Get.put(LoginController());

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: Form(
          key: loginCtr.formKey,
          child: Stack(
            children: [
              Container(
                width: Get.width, height: Get.height,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage(
                      "assets/images/login_backGround_image.png",
                      // "assets/images/login.png",
                    ), // غير المسار حسب الصورة عندك
                    fit: BoxFit.cover,
                    colorFilter: ColorFilter.mode(
                      Colors.black.withOpacity(0.6), // شفافية
                      BlendMode.darken,
                    ),
                  ),
                ),
              ),
              Container(
                margin: EdgeInsets.only(right: 20, left: 20, top: 50),
                child: Center(
                  child: SingleChildScrollView(
                    // الحل السحري
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: EdgeInsets.all(20),
                          width: Get.width,
                          // حذفنا الـ height الثابت تمامًا
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black26,
                                blurRadius: 8,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Text(
                                "تسجيل الدخول",
                                style: GoogleFonts.cairo(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(height: 25),
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  CustomTextFormField(
                                    controller: loginCtr.emailController,
                                    label: "البريد الإلكتروني",
                                    hint: "ادخل بريدك الإلكتروني",
                                    suffixIcon: Icon(Icons.email),
                                    keyboardType: TextInputType.emailAddress,
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return "هذا الحقل مطلوب";
                                      }
                                      if (!GetUtils.isEmail(value)) {
                                        return "البريد الإلكتروني غير صالح";
                                      }
                                      return null;
                                    },
                                  ),
                                  SizedBox(height: 16),
                                  Obx(() => CustomTextFormField(
                                        controller: loginCtr.passwordController,
                                        label: "كلمة المرور",
                                        hint: "أدخل كلمة المرور",
                                        // prefixIcon: Icon(Icons.lock),
                                        obscureText:
                                            loginCtr.isPasswordHidden.value,
                                        onToggleVisibility:
                                            loginCtr.togglePassword,
                                        validator: (value) {
                                          if (value == null || value.isEmpty) {
                                            return "هذا الحقل مطلوب";
                                          }
                                          if (value.length < 6) {
                                            return "كلمة المرور قصيرة جدًا";
                                          }
                                          return null;
                                        },
                                      )),
                                ],
                              ),
                                const SizedBox(height: 12),

                              // زر "نسيت كلمة المرور؟"
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: loginCtr.isLoading.value
                                      ? null
                                      : () => loginCtr.showForgotPasswordDialog(),
                                  child: Text(
                                    "نسيت كلمة المرور؟",
                                    style: GoogleFonts.cairo(
                                      color: const Color.fromARGB(255, 4, 109, 196),
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                              SizedBox(height: 24),
                            ],
                          ),
                        ),

                        SizedBox(height: 20),

                        // زر تسجيل الدخول
                        Obx(() => ElevatedButton(
                              onPressed: loginCtr.isLoading.value
                                  ? null
                                  : () {
                                      if (loginCtr.formKey.currentState!
                                          .validate()) {
                                        loginCtr.login();
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color.fromARGB(255, 4, 109, 196),
                                minimumSize: Size(double.infinity, 50),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: loginCtr.isLoading.value
                                  ? LoadingProgressiveDots()
                                  : Text(
                                      "تسجيل الدخول",
                                      style: GoogleFonts.cairo(
                                          fontSize: 16, color: Colors.white),
                                    ),
                            )),

                        SizedBox(height: 12),

                        // نص "ليس لديك حساب؟"
                        Obx(() => TextButton(
                              onPressed: loginCtr.isLoading.value
                                  ? null
                                  : () => Get.off(() => SignUpScreen()),
                              child: Text(
                                "ليس لديك حساب؟ سجل الآن",
                                style: GoogleFonts.cairo(
                                    color: Colors.white, fontSize: 15),
                              ),
                            )),

                        SizedBox(height: 20),

                        // زر إيميل الدعم
                        Obx(() {
                          final settingsCtr = Get.find<SettingsController>();
                          final supportEmail = settingsCtr.supportEmail.value;

                          if (supportEmail.isEmpty) {
                            return const SizedBox.shrink();
                          }

                          return TextButton.icon(
                            onPressed: loginCtr.isLoading.value
                                ? null
                                : () => _openSupportEmail(supportEmail),
                            icon: Icon(Icons.email, color: Colors.white70, size: 18),
                            label: Text(
                              "تواصل مع الدعم",
                              style: GoogleFonts.cairo(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openSupportEmail(String email) async {
    try {
      // استخدام مكتبة mailto لبناء URL بشكل صحيح
      final mailtoLink = Mailto(
        to: [email],
        subject: 'طلب دعم - تطبيق العقارات',
        body: 'مرحباً،\n\nأحتاج إلى مساعدة بخصوص:\n\n',
      );

      final String url = mailtoLink.toString();
      final Uri emailUri = Uri.parse(url);

      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri, mode: LaunchMode.platformDefault);
      } else {
        // محاولة بديلة بدون canLaunchUrl
        try {
          await launchUrl(emailUri, mode: LaunchMode.externalApplication);
        } catch (e) {
          showSnackBar("خطأ", "لا يمكن فتح تطبيق البريد الإلكتروني. تأكد من تثبيت تطبيق بريد.", backgroundColor: Colors.red, colorText: Colors.white);
        }
      }
    } catch (e) {
      showSnackBar("خطأ", "حدث خطأ: $e", backgroundColor: Colors.red, colorText: Colors.white);
    }
  }
}
