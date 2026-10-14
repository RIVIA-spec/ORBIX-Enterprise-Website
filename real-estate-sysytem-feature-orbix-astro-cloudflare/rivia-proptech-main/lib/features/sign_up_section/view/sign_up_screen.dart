import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/login_sction/view/login_screen.dart';
import 'package:real_estate_app/features/sign_up_section/controller/sign_up_controller.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/features/sign_up_section/view/privacy_policy_screen.dart';

class SignUpScreen extends StatelessWidget {
  final RegisterController signUpCtr = Get.put(RegisterController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // الخلفية
          Container(
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage("assets/images/login.png"),
                fit: BoxFit.cover,
                colorFilter: ColorFilter.mode(
                  Colors.black.withOpacity(0.6),
                  BlendMode.darken,
                ),
              ),
            ),
          ),

          Center(
            child: SingleChildScrollView(
              child: Container(
                padding: EdgeInsets.all(20),
                margin: EdgeInsets.symmetric(horizontal: 20, vertical: 45),
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
                child: Form(
                  key: signUpCtr.formKey,
                  child: Column(
                    children: [
                      // عنوان رئيسي
                      Text(
                        "إنشاء الحساب",
                        style: GoogleFonts.cairo(
                          fontSize: 20,
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 25),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CustomTextFormField(
                            controller: signUpCtr.userNameController,
                            label: "اسم المستخدم",
                            hint: "ادخل اسم المستخدم",
                            suffixIcon: Icon (Icons.person),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return "هذا الحقل مطلوب";
                              }
                              return null;
                            },
                          ),
                          SizedBox(height: 16),
                          CustomTextFormField(
                            controller: signUpCtr.emailController,
                            label: "البريد الالكتروني",
                            hint: "ادخل بريد الكتروني",
                            suffixIcon: Icon(Icons.email),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return "هذا الحقل مطلوب";
                              }
                              return null;
                            },
                          ),
                          SizedBox(height: 16),
                          Obx(
                            () => CustomTextFormField(
                              controller: signUpCtr.passwordController,
                              label: "كلمة المرور",
                              hint: "كلمة المرور",
                              // suffixIcon: Icon(Icons.lock),
                              obscureText: signUpCtr.isPasswordHidden.value,
                              onToggleVisibility: signUpCtr.togglePassword,
                              // showVisibilityToggle: true,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "هذا الحقل مطلوب";
                                }
                                return null;
                              },
                            ),
                          ),
                          SizedBox(height: 16),
                  
                          Obx(
                            () => CustomTextFormField(
                              controller: signUpCtr.confirmPasswordController,
                              label: "تأكيد كلمة المرور",
                              hint: "تأكيد كلمة المرور",
                              // suffixIcon: Icon(Icons.lock),
                              obscureText:
                                  signUpCtr.isConfirmPasswordHidden.value,
                              onToggleVisibility:
                                  signUpCtr.toggleConfirmPassword,
                              // showVisibilityToggle: true,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return "هذا الحقل مطلوب";
                                }
                                if (signUpCtr.confirmPasswordController.text != signUpCtr.passwordController.text) {
                                  return "تأكيد كلمة المرور غير متطابق";
                                }
                                return null;
                              },
                            ),
                          ),
                          SizedBox(height: 16),
                          // الموافقة على الشروط
                          Obx(
                            () => Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Checkbox(
                                  value: signUpCtr.isTermsAccepted.value,
                                  onChanged: signUpCtr.isLoading.value
                                      ? null
                                      : (value) {
                                          signUpCtr.isTermsAccepted.value = value ?? false;
                                        },
                                  activeColor: const Color.fromARGB(255, 4, 109, 196),
                                ),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: signUpCtr.isLoading.value
                                        ? null
                                        : () {
                                            Get.to(() => const PrivacyPolicyScreen());
                                          },
                                    child: RichText(
                                      text: TextSpan(
                                        style: GoogleFonts.cairo(
                                          fontSize: 13,
                                          color: Colors.grey.shade700,
                                        ),
                                        children: [
                                          const TextSpan(text: "أوافق على "),
                                          TextSpan(
                                            text: "شروط الاستخدام وسياسة الخصوصية",
                                            style: GoogleFonts.cairo(
                                              fontSize: 13,
                                              color: const Color.fromARGB(255, 4, 109, 196),
                                              fontWeight: FontWeight.bold,
                                              decoration: TextDecoration.underline,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // رسالة خطأ إذا لم يتم الموافقة
                          Obx(
                            () => signUpCtr.isTermsAccepted.value
                                ? const SizedBox.shrink()
                                : Padding(
                                    padding: const EdgeInsets.only(right: 40, top: 4),
                                    child: Text(
                                      "يجب الموافقة على الشروط والأحكام",
                                      style: GoogleFonts.cairo(
                                        fontSize: 12,
                                        color: Colors.red,
                                      ),
                                    ),
                                  ),
                          ),
                          SizedBox(height: 24),
                          Center(
                            child: Obx(
                                () => ElevatedButton(
                                onPressed: signUpCtr.isLoading.value ? null : () {
                                  if(!signUpCtr.isTermsAccepted.value){
                                    showSnackBar(
                                      "تنبيه",
                                      "يجب الموافقة على شروط الاستخدام وسياسة الخصوصية",
                                      backgroundColor: Colors.orange,
                                      colorText: Colors.white,
                                      snackPosition: SnackPosition.BOTTOM,
                                    );
                                    return;
                                  }
                                  if(signUpCtr.formKey.currentState!.validate()){
                                      signUpCtr.signUp();
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color.fromARGB(
                                    255,
                                    4,
                                    109,
                                    196,
                                  ),
                                  minimumSize: Size(double.infinity, 50),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Obx(
                                   () => signUpCtr.isLoading.value ? LoadingProgressiveDots() :
                                  Text(
                                    "إنشاء حساب",
                                    style: GoogleFonts.cairo(color: Colors.white),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: 10),
                          // زر تسجيل الدخول
                          Center(
                            child: Obx(
                              () => TextButton(
                                onPressed: signUpCtr.isLoading.value ? null : () {
                                  Get.off(() => LoginScreen());
                                },
                                child: Text(
                                  "لديك حساب بالفعل؟ تسجيل الدخول",
                                  style: GoogleFonts.cairo(color: Colors.black),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
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
