// إرسال البيانات إلى واتساب
  import 'package:get/get.dart';
import 'package:real_estate_app/core/controller/settings_controller.dart';
import 'package:real_estate_app/features/payment_section/controller/payment_controller.dart';
import 'package:real_estate_app/features/property_details_section/controller/property_details_controller.dart';

void sendToWhatsPropertyDetails(
  Map property,
) {
    final detailsController = Get.find<PropertyDetailsController>();

    final String message = """
*طلب حجز جديد*

*العقار:* ${property['title'] ?? 'غير محدد'}
*النوع:* ${property['property_type'] ?? 'غير محدد'}

*السعر:* ${property['selling_price']} ${property['selling_price_currency'] ?? "غير محدد"}

*ملاحظات:* يرجى تأكيد الحجز والتواصل مع العميل.
    """.trim();

  final settingsCtr = Get.find<SettingsController>();
  final phone = settingsCtr.whatsappPhone.value; // غيّر الرقم لاحقًا
  final countryCode = settingsCtr.whatsappCountryCode.value;
  detailsController.openWhatsApp(phone,countryCode: countryCode,  message: message);
}