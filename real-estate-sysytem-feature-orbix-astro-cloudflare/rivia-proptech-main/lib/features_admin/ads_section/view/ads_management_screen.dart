// lib/features_admin/ads/view/ads_management_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import '../controller/ads_managment_controller.dart';
import '../widget/ad_tile.dart';

class AdsManagementScreen extends StatelessWidget {
  AdsManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AdsManagmentController adsCtrl = Get.put(AdsManagmentController());
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: CustomAppBar(title: "إدارة الإعلانات"),
        body: Obx(() {
          if (adsCtrl.isLoading.value) {
            return const LoadingDiscreteCircular();
          }

          if (adsCtrl.ads.isEmpty) {
            return NoDataWithRefreshIndicator(
              noDataText: "لا توجد إعلانات بعد",
              onRefresh: adsCtrl.loadAds,
            );
          }

          return RefreshIndicator(
            onRefresh: adsCtrl.loadAds,
            child: ReorderableListView.builder(
              itemCount: adsCtrl.ads.length,
              itemBuilder: (context, index) {
                final ad = adsCtrl.ads[index];
                return AdTile(
                  key: ValueKey(ad.id), // مفتاح ضروري للـ ReorderableListView
                  ad: ad,
                  controller: adsCtrl,
                );
              },
              onReorder: (oldIndex, newIndex) async {
                if (newIndex > oldIndex) newIndex -= 1;

                final movedAd = adsCtrl.ads.removeAt(oldIndex);
                adsCtrl.ads.insert(newIndex, movedAd);
                adsCtrl.ads.refresh(); // تحديث الواجهة فوراً

                // حفظ الترتيب الجديد في Firestore
                for (int i = 0; i < adsCtrl.ads.length; i++) {
                  await adsCtrl.updateAdOrder(adsCtrl.ads[i].id, i + 1);
                }
              },
            ),
          );
        }),
        floatingActionButton: FloatingActionButton(
          backgroundColor: Colors.blueAccent,
          child: const Icon(Icons.add_photo_alternate, color: Colors.white),
          onPressed: () => adsCtrl.addAd(),
          tooltip: 'إضافة إعلان جديد',
        ),
      ),
    );
  }
}