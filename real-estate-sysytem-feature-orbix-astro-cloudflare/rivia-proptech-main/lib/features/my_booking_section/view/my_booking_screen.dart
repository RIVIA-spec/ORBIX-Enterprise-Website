// lib/features/bookings/view/bookings_page.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/booking_card.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features/my_booking_section/controller/bookings_controller.dart';
import 'package:real_estate_app/features/my_booking_section/widget/booking_card.dart';

class MyBookingsScreen extends StatelessWidget {
  const MyBookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BookingsController());

    return Scaffold(
      appBar: CustomAppBar(title: "حجوزاتي"),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(
            child: LoadingDiscreteCircular(),
          );
        }

        if (controller.bookings.isEmpty) {
          return NoDataWithRefreshIndicator(
            noDataText: "لا توجد حجوزات بعد",
            onRefresh: controller.loadBookings,
            icon: Icon(Icons.event_busy_outlined, size: 80, color: Colors.grey[400]),
          );
        }

        return RefreshIndicator(
          onRefresh: controller.loadBookings,
          color: Colors.blue[700],
          backgroundColor: Colors.white,
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            itemCount: controller.bookings.length,
            itemBuilder: (context, index) {
              final booking = controller.bookings[index];
              return BookingCard(booking: booking);
            },
          ),
        );
      }),
    );
  }
}