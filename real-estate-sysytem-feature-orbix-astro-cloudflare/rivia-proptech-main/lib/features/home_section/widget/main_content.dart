
import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:get/get.dart';
import 'package:get/state_manager.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/proprty_card.dart';
import 'package:real_estate_app/core/widgets/hotel_card.dart';
import 'package:real_estate_app/features/home_section/controller/home_controller.dart';
import 'package:real_estate_app/features/home_section/widget/no_data_yet.dart';

class MainContent extends StatelessWidget {
  const MainContent({super.key});

  @override
  Widget build(BuildContext context) {
    final HomeController ctr = Get.find<HomeController>();
    
    
    return Obx(
      () {
        if (ctr.isSearching.value) return const SizedBox.shrink();
        if (ctr.isLoading.value) {
          return SizedBox(
            height: Get.height * 0.4,
            child: const LoadingDiscreteCircular(),
          );
        }
        return Column(
          children: [
            if (ctr.featuredProperties.isNotEmpty) ...[
              _sectionTitle("عقارات وفنادق مميزة", "اكتشف افضل العقارات والفنادق لتناسب ذوقك الرفيع"),
              const SizedBox(height: 16),
              AnimationLimiter(
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: ctr.featuredProperties.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 14,
                    childAspectRatio: 0.5,
                  ),
                  itemBuilder: (context, index) {
                    final item = ctr.featuredProperties[index];
                    final itemType = item['item_type'] ?? 'property';
                    return AnimationConfiguration.staggeredGrid(
                      position: index,
                      columnCount: 2,
                      child: ScaleAnimation(
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
              const SizedBox(height: 40),
            ],
        
            if (ctr.mixedItems.isNotEmpty)
              Column(
                children: [
                  _sectionTitle("العقارات والفنادق", "اكتشف أحدث العقارات والفنادق المتاحة"),
                  const SizedBox(height: 16),
                  Obx(() {
                    final displayedCount = ctr.displayedMixedItemsCount.value;
                    final totalCount = ctr.mixedItems.length;
                    final itemsToShow = displayedCount > totalCount ? totalCount : displayedCount;
                    
                    return Column(
                      children: [
                        AnimationLimiter(
                          child: GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: itemsToShow,
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 14,
                              mainAxisSpacing: 14,
                              childAspectRatio: 0.5,
                            ),
                            itemBuilder: (context, index) {
                              final item = ctr.mixedItems[index];
                              final itemType = item['item_type'] ?? 'property';
                              
                              return AnimationConfiguration.staggeredGrid(
                                position: index,
                                columnCount: 2,
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
                        if (totalCount > 8) ...[
                          const SizedBox(height: 20),
                          // زر "أظهر أقل" - يظهر فقط عندما يكون المعروض أكثر من العدد الافتراضي (8)
                          if (itemsToShow > 8)
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  ctr.displayedMixedItemsCount.value = 8;
                                },
                                icon: const Icon(Icons.expand_less, size: 20),
                                label: Text(
                                  "أظهر أقل",
                                  style: GoogleFonts.cairo(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.grey.shade700,
                                  side: BorderSide(color: Colors.grey.shade400, width: 2),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                          const SizedBox(height: 12),
                          // زر "أظهر المزيد" - يظهر فقط عندما يكون المعروض أقل من الإجمالي
                          if (itemsToShow < totalCount)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  ctr.displayedMixedItemsCount.value += 8;
                                },
                                icon: const Icon(Icons.expand_more, size: 20),
                                label: Text(
                                  "أظهر المزيد",
                                  style: GoogleFonts.cairo(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue.shade600,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 2,
                                ),
                              ),
                            ),
                          const SizedBox(height: 12),
                          // زر "أظهر الكل" - يظهر فقط عندما يكون المعروض أقل من الإجمالي
                          if (itemsToShow < totalCount)
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  ctr.displayedMixedItemsCount.value = totalCount;
                                },
                                icon: const Icon(Icons.view_list, size: 20),
                                label: Text(
                                  "أظهر الكل (${totalCount})",
                                  style: GoogleFonts.cairo(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.blue.shade700,
                                  side: BorderSide(color: Colors.blue.shade600, width: 2),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ],
                    );
                  }),
                ],
              )
            else if (ctr.featuredProperties.isEmpty && ctr.mixedItems.isEmpty)
              const NoDataYet(),
          ],
        );
      },
    );
  }

  Widget _sectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 6),
        Text(subtitle, style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey.shade600)),
      ],
    );
  }
}