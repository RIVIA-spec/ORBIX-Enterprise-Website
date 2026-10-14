// ad_aware_widget.dart
import 'dart:ui';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/features/home_section/widget/ad_full_screen.dart';
import 'package:real_estate_app/features_admin/ads_section/ad_model.dart';
import 'package:visibility_detector/visibility_detector.dart';

class AdAwareWidget extends StatefulWidget {
  const AdAwareWidget({super.key});

  @override
  State<AdAwareWidget> createState() => _AdAwareWidgetState();
}

class _AdAwareWidgetState extends State<AdAwareWidget> {
  final AdsController adsCtrl = Get.put(AdsController());

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      adsCtrl.loadAdsOnce();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final bool isAdsMode = adsCtrl.showAds.value;

      // الويدجت التي ستُعرض (إما المحتوى الأصلي الكبير أو الكاروسيل)
      Widget innerContent = isAdsMode
          ? _buildAdsCarousel()
          : _buildOriginalContentLarge();

      return Positioned(
        bottom: 40,
        left: 24,
        right: 24,
        child: VisibilityDetector(
          key: const Key('ad_aware_key'),
          onVisibilityChanged: (VisibilityInfo info) {
            // نزيد العداد فقط إذا كنا في الوضع العادي (بدون إعلانات) وكان الظهور كافيًا
            if (!isAdsMode && info.visibleFraction > 0.7) {
              adsCtrl.onBannerViewed();
            }
          },
          child: innerContent,
        ),
      );
    });
  }

  // النسخة الكبيرة (تُعرض عندما لا توجد إعلانات بعد)
  Widget _buildOriginalContentLarge() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          "Reality Reimagined",
          textAlign: TextAlign.center,
          style: GoogleFonts.cairo(
            fontSize: 40, // حجم كبير وجذاب
            fontWeight: FontWeight.w900,
            color: Colors.white,
            shadows: const [
              Shadow(blurRadius: 20, color: Colors.black26, offset: Offset(0, 6))
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "AI-Powered Platform For Real Estates & Hotels",
          textAlign: TextAlign.center,
          style: GoogleFonts.cairo(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.18),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Text(
                "ابحث عن أفضل العروض من عقاراتنا المميزة",
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // النسخة المصغرة (تظهر كآخر slide في الكاروسيل)
  Widget _buildOriginalContentSmall() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          "Reality Reimagined",
          textAlign: TextAlign.center,
          style: GoogleFonts.cairo(
            fontSize: 30,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            shadows: const [
              Shadow(blurRadius: 20, color: Colors.black26, offset: Offset(0, 6))
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          "AI-Powered Platform For Real Estates & Hotels",
          textAlign: TextAlign.center,
          style: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 20),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.18),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Text(
                "ابحث عن أفضل العروض من عقاراتنا المميزة",
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(
                  fontSize: 14,
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // الكاروسيل (يحتوي على الإعلانات + النسخة المصغرة كآخر عنصر)
  Widget _buildAdsCarousel() {
    return CarouselSlider.builder(
      options: CarouselOptions(
        height: Get.height * 0.25,
        autoPlay: true,
        autoPlayInterval: const Duration(seconds: 7),
        autoPlayAnimationDuration: const Duration(milliseconds: 1000),
        autoPlayCurve: Curves.easeInOutCubic,
        enlargeCenterPage: false,
        viewportFraction: 1.0,
      ),
      itemCount: adsCtrl.ads.length + 1,
      itemBuilder: (context, index, realIndex) {
        if (index == adsCtrl.ads.length) {
          return _buildOriginalAsSlide();
        }
        final ad = adsCtrl.ads[index];
        return _buildImageSlide(ad);
      },
    );
  }

  // النسخة المصغرة داخل الكاروسيل (مع بلور وخلفية داكنة)
  Widget _buildOriginalAsSlide() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4), // لتجنب القص عند الحواف
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.black.withOpacity(0.3),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: _buildOriginalContentSmall(),
          ),
        ),
      ),
    );
  }

  // صورة الإعلان
  Widget _buildImageSlide(AdModel ad) {
    return GestureDetector(
      onTap: () => Get.to(() => AdFullScreenView(ad: ad)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              ad.imageUrl,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, progress) =>
                  progress == null ? child : const Center(child: CircularProgressIndicator(color: Colors.white)),
              errorBuilder: (context, error, stackTrace) => Container(
                color: Colors.grey[800],
                child: const Center(child: Icon(Icons.broken_image, color: Colors.white, size: 50)),
              ),
            ),
            if (ad.link.isNotEmpty)
              Positioned(
                bottom: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.blueAccent.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.touch_app_outlined, color: Colors.white, size: 20),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class AdsController extends GetxController {
  // هل نعرض الإعلانات (Carousel) أم الويدجت الأصلية؟
  final RxBool showAds = false.obs;

  // قائمة الإعلانات من Firebase
  final RxList<AdModel> ads = <AdModel>[].obs;

  // للتحميل مرة واحدة فقط
  bool _hasLoadedAds = false;

  final CollectionReference adsCollection =
      FirebaseFirestore.instance.collection('ads');

  // عداد المشاهدات (يُحفظ في التخزين المحلي)
  final RxInt viewCount = 0.obs;

  // مفتاح التخزين
  static const String _viewCountKey = 'banner_view_count';

  @override
  void onInit() {
    super.onInit();
    
    // اقرأ العداد المحفوظ عند بدء التشغيل
    final storedCount = GetStorage().read<int>(_viewCountKey) ?? 0;
    viewCount.value = storedCount;

    // إذا كان العداد >= 3، فعّل الإعلانات فورًا
    if (viewCount.value >= 3) {
      showAds.value = true;
    }
  }

  // تحميل الإعلانات مرة واحدة فقط، مع preloading الصور
  Future<void> loadAdsOnce() async {
    if (_hasLoadedAds) return;

    try {
      final snapshot = await adsCollection.orderBy('order').get();
      final List<AdModel> loadedAds = snapshot.docs
          .map((doc) =>
              AdModel.fromMap(doc.id, doc.data() as Map<String, dynamic>))
          .toList();

      ads.assignAll(loadedAds);
      _hasLoadedAds = true;

      await _preloadImages(loadedAds);
    } catch (e) {
      showSnackBar('خطأ', 'فشل تحميل الإعلانات',
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> _preloadImages(List<AdModel> adsList) async {
    for (final ad in adsList) {
      if (ad.imageUrl.isNotEmpty) {
        await precacheImage(NetworkImage(ad.imageUrl), Get.context!);
      }
    }
  }

  // ندعوها كل مرة يظهر فيها الـ Banner (الويدجت الأصلي)
  void onBannerViewed() {
    viewCount.value++; // زد العداد

    // حفظ العداد الجديد في التخزين المحلي
    GetStorage().write(_viewCountKey, viewCount.value);

    // بعد 3 مشاهدات، فعّل الإعلانات (ويبقى مفعل دائمًا)
    if (viewCount.value >= 3) {
      showAds.value = true;
    }
  }
}