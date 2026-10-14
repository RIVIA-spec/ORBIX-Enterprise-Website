import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_controller/add_hotel_controller.dart';
import 'package:real_estate_app/features/google_maps_section/view/google_maps_screen.dart';

class HotelSiteDetails extends StatelessWidget {
  const HotelSiteDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final AddHotelController hotelCtr = Get.find<AddHotelController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "موقع الفندق",
      subtitle: "حدد موقع الفندق بدقة (سيتم استخدامه لجميع الغرف)",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // العنوان التفصيلي
          // CustomTextFormField(
          //   label: "العنوان الكامل",
          //   hint: "مثال: شارع بغداد، مقابل مشفى الأندلس",
          //   prefixIcon:
          //       const Icon(Icons.location_on_outlined, color: Colors.redAccent),
          //   controller: hotelCtr.addressController,
          //   maxLines: 2,
          //   validator: (value) {
          //     if (value == null || value.isEmpty) {
          //       return "العنوان مطلوب";
          //     }
          //     return null;
          //   },
          // ),

          // الدولة
          CustomTextFormField(
            label: "الدولة",
            hint: "سوريا",
            prefixIcon: const Icon(Icons.public, color: Colors.blueAccent),
            controller: hotelCtr.countryController,
            validator: (value) {
              if (value == null || value.isEmpty) return "الدولة مطلوبة";
              return null;
            },
          ),

          // المدينة
          CustomTextFormField(
            label: "المدينة / المحافظة",
            hint: "دمشق، حلب، اللاذقية...",
            prefixIcon:
                const Icon(Icons.location_city, color: Colors.purpleAccent),
            controller: hotelCtr.cityController,
            validator: (value) {
              if (value == null || value.isEmpty) return "المدينة مطلوبة";
              return null;
            },
          ),

          // تحديد الموقع على الخريطة
          CustomTextFormField(
            label: "الموقع على الخريطة",
            hint: "اضغط لتحديد الموقع على الخريطة",
            prefixIcon: const Icon(Icons.map, color: Colors.amberAccent),
            controller: hotelCtr.addressController,
            readOnly: true,
            onTap: () async {
              final result = await Get.to(() => LocationPickerPage());
              if (result != null) {
                hotelCtr.latitudeController.text = result['latitude'];
                hotelCtr.longitudeController.text = result['longitude'];
                hotelCtr.addressController.text = result['address'];
              }
            },
          ),
        ],
      ),
    );
  }
}
