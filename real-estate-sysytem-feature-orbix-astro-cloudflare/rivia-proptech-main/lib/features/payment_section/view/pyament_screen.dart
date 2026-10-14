// lib/features/payment_section/view/payment_page.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/payment_section/controller/payment_controller.dart';
import 'package:real_estate_app/features/payment_section/widget/select_date_payment.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class PaymentPage extends StatelessWidget {
  PaymentPage({
    super.key,
    required this.property,
    this.dealId,
    this.dealIdFuture,
  });

  final Map property;
  final String? dealId;
  final Future<String>? dealIdFuture;
  final PaymentController paymentCtr = Get.put(PaymentController());

  Future<String> _resolveDealId() async {
    final existingDealId = dealId?.trim();
    if (existingDealId != null && existingDealId.isNotEmpty) {
      return existingDealId;
    }

    final pendingDealId = dealIdFuture;
    if (pendingDealId == null) {
      throw Exception('dealId غير موجود لطلب الحجز');
    }

    return pendingDealId;
  }

  @override
  Widget build(BuildContext context) {
    final property =
        normalizePropertyMap(Map<String, dynamic>.from(this.property));
    final upcomingBookings = paymentCtr.getUpcomingBookings(property);

    return Scaffold(
      appBar: CustomAppBar(title: "إرسال طلب الحجز"),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (dealIdFuture != null) ...[
              FutureBuilder<String>(
                future: dealIdFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.done) {
                    return const SizedBox.shrink();
                  }

                  return Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.blue.shade700,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            "جاري تجهيز طلب الحجز...",
                            style: GoogleFonts.cairo(
                              color: Colors.blue.shade800,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],

            // === تنبيه الحجوزات القادمة ===
            if (upcomingBookings.isNotEmpty) ...[
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.orange.shade300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber,
                            color: Colors.orange.shade700, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          "حجوزات قادمة",
                          style: GoogleFonts.cairo(
                            fontWeight: FontWeight.bold,
                            color: Colors.orange.shade800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // عرض كل حجز
                    ...upcomingBookings.map((booking) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            children: [
                              Icon(Icons.calendar_today,
                                  size: 16, color: Colors.orange.shade600),
                              const SizedBox(width: 6),
                              Text(
                                "من ${booking['fromStr']} إلى ${booking['toStr']}",
                                style: GoogleFonts.cairo(fontSize: 13),
                              ),
                            ],
                          ),
                        )),

                    const SizedBox(height: 12),

                    // رسالة التحذير
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.orange.shade400),
                      ),
                      child: Text(
                        "يرجى الحجز قبل ${upcomingBookings.first['fromStr']} لتجنب التداخل",
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.bold,
                          color: Colors.orange.shade900,
                          fontSize: 13,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ],

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
                  // عدد الضيوف
                  CustomTextFormField(
                    label: "عدد الضيوف",
                    hint: "مثال: 2",
                    keyboardType: TextInputType.number,
                    onChanged: (val) {
                      final num = int.tryParse(val.trim());
                      if (num != null && num > 0) {
                        paymentCtr.guests.value = val.trim();
                      } else {
                        if (int.tryParse(arabicToEnglish(val.trim())) != null) {
                          val = arabicToEnglish(val.trim());
                          paymentCtr.guests.value = val.trim();
                        } else {
                          paymentCtr.guests.value = '';
                        }
                      }
                    },
                  ),

                  // تاريخ الوصول
                  const SizedBox(height: 16),
                  // تاريخ البدء
                  Obx(() => CustomTextFormField(
                        label: "تاريخ البدء",
                        hint: "اختر تاريخ البدء",
                        readOnly: true,
                        controller: TextEditingController(
                            text: paymentCtr.checkIn.value),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.all(12),
                          child: Icon(Icons.calendar_today, size: 20),
                        ),
                        onTap: () => selectDate(
                          context: context,
                          dateObs: paymentCtr.checkIn,
                          property: property,
                          label: "الوصول",
                        ),
                      )),

                  const SizedBox(height: 16),

                  // تاريخ الانتهاء
                  Obx(() => CustomTextFormField(
                        label: "تاريخ الانتهاء",
                        hint: "اختر تاريخ الانتهاء",
                        readOnly: true,
                        controller: TextEditingController(
                            text: paymentCtr.checkOut.value),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.all(12),
                          child: Icon(Icons.calendar_today, size: 20),
                        ),
                        onTap: () => selectDate(
                          context: context,
                          dateObs: paymentCtr.checkOut,
                          property: property,
                          label: "المغادرة",
                          checkInDate:
                              paymentCtr.parseDate(paymentCtr.checkIn.value),
                        ),
                      )),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // === زر تأكيد الحجز ===
            CustomButton(
              text: "تأكيد معلومات الحجز",
              height: 60,
              borderRadius: 16,
              fontSize: 17,
              backgroundColor: Colors.blueAccent,
              isLoading: paymentCtr.isPreparingDeal,
              loadingText: "جاري تجهيز الطلب...",
              showInlineLoadingContent: true,
              onPressed: () async {
                if (paymentCtr.isPreparingDeal.value) {
                  return;
                }

                if (paymentCtr.checkIn.value.isEmpty ||
                    paymentCtr.checkOut.value.isEmpty ||
                    paymentCtr.guests.value.isEmpty) {
                  showSnackBar("خطأ", "يرجى ملء جميع الحقول",
                      backgroundColor: Colors.red, colorText: Colors.white);
                  return;
                }

                final checkIn = paymentCtr.parseDate(paymentCtr.checkIn.value);
                final checkOut =
                    paymentCtr.parseDate(paymentCtr.checkOut.value);

                if (checkIn == null || checkOut == null) {
                  showSnackBar("خطأ", "تاريخ غير صالح",
                      backgroundColor: Colors.red, colorText: Colors.white);
                  return;
                }

                String resolvedDealId;
                try {
                  paymentCtr.isPreparingDeal.value = true;
                  resolvedDealId = await _resolveDealId();
                } catch (e) {
                  showSnackBar("خطأ", "تعذر تجهيز طلب الحجز: $e",
                      backgroundColor: Colors.red, colorText: Colors.white);
                  return;
                } finally {
                  paymentCtr.isPreparingDeal.value = false;
                }

                // إظهار Bottom Sheet
                Get.bottomSheet(
                  paymentCtr.showConfirm(
                    property: property,
                    dealId: resolvedDealId,
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
