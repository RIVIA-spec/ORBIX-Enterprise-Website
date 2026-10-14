import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/add_property_section/controller/add_proprety_controller.dart';
import 'package:real_estate_app/features/google_maps_section/view/google_maps_screen.dart';

class SiteDetails extends StatelessWidget {
  const SiteDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final AddPropretyController addPropertyCtr =
        Get.find<AddPropretyController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "تفاصيل الموقع",
      subtitle: "حدد موقع العقار بدقة ليظهر للمستخدمين على الخريطة",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // العنوان التفصيلي
          // CustomTextFormField(
          //   label: "العنوان الكامل",
          //   hint: "مثال: شارع بغداد، مقابل مشفى الأندلس",
          //   prefixIcon: const Icon(Icons.location_on_outlined,
          //       color: Colors.blueAccent),
          //   controller: addPropertyCtr.addressController,
          //   maxLines: 2,
          //   validator: (value) {
          //     if (value == null || value.isEmpty) {
          //       return "العنوان مطلوب";
          //     }
          //     return null;
          //   },
          // ),

          // const SizedBox(height: 16),

          // الدولة / المنطقة
          CustomTextFormField(
            label: "الدولة",
            hint: "سوريا",
            prefixIcon: const Icon(Icons.public, color: Colors.blueAccent),
            controller: addPropertyCtr.countryController,
            validator: (value) {
              if (value == null || value.isEmpty) return "الدولة مطلوبة";
              return null;
            },
          ),

          // const SizedBox(height: 16),

          // المدينة
          CustomTextFormField(
            label: "المدينة / المحافظة",
            hint: "دمشق، حلب، اللاذقية...",
            prefixIcon:
                const Icon(Icons.location_city, color: Colors.blueAccent),
            controller: addPropertyCtr.cityController,
            validator: (value) {
              if (value == null || value.isEmpty) return "المدينة مطلوبة";
              return null;
            },
          ),
          CustomTextFormField(
            label: "الموقع",
            hint: "اضغط لتحديد الموقع على الخريطة",
            prefixIcon:
                const Icon(Icons.location_on, color: Colors.amberAccent),
            controller: addPropertyCtr.addressController,
            readOnly: true,
            onTap: () async {
              final result = await Get.to(() => LocationPickerPage());
              if (result != null) {
                addPropertyCtr.latitudeController.text = result['latitude'];
                addPropertyCtr.longitudeController.text = result['longitude'];
                addPropertyCtr.addressController.text = result['address'];
              }
            },
          ),

          // const SizedBox(height: 16),

          // // الحي / المنطقة (حقل مهم جدًا في العقارات!)
          // CustomTextFormField(
          //   label: "الحي أو المنطقة",
          //   hint: "الميدان، المزة، جرمانا، الشعلان...",
          //   prefixIcon: const Icon(Icons.map_outlined, color: Colors.orangeAccent),
          //   controller: addPropertyCtr.neighborhoodController, // تأكد أنك أضفت هذا في الـ Controller
          //   validator: (value) {
          //     if (value == null || value.isEmpty) return "الحي مطلوب";
          //     return null;
          //   },
          // ),

          // const SizedBox(height: 20),

          // // رابط الموقع على الخريطة (اختياري لكن مفيد جدًا)
          // CustomTextFormField(
          //   label: "موقع العقار على الخريطة (اختياري)",
          //   hint: "اضغط لتحديد الموقع على الخريطة",
          //   prefixIcon: const Icon(Icons.link, color: Colors.green),
          //   controller: addPropertyCtr.mapLinkController, // أضف هذا في الـ Controller إذا لم يكن موجودًا
          //   readOnly: true,
          //   onTap: () async {
          //     // هنا ستفتح الخريطة لاحقًا
          //     // مثال: await addPropertyCtr.pickLocationOnMap();
          //     showSnackBar(
          //       "قريبًا",
          //       "سيتم تفعيل تحديد الموقع على الخريطة",
          //       backgroundColor: primaryBlue.withOpacity(0.9),
          //       colorText: Colors.white,
          //     );
          //   },
          //   suffixIcon: const Icon(Icons.arrow_forward_ios, size: 18, color: Colors.grey),
          //   validator: (value) => null, // اختياري
          // ),

          // const SizedBox(height: 10),

          // // زر "تحديد الموقع على الخريطة" (اختياري لكن يعطي احترافية عالية)
          // SizedBox(
          //   width: double.infinity,
          //   child: ElevatedButton.icon(
          //     onPressed: () {
          //       //               addPropertyCtr.openMapPicker();
          //       showSnackBar("قريبًا", "تحديد الموقع على الخريطة");
          //     },
          //     icon: const Icon(Icons.map, size: 20),
          //     label: const Text("تحديد الموقع على الخريطة", style: TextStyle(fontSize: 16)),
          //     style: ElevatedButton.styleFrom(
          //       backgroundColor: primaryBlue,
          //       foregroundColor: Colors.white,
          //       padding: const EdgeInsets.symmetric(vertical: 16),
          //       shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          //       elevation: 3,
          //     ),
          //   ),
          // ),
        ],
      ),
    );
  }
}
