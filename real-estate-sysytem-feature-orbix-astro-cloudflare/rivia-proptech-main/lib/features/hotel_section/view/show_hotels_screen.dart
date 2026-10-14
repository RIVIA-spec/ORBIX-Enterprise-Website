import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/hotel_card.dart';
import 'package:real_estate_app/features/home_section/controller/home_controller.dart';

class ShowHotelsScreen extends StatelessWidget {
  const ShowHotelsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final homeCtr = Get.put(HomeController());

    return Scaffold(
      appBar: CustomAppBar(title: "الفنادق"),
      body: _buildHotelsSection(homeCtr)
    );
  }

  Widget _buildHotelsSection(HomeController ctr) {
    if (ctr.isSearching.value) return const SizedBox.shrink();

    if (ctr.isLoadingHotels.value) {
      return const Padding(
        padding: EdgeInsets.all(20.0),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (ctr.hotels.isEmpty) {
      return const SizedBox.shrink();
    }

    return Obx(() {
      final displayedCount = ctr.displayedHotelsCount.value;
      final totalCount = ctr.hotels.length;
      // final hotelsToShow = displayedCount > totalCount ? totalCount : displayedCount;
      // final initialCount = 4; // العدد الافتراضي المعروض
      
      return Column(
        children: [
          const SizedBox(height: 30),
          // _sectionTitle("الفنادق", "اكتشف أفضل الفنادق المتاحة للإقامة"),
          // const SizedBox(height: 16),
          AnimationLimiter(
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: totalCount,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 0.5,
              ),
              itemBuilder: (context, index) {
                final hotel = ctr.hotels[index];
                return AnimationConfiguration.staggeredGrid(
                  position: index,
                  columnCount: 2,
                  child: ScaleAnimation(
                    child: FadeInAnimation(child: HotelCard(hotel: hotel)),
                  ),
                );
              },
            ),
          ),
          // if (totalCount > initialCount) ...[
          //   const SizedBox(height: 20),
          //   // زر "أظهر أقل" - يظهر فقط عندما يكون المعروض أكثر من العدد الافتراضي
          //   if (hotelsToShow > initialCount)
          //     SizedBox(
          //       width: double.infinity,
          //       child: OutlinedButton.icon(
          //         onPressed: () {
          //           ctr.displayedHotelsCount.value = initialCount;
          //         },
          //         icon: const Icon(Icons.expand_less, size: 20),
          //         label: Text(
          //           "أظهر أقل",
          //           style: GoogleFonts.cairo(
          //             fontSize: 16,
          //             fontWeight: FontWeight.bold,
          //           ),
          //         ),
          //         style: OutlinedButton.styleFrom(
          //           foregroundColor: Colors.grey.shade700,
          //           side: BorderSide(color: Colors.grey.shade400, width: 2),
          //           padding: const EdgeInsets.symmetric(vertical: 14),
          //           shape: RoundedRectangleBorder(
          //             borderRadius: BorderRadius.circular(12),
          //           ),
          //         ),
          //       ),
          //     ),
          //   const SizedBox(height: 12),
          //   // زر "أظهر المزيد" - يظهر فقط عندما يكون المعروض أقل من الإجمالي
          //   if (hotelsToShow < totalCount)
          //     SizedBox(
          //       width: double.infinity,
          //       child: ElevatedButton.icon(
          //         onPressed: () {
          //           ctr.displayedHotelsCount.value += 10;
          //         },
          //         icon: const Icon(Icons.expand_more, size: 20),
          //         label: Text(
          //           "أظهر المزيد",
          //           style: GoogleFonts.cairo(
          //             fontSize: 16,
          //             fontWeight: FontWeight.bold,
          //           ),
          //         ),
          //         style: ElevatedButton.styleFrom(
          //           backgroundColor: Colors.blue.shade600,
          //           foregroundColor: Colors.white,
          //           padding: const EdgeInsets.symmetric(vertical: 14),
          //           shape: RoundedRectangleBorder(
          //             borderRadius: BorderRadius.circular(12),
          //           ),
          //           elevation: 2,
          //         ),
          //       ),
          //     ),
          //   const SizedBox(height: 12),
          //   // زر "أظهر الكل" - يظهر فقط عندما يكون المعروض أقل من الإجمالي
          //   if (hotelsToShow < totalCount)
          //     SizedBox(
          //       width: double.infinity,
          //       child: OutlinedButton.icon(
          //         onPressed: () {
          //           ctr.displayedHotelsCount.value = totalCount;
          //         },
          //         icon: const Icon(Icons.view_list, size: 20),
          //         label: Text(
          //           "أظهر الكل (${totalCount})",
          //           style: GoogleFonts.cairo(
          //             fontSize: 16,
          //             fontWeight: FontWeight.bold,
          //           ),
          //         ),
          //         style: OutlinedButton.styleFrom(
          //           foregroundColor: Colors.blue.shade700,
          //           side: BorderSide(color: Colors.blue.shade600, width: 2),
          //           padding: const EdgeInsets.symmetric(vertical: 14),
          //           shape: RoundedRectangleBorder(
          //             borderRadius: BorderRadius.circular(12),
          //           ),
          //         ),
          //       ),
          //     ),
          // ],
        ],
      );
    });
  }

  Widget _sectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: GoogleFonts.cairo(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.black87)),
        const SizedBox(height: 6),
        Text(subtitle,
            style:
                GoogleFonts.cairo(fontSize: 14, color: Colors.grey.shade600)),
      ],
    );
  }
}