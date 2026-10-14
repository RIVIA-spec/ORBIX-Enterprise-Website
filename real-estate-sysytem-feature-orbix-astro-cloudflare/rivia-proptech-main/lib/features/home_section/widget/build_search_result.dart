
import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:get/get_instance/get_instance.dart';
import 'package:get/state_manager.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/proprty_card.dart';
import 'package:real_estate_app/core/widgets/hotel_card.dart';
import 'package:real_estate_app/features/home_section/controller/home_controller.dart';

class SearchResult extends StatelessWidget {
  const SearchResult({super.key});

  @override
  Widget build(BuildContext context) {
    final HomeController ctr = Get.find<HomeController>();

    return Obx(() {
      if (!ctr.isSearching.value) return const SizedBox.shrink();

      if (ctr.searchResults.isEmpty) {
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 30),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.orange.shade200),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search_off_rounded, color: Colors.orange.shade700, size: 32),
              const SizedBox(width: 12),
              Text(
                "لا توجد نتائج لـ \"${ctr.searchQuery.value}\"",
                style: GoogleFonts.cairo(fontSize: 16, color: Colors.orange.shade800, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        );
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
            child: Text(
              "نتائج البحث (${ctr.searchResults.length})",
              style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blue.shade700),
            ),
          ),
          AnimationLimiter(
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: ctr.searchResults.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 0.5,
              ),
              itemBuilder: (context, index) {
                final item = ctr.searchResults[index];
                final itemType = item['item_type'] ?? 'property';
                return AnimationConfiguration.staggeredGrid(
                  position: index,
                  columnCount: 2,
                  duration: const Duration(milliseconds: 475),
                  child: SlideAnimation(
                    verticalOffset: 60,
                    child: FadeInAnimation(
                      child: itemType == 'hotel'
                          ? HotelCard(hotel: item)
                          : PropertyCard(property: item),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      );
    },);
  }
}