// إرسال البيانات إلى واتساب للفنادق
import 'package:get/get.dart';
import 'package:real_estate_app/core/controller/settings_controller.dart';
import 'package:real_estate_app/features/hotel_section/hotel_controller/hotel_booking_controller.dart';
import 'package:real_estate_app/features/hotel_section/hotel_controller/hotel_details_controller.dart';

void sendToWhatsAppHotelBooking(
  Map<String, dynamic> hotel,
  Map<String, dynamic> roomType,
) {
  final detailsController = Get.find<HotelDetailsController>();
  final bookingCtr = Get.find<HotelBookingController>();

  final String message = """
*طلب حجز فندق جديد*

*الفندق:* ${hotel['hotel_name'] ?? 'غير محدد'}
*نوع الغرفة:* ${roomType['title'] ?? 'غير محدد'}
*نوع الحجز:* ${bookingCtr.bookingType.value}

*تاريخ الوصول:* ${bookingCtr.checkIn.value}
*تاريخ المغادرة:* ${bookingCtr.checkOut.value}
*عدد الضيوف:* ${bookingCtr.guests.value}
*عدد ${bookingCtr.bookingType.value == 'ليلي' ? 'الليالي' : 'الأيام'}:* ${bookingCtr.nights.value}

${bookingCtr.total.value > 0 ? '*المبلغ الإجمالي:* ${bookingCtr.total.value.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (match) => '${match.group(1)},')} ${bookingCtr.bookingType.value == 'ليلي' ? (roomType['nightly_currency'] ?? '') : (roomType['daily_price_currency'] ?? '')}\n' : ''}*ملاحظات:* يرجى تأكيد الحجز والتواصل مع العميل.
    """.trim();

  final settingsCtr = Get.find<SettingsController>();
  final phone = settingsCtr.whatsappPhone.value;
  final countryCode = settingsCtr.whatsappCountryCode.value;
  detailsController.openWhatsApp(phone, countryCode: countryCode, message: message);
}

