// lib/features/hotel_section/hotel_controller/hotel_booking_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/hotel_section/hotel_controller/hotel_booking_controller.dart';
import 'package:real_estate_app/features/hotel_section/view/send_to_whatsapp_hotel_booking.dart';
import 'package:real_estate_app/features/payment_section/widget/select_date_payment.dart';

class HotelBookingScreen extends StatelessWidget {
  HotelBookingScreen({super.key, required this.hotel, required this.roomType});

  final Map<String, dynamic> hotel;
  final Map<String, dynamic> roomType;
  final HotelBookingController bookingCtr = Get.put(HotelBookingController());

  @override
  Widget build(BuildContext context) {
    // تهيئة الأسعار
    final dailyPrice = int.tryParse(roomType['daily_price']?.toString() ?? '0') ?? 0;
    final nightlyPrice = int.tryParse(roomType['nightly_price']?.toString() ?? '0') ?? 0;
    bookingCtr.setRates(dailyPrice, nightlyPrice);

    return Scaffold(
      appBar: CustomAppBar(title: "إرسال طلب الحجز"),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // === تفاصيل الحجز ===
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade300),
                color: Colors.grey.shade50,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("تفاصيل الحجز",
                      style: GoogleFonts.cairo(
                          fontSize: 18, fontWeight: FontWeight.bold)),
                  const Divider(height: 24, thickness: 1),

                  const SizedBox(height: 12),
                  
                  // نوع الحجز (ليلي/نهاري)
                  Text(
                    "نوع الحجز",
                    style: GoogleFonts.cairo(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Obx(
                    () => Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => bookingCtr.bookingType.value = 'ليلي',
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: bookingCtr.bookingType.value == 'ليلي'
                                    ? Colors.blue.shade100
                                    : Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: bookingCtr.bookingType.value == 'ليلي'
                                      ? Colors.blue
                                      : Colors.grey.shade400,
                                  width: 2,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  "ليلي",
                                  style: GoogleFonts.cairo(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: bookingCtr.bookingType.value == 'ليلي'
                                        ? Colors.blue.shade900
                                        : Colors.grey.shade700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => bookingCtr.bookingType.value = 'نهاري',
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: bookingCtr.bookingType.value == 'نهاري'
                                    ? Colors.blue.shade100
                                    : Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: bookingCtr.bookingType.value == 'نهاري'
                                      ? Colors.blue
                                      : Colors.grey.shade400,
                                  width: 2,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  "نهاري",
                                  style: GoogleFonts.cairo(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: bookingCtr.bookingType.value == 'نهاري'
                                        ? Colors.blue.shade900
                                        : Colors.grey.shade700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // عدد الضيوف
                  CustomTextFormField(
                    label: "عدد الضيوف",
                    hint: "مثال: 2",
                    keyboardType: TextInputType.number,
                    onChanged: (val) {
                      final num = int.tryParse(val.trim());
                      if (num != null && num > 0) {
                        bookingCtr.guests.value = val.trim();
                      } else {
                        if (int.tryParse(arabicToEnglish(val.trim())) != null) {
                          val = arabicToEnglish(val.trim());
                          bookingCtr.guests.value = val.trim();
                        } else {
                          bookingCtr.guests.value = '';
                        }
                      }
                    },
                  ),

                  // تاريخ الوصول
                  const SizedBox(height: 16),
                  Obx(() => CustomTextFormField(
                        label: "تاريخ الوصول",
                        hint: "اختر تاريخ الوصول",
                        readOnly: true,
                        controller: TextEditingController(text: bookingCtr.checkIn.value),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.all(12),
                          child: Icon(Icons.calendar_today, size: 20),
                        ),
                        onTap: () => selectDate(
                          context: context,
                          dateObs: bookingCtr.checkIn,
                          property: roomType, // استخدام roomType كـ property للتواريخ
                          label: "الوصول",
                        ),
                      )),

                  const SizedBox(height: 16),

                  // تاريخ الانتهاء
                  Obx(() => CustomTextFormField(
                        label: "تاريخ المغادرة",
                        hint: "اختر تاريخ المغادرة",
                        readOnly: true,
                        controller: TextEditingController(text: bookingCtr.checkOut.value),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.all(12),
                          child: Icon(Icons.calendar_today, size: 20),
                        ),
                        onTap: () => selectDate(
                          context: context,
                          dateObs: bookingCtr.checkOut,
                          property: roomType,
                          label: "المغادرة",
                          checkInDate: bookingCtr.parseDate(bookingCtr.checkIn.value),
                        ),
                      )),

                  // عرض السعر والمبلغ الإجمالي
                  Obx(() {
                    if (bookingCtr.nights.value > 0) {
                      return Column(
                        children: [
                          const SizedBox(height: 16),
                          Divider(color: Colors.grey.shade300),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "عدد ${bookingCtr.bookingType.value == 'ليلي' ? 'الليالي' : 'الأيام'}",
                                style: GoogleFonts.cairo(
                                  fontSize: 14,
                                  color: Colors.grey[700],
                                ),
                              ),
                              Text(
                                "${bookingCtr.nights.value} ${bookingCtr.bookingType.value == 'ليلي' ? 'ليلة' : 'يوم'}",
                                style: GoogleFonts.cairo(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue.shade700,
                                ),
                              ),
                            ],
                          ),
                          if (bookingCtr.total.value > 0) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "المبلغ الإجمالي",
                                  style: GoogleFonts.cairo(
                                    fontSize: 14,
                                    color: Colors.grey[700],
                                  ),
                                ),
                                Text(
                                  "${bookingCtr.total.value.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (match) => '${match.group(1)},')} ${bookingCtr.bookingType.value == 'ليلي' ? (roomType['nightly_currency'] ?? '') : (roomType['daily_price_currency'] ?? '')}",
                                  style: GoogleFonts.cairo(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green.shade700,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  }),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // === زر تأكيد الحجز ===
            CustomButton(
              text: "تأكيد المعلومات والتواصل واتساب",
              height: 60,
              borderRadius: 16,
              fontSize: 17,
              backgroundColor: Colors.blueAccent,
              onPressed: () {
                if (bookingCtr.checkIn.value.isEmpty ||
                    bookingCtr.checkOut.value.isEmpty ||
                    bookingCtr.guests.value.isEmpty) {
                  showSnackBar("خطأ", "يرجى ملء جميع الحقول",
                      backgroundColor: Colors.red, colorText: Colors.white);
                  return;
                }

                final checkIn = bookingCtr.parseDate(bookingCtr.checkIn.value);
                final checkOut = bookingCtr.parseDate(bookingCtr.checkOut.value);

                if (checkIn == null || checkOut == null) {
                  showSnackBar("خطأ", "تاريخ غير صالح",
                      backgroundColor: Colors.red, colorText: Colors.white);
                  return;
                }

                if (checkOut.isBefore(checkIn) || checkOut.isAtSameMomentAs(checkIn)) {
                  showSnackBar("خطأ", "تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول",
                      backgroundColor: Colors.red, colorText: Colors.white);
                  return;
                }

                // إظهار Bottom Sheet
                Get.bottomSheet(
                  bookingCtr.showConfirm(
                    hotel: hotel,
                    roomType: roomType,
                    sendToWhatsApp: () {
                      sendToWhatsAppHotelBooking(hotel, roomType);
                    },
                  ),
                  isScrollControlled: true,
                  backgroundColor: Colors.white,
                  shape: const RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(20))),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

