// lib/features/home_section/view/home_screen.dart
import 'dart:developer';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/favorites_controller.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/animations.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/app_drawer.dart';
import 'package:real_estate_app/core/widgets/proprty_card.dart';
import 'package:real_estate_app/core/widgets/hotel_card.dart';
import 'package:real_estate_app/features/home_section/controller/home_controller.dart';
import 'package:real_estate_app/features/home_section/widget/ad_aware_widget.dart';
import 'package:real_estate_app/features/home_section/widget/animated_app_bar_title.dart';
import 'package:real_estate_app/features/home_section/widget/build_search_result.dart';
import 'package:real_estate_app/features/home_section/widget/clear_filter_button.dart';
import 'package:real_estate_app/features/home_section/widget/custom_home_app_bar.dart';
import 'package:real_estate_app/features/home_section/widget/main_content.dart';
import 'package:real_estate_app/features/home_section/widget/no_data_yet.dart';
import 'package:real_estate_app/features/home_section/widget/show_filter_bottom_sheet.dart';
import 'package:real_estate_app/features/notification_section/controller/badge_controller.dart';
import 'package:real_estate_app/features/notification_section/view/notifications_screen.dart';
import 'dart:ui'; // للـ BackdropFilter

class HomeScreen extends StatelessWidget {
  
  final userCtr = Get.find<UserController>();

  HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    Get.put(BadgeController());
    final HomeController homeCtr = Get.put(HomeController());

    // لا نضع الـ AppBar في خاصية appBar الخاصة بالـ Scaffold الآن.
    // بدلاً من ذلك نعرضه كـ Positioned داخل Stack (تراكب) فوق الـ body.
    return Scaffold(
      // نترك extendBodyBehindAppBar true حتى تسمح الخلفية الموسّعة للـ SliverAppBar بالامتداد إلى الأعلى
      // هذا يساعد على أن يظهر الـ flexibleSpace خلف الـ AppBar العائم عندما يكون موسعاً.
      extendBodyBehindAppBar: true,
      drawer: const AppDrawer(),
      // appBar: null, // حذفنا استخدام appBar هنا
      body: Stack(
        children: [
          // ======= الـ Body (المحتوى) في الخلفية =======
          Positioned.fill(
            child: RefreshIndicator(
              onRefresh: () async {
                homeCtr.loadData();
                homeCtr.loadHotels();
              },
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(
                    parent: AlwaysScrollableScrollPhysics()),
                slivers: [
                  SliverAppBar(
                    expandedHeight: Get.height * 0.45,
                    floating: false,
                    title: LayoutBuilder(
                      builder: (context, constraints) {
                        final settings =
                            context.dependOnInheritedWidgetOfExactType<
                                FlexibleSpaceBarSettings>();
                        if (settings == null) return const SizedBox.shrink();

                        final isCollapsed =
                            settings.currentExtent <= settings.minExtent + 1;

                        // تحديث الـ Obs
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (homeCtr.isSilverAppBarCollapsed.value !=
                              isCollapsed) {
                            homeCtr.isSilverAppBarCollapsed.value = isCollapsed;
                            // log("is silver collapsed value : ${homeCtr.isSilverAppBarCollapsed.value}");
                          }
                        });

                        return const SizedBox.shrink();
                      },
                    ),
                    pinned: false,
                    snap: false,
                    stretch: true,
                    backgroundColor: Colors.transparent,
                    elevation: 0,
                    automaticallyImplyLeading: false,
                    flexibleSpace: FlexibleSpaceBar(
                      collapseMode: CollapseMode.parallax,
                      background: Stack(
                        fit: StackFit.expand,
                        children: [
                          // خلفية التدرج اللوني
                          Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFF1E88E5),
                                  Color(0xFF1565C0),
                                ],
                              ),
                            ),
                          ),

                          // الأيقونات في الأعلى (تظهر عندما الـ SliverAppBar موسع)
                          Positioned(
                            top: MediaQuery.of(context).padding.top + 8,
                            left: 16,
                            right: 16,
                            child: Row(
                              children: [
                                Builder(
                                  builder: (context) => IconButton(
                                    onPressed: () =>
                                        Scaffold.of(context).openDrawer(),
                                    icon: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.25),
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                            color:
                                                Colors.white.withOpacity(0.4),
                                            width: 1.5),
                                      ),
                                      child: const Icon(Icons.menu_rounded,
                                          color: Colors.white, size: 26),
                                    ),
                                  ),
                                ),

                                const SizedBox(width: 12),

                                // إشعارات عند الظهور الكامل
                                Obx(() {
                                  if (!Get.find<UserController>()
                                      .isLoggedIn
                                      .value) {
                                    return const SizedBox(width: 48);
                                  }
                                  final count = Get.find<BadgeController>()
                                      .unreadCount
                                      .value;
                                  return Stack(
                                    children: [
                                      IconButton(
                                        onPressed: () => Get.to(
                                            () => const NotificationsScreen()),
                                        icon: Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color:
                                                Colors.white.withOpacity(0.25),
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                                color: Colors.white
                                                    .withOpacity(0.4),
                                                width: 1.5),
                                          ),
                                          child: const Icon(
                                              Icons.notifications_none_rounded,
                                              color: Colors.white,
                                              size: 26),
                                        ),
                                      ),
                                      if (count > 0)
                                        Positioned(
                                          right: 6,
                                          top: 6,
                                          child: Container(
                                            padding: const EdgeInsets.all(4),
                                            decoration: const BoxDecoration(
                                                color: Colors.red,
                                                shape: BoxShape.circle),
                                            constraints: const BoxConstraints(
                                                minWidth: 22, minHeight: 22),
                                            child: Text(
                                              count > 99 ? "99+" : '$count',
                                              style: GoogleFonts.cairo(
                                                  color: Colors.white,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold),
                                              textAlign: TextAlign.center,
                                            ),
                                          ),
                                        ),
                                    ],
                                  );
                                }),

                                const Spacer(),

                                // الشعار في أقصى اليمين
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(14),
                                  child: 
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(50),
                                    child: Image.asset(
                                      "assets/icon/orbix.png", width: 60, height: 60),
                                  ),
                                  // SvgPicture.asset(
                                  //     "assets/icon/rivia-logo-transparent.svg",
                                  //     width: 60,
                                  //     height: 60
                                  // ),
                                ),
                              ],
                            ),
                          ),
                  
                          // النصوص الكبيرة في الأسفل
                          AdAwareWidget(),
                          // Positioned(
                          //   bottom: 40,
                          //   left: 24,
                          //   right: 24,
                          //   child: Column(
                          //     crossAxisAlignment: CrossAxisAlignment.start,
                          //     children: [
                          //       Text(
                          //         "سكن",
                          //         style: GoogleFonts.cairo(
                          //           fontSize: 56,
                          //           fontWeight: FontWeight.w900,
                          //           color: Colors.white,
                          //           shadows: const [
                          //             Shadow(
                          //                 blurRadius: 20,
                          //                 color: Colors.black26,
                          //                 offset: Offset(0, 6))
                          //           ],
                          //         ),
                          //       ),
                          //       const SizedBox(height: 8),
                          //       Text(
                          //         "اكتشف منزل أحلامك",
                          //         style: GoogleFonts.cairo(
                          //             fontSize: 30,
                          //             fontWeight: FontWeight.bold,
                          //             color: Colors.white),
                          //       ),
                          //       const SizedBox(height: 12),
                          //       ClipRRect(
                          //         borderRadius: BorderRadius.circular(20),
                          //         child: BackdropFilter(
                          //           filter: ImageFilter.blur(
                          //               sigmaX: 10, sigmaY: 10),
                          //           child: Container(
                          //             padding: const EdgeInsets.symmetric(
                          //                 horizontal: 20, vertical: 14),
                          //             decoration: BoxDecoration(
                          //               color: Colors.white.withOpacity(0.18),
                          //               borderRadius: BorderRadius.circular(20),
                          //               border: Border.all(
                          //                   color:
                          //                       Colors.white.withOpacity(0.3)),
                          //             ),
                          //             child: Text(
                          //               "ابحث عن أفضل العروض من عقاراتنا المميزة",
                          //               style: GoogleFonts.cairo(
                          //                   fontSize: 16,
                          //                   color: Colors.white,
                          //                   fontWeight: FontWeight.w500),
                          //             ),
                          //           ),
                          //         ),
                          //       ),
                          //     ],
                          //   ),
                          // ),
                        ],
                      ),
                    ),
                  ),

                  // ===================== شريط البحث مع زر الفلتر =====================
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 25,
                                offset: const Offset(0, 12)),
                          ],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: CustomTextFormField(
                                margin: const EdgeInsets.symmetric(
                                    horizontal: 5, vertical: 10),
                                controller: homeCtr.searchController,
                                hint: "ابحث عن طريق العنوان أو المعرف",
                                hintFontSize: 12,
                                prefixIcon: const Icon(Icons.search_rounded,
                                    color: Colors.blue, size: 28),
                                suffixIcon: Obx(() => homeCtr.isSearching.value
                                    ? IconButton(
                                        icon: const Icon(Icons.clear_rounded),
                                        onPressed: () {
                                          homeCtr.search('');
                                          homeCtr.searchController.clear();
                                          FocusScope.of(context).unfocus();
                                        },
                                      )
                                    : const SizedBox.shrink()),
                                onChanged: (value) => homeCtr.search(value),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.filter_list_rounded,
                                  color: Colors.blue, size: 28),
                              onPressed: () => showFilterBottomSheet(),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // ===================== زر إزالة الفلتر إذا كان مطبقًا =====================
                  SliverToBoxAdapter(
                    child: Obx(
                      () => homeCtr.isFilterApplied.value
                          ? Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 6),
                              child: ClearFilterButton(
                                enabled: homeCtr.isFilterApplied.value,
                                onPressed: () => homeCtr.clearFilters(),
                                label: "إزالة الفلتر",
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                  ),

                  // ===================== المحتوى الرئيسي =====================
                  SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverToBoxAdapter(
                      child: RefreshIndicator(
                        onRefresh: () async => homeCtr.loadData(),
                        child: Column(
                          children: [
                            const SizedBox(height: 16),
                            SearchResult(),
                            const SizedBox(height: 24),
                            MainContent(),
                            const SizedBox(height: 24),
                            Obx(() => _buildHotelsSection(homeCtr)),
                            const SizedBox(height: 80),

                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ======= الـ AppBar العائم في الأعلى (لا يؤثر على قياسات الـ body) =======
          // نضعه دائماً في الـ Stack، لكنه يظهر/يختفي داخلياً بحسب الـ isVisible
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: CustomHomeAppBar(isVisible: homeCtr.isSilverAppBarCollapsed),
          ),
        ],
      ),
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
      final hotelsToShow = displayedCount > totalCount ? totalCount : displayedCount;
      final initialCount = 4; // العدد الافتراضي المعروض
      
      return Column(
        children: [
          _sectionTitle("الفنادق", "اكتشف أفضل الفنادق المتاحة للإقامة"),
          const SizedBox(height: 16),
          AnimationLimiter(
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: hotelsToShow,
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
          if (totalCount > initialCount) ...[
            const SizedBox(height: 20),
            // زر "أظهر أقل" - يظهر فقط عندما يكون المعروض أكثر من العدد الافتراضي
            if (hotelsToShow > initialCount)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    ctr.displayedHotelsCount.value = initialCount;
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
            if (hotelsToShow < totalCount)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    ctr.displayedHotelsCount.value += 10;
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
            if (hotelsToShow < totalCount)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    ctr.displayedHotelsCount.value = totalCount;
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
