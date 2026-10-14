// lib/features/admin/view/admin_pending_bookings_page.dart
import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features_admin/admin_booking_section/controller/admin_bookings_controller.dart';
import 'package:real_estate_app/features_admin/admin_booking_section/widget/pending_booking_card.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class AdminPendingBookingsScreen extends StatelessWidget {
  const AdminPendingBookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AdminBookingsController());

    return Scaffold(
      appBar: CustomAppBar(title: "الحجوزات المعلقة"),
      body: Obx(() {
        if (controller.isLoading.value) {
          return LoadingDiscreteCircular();
        }

        if (controller.pendingBookings.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async {
              controller.loadPendingBookings();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: Get.height, // يجعل الصفحة بنفس طول الشاشة → scoll يعمل حتى لو المحتوى قليل
                width: Get.width,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.event_available,
                          size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        "لا توجد حجوزات معلقة",
                        style: GoogleFonts.cairo(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: controller.loadPendingBookings,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: controller.pendingBookings.length,
            itemBuilder: (context, index) {
              final booking = controller.pendingBookings[index];
              return PendingBookingCard(
                booking: booking,
                onConfirm: () {
                  if(booking['property_type'] == "فندق"){
                    // تأكيد حجز فندق
                    controller.confirmHotelBooking(
                      booking['userId'] ?? "",
                      booking['bookingId'] ?? "",
                      booking['hotelId'] ?? "",
                      booking['roomTypeId'] ?? "",
                      booking['hotelName'] ?? "",
                    );
                  } else if(booking['property_type'] == "إيجار"){
                    var checkIn = controller.parseDateString(booking['check_in']);
                    var checkOut = controller.parseDateString(booking['check_out']);

                    if(checkOut == null || checkIn == null){
                      showSnackBar("خطأ", "تاريخ غير صالح");
                      return ;
                    }
                    controller.confirmRentBooking(
                      booking['userId'] ?? "",
                      booking['bookingId'] ?? "",
                      booking['propertyId'] ?? "",
                      booking['propertyTitle'] ?? "",
                      checkIn!,
                      checkOut!
                    );
                  } else if(booking['property_type'] == "بيع"){
                    controller.confirmSaleBooking(
                      booking['userId'],
                      booking['bookingId'],
                      booking['propertyId'],
                      booking['propertyTitle'],
                    );
                  }
                },
                onReject: (reason) => controller.rejectBooking(
                  booking['userId'],
                  booking['bookingId'],
                  reason,
                  booking['property_type'] == "فندق"
                      ? (booking['hotelName'] ?? "")
                      : (booking['propertyTitle'] ?? ""),
                ),
              );
            },
          ),
        );
      }),
    );
  }
}