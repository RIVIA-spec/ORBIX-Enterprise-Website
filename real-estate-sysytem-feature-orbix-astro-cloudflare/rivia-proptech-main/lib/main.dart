import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/settings_controller.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/services/fcm_service.dart';
import 'package:real_estate_app/features/my_information_section/view/my_information_screen.dart';
import 'package:real_estate_app/features/add_property_section/view/add_property_screen.dart';
import 'package:real_estate_app/features/login_sction/view/login_screen.dart';
import 'package:real_estate_app/features/home_section/view/home_screen.dart';
import 'package:real_estate_app/features/property_details_section/view/property_details_screen.dart';
import 'package:real_estate_app/features/sign_up_section/view/sign_up_screen.dart';
import 'package:real_estate_app/features/virtual_tour_section/view/virtual_tour_screen.dart';
import 'package:real_estate_app/features/contracts_section/view/contracts_page.dart';
import 'package:real_estate_app/features/contracts_section/view/transactions_page.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:toastification/toastification.dart';
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await FirebaseAppCheck.instance.activate(
    androidProvider: AndroidProvider.playIntegrity,
    appleProvider: AppleProvider.appAttestWithDeviceCheckFallback,
  );

  // تهيئة GetStorage
  await GetStorage.init();

  // تهيئة FCM
  await FCMService().initialize();

  // تحميل بيانات المستخدم تلقائيًا
  Get.put(UserController());
  Get.put(SettingsController());
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: ToastificationWrapper(
            child: child!
          ),
        );
      },
      theme: ThemeData(
        primaryColor: Colors.blue.shade700, // اللون الأساسي للتطبيق
        scaffoldBackgroundColor: Colors.white, // الخلفية العامة لجميع الـ Scaffold
        dialogTheme: DialogThemeData(
          backgroundColor: Colors.white
        ), // الخلفية العامة
        cardColor: Colors.white, // خلفية البطاقات (Card)
        brightness: Brightness.light,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent, // يمكن تركه شفاف إذا تستخدم CustomAppBar
          elevation: 0,
        ),
        cardTheme: CardThemeData(
          color: Colors.grey.shade50, 
        ),
        textTheme: GoogleFonts.cairoTextTheme(), // الخط العربي
        inputDecorationTheme: InputDecorationTheme(
          fillColor: Colors.grey.shade50, // خلفية الحقول النصية
          filled: true,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
        ),
        buttonTheme: ButtonThemeData(
          buttonColor: Colors.blue.shade700,
          textTheme: ButtonTextTheme.primary,
        ),
      ),
      getPages: [
        GetPage(name: "/", page: () => HomeScreen()),
        GetPage(name: "/login", page: () => LoginScreen()),
        GetPage(name: "/register", page: () => SignUpScreen()),
        GetPage(name: "/property-details", page: () => PropertyDetailsScreen(property:Get.arguments)),
        GetPage(name: "/editeproperty", page: ()=> AddPropertyScreen()),
        GetPage(name: "/dashboard", page: ()=>  MyInformationScreen()),
        GetPage(name: "/transactions", page: () => TransactionsPage()),
        GetPage(name: "/contracts", page: () => ContractsPage()),
        GetPage(name: "/uploadpage", page: () => UploadPage())
      ],
    );
  }
}
