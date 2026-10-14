// lib/features/favorites/view/favorites_screen.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/favorites_controller.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';
import 'package:real_estate_app/core/widgets/animations.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/proprty_card.dart';
import 'package:real_estate_app/features/login_sction/view/login_screen.dart';

DateTime? _readBookingDate(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  return null;
}

class FavoritesScreen extends StatelessWidget {
  final FavoritesController favCtr = Get.find<FavoritesController>();
  final UserController userCtr = Get.find<UserController>();

  FavoritesScreen({super.key});

  // --- تحليل حالة العقار بناءً على دالة loadData ---
  Map<String, dynamic> analyzeProperty(Map<String, dynamic> data) {
    data = normalizePropertyMap(data);
    final isRent = isRentMap(data);
    final isSale = isSaleMap(data);

    // 1. إذا البيع
    if (isSale) {
      bool isSold = data['isSold'] ?? false;
      if (!isSold) {
        data['book_status'] = "متاح";
        data['statusColor'] = Colors.green;
      } else {
        data['book_status'] = "تم البيع";
        data['statusColor'] = Colors.red;
      }
    }
    // 2. إذا الإيجار
    else if (isRent) {
      final periods = (data['booked_periods'] as List?) ?? [];
      final now = DateTime.now();
      DateTime? currentBookingEnd;
      bool isBookedNow = false;

      for (final p in periods) {
        if (p is! Map) continue;
        final from = _readBookingDate(p['from']);
        final to = _readBookingDate(p['to']);
        if (from == null || to == null) continue;

        // نضيف يومًا واحدًا للنهاية ليشمل اليوم الأخير كاملاً
        final effectiveEnd = to.add(const Duration(days: 1));

        if ((now.isAfter(from) || now.isAtSameMomentAs(from)) &&
            now.isBefore(effectiveEnd)) {
          isBookedNow = true;
          if (currentBookingEnd == null || to.isAfter(currentBookingEnd)) {
            currentBookingEnd = to; // نعرض تاريخ النهاية الأصلي في الواجهة
          }
        }
      }

      if (isBookedNow && currentBookingEnd != null) {
        data['book_status'] =
            "محجوز حتى ${currentBookingEnd.day}/${currentBookingEnd.month}/${currentBookingEnd.year}";
        data['statusColor'] = Colors.red;
      } else {
        data['book_status'] = "متاح";
        data['statusColor'] = Colors.green;
      }
    } else {
      data['book_status'] = "متاح";
      data['statusColor'] = Colors.green;
    }

    return data;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: "المفضلة"),
      body: Obx(() {
        if (!userCtr.isLoggedIn.value) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.favorite_border, size: 80, color: Colors.grey),
                const SizedBox(height: 16),
                Text("سجل الدخول لرؤية مفضلتك",
                    style: GoogleFonts.cairo(
                        fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                CustomButton(
                  width: Get.width * 0.5,
                  text: "تسجيل الدخول",
                  onPressed: () => Get.to(() => LoginScreen()),
                )
              ],
            ),
          );
        }

        if (favCtr.favoriteIds.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async => favCtr.loadFavoritesOnce(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: Get.height * 0.7,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.heart_broken,
                          size: 80, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text("لا توجد عقارات في المفضلة",
                          style: GoogleFonts.cairo(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text("ابدأ بإضافة عقارات تحبها!",
                          style: GoogleFonts.cairo(color: Colors.grey)),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        // --- جلب العقارات المفضلة مع تحليل الحالة ---
        return StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('properties')
              .where(FieldPath.documentId, whereIn: favCtr.favoriteIds.toList())
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Center(child: Text("حدث خطأ: ${snapshot.error}"));
            }

            if (!snapshot.hasData) {
              return const LoadingDiscreteCircular(
                  margin: EdgeInsets.only(top: 100));
            }

            final docs = snapshot.data!.docs;
            if (docs.isEmpty) {
              return Center(
                  child: Text("لا توجد عقارات متاحة حاليًا",
                      style: GoogleFonts.cairo()));
            }

            // جمع البيانات الأساسية للعقارات
            final List<Map<String, dynamic>> propertyDataList = docs.map((doc) {
              final data = normalizePropertyMap(
                  doc.data() as Map<String, dynamic>,
                  id: doc.id);
              return data;
            }).toList();

            // استخدام FutureBuilder لجلب الحجوزات فوريًا (المستخدم ينتظر، لكن عدد المفضلات محدود)
            return FutureBuilder<List<Map<String, dynamic>>>(
              future: _loadBookingsForFavorites(
                  propertyDataList), // دالة async لجلب الحجوزات
              builder: (context, futureSnapshot) {
                if (futureSnapshot.connectionState == ConnectionState.waiting) {
                  return const LoadingDiscreteCircular(
                      margin: EdgeInsets.only(
                          top: 100)); // إظهار تحميل أثناء جلب الحجوزات
                }

                if (futureSnapshot.hasError) {
                  return Center(
                      child: Text(
                          "حدث خطأ أثناء جلب الحجوزات: ${futureSnapshot.error}"));
                }

                final properties = futureSnapshot.data ?? [];

                return RefreshIndicator(
                  onRefresh: () async {
                    await favCtr.loadFavoritesOnce();
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        FadeInWidget(
                          child: Text(
                            "مفضلتي",
                            style: GoogleFonts.cairo(
                                fontSize: 22, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(height: 8),
                        FadeInWidget(
                          delay: const Duration(milliseconds: 200),
                          child: Text(
                            "العقارات التي أضفتها إلى قائمتك المفضلة",
                            style: GoogleFonts.cairo(
                                fontSize: 16, color: Colors.grey),
                          ),
                        ),
                        const SizedBox(height: 24),
                        AnimationLimiter(
                          child: GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: properties.length,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                              childAspectRatio: 0.5,
                            ),
                            itemBuilder: (context, index) {
                              final property = properties[index];
                              return AnimationConfiguration.staggeredGrid(
                                position: index,
                                columnCount: 2,
                                duration: const Duration(milliseconds: 500),
                                child: SlideAnimation(
                                  verticalOffset: 50.0,
                                  child: FadeInAnimation(
                                    child: PropertyCard(property: property),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );
      }),
    );
  }

  Future<List<Map<String, dynamic>>> _loadBookingsForFavorites(
      List<Map<String, dynamic>> propertyDataList) async {
    try {
      // جمع futures لجلب subcollections للعقارات الإيجار فقط (موازيًا)
      final List<Future<void>> bookingFutures = [];

      for (final prop in propertyDataList) {
        if (isRentMap(prop)) {
          final propertyId = prop['id'];
          final future = FirebaseFirestore.instance
              .collection('properties')
              .doc(propertyId)
              .collection('bookings')
              .get()
              .then((bookingSnap) {
            final periods = bookingSnap.docs.map((bookingDoc) {
              return bookingDoc.data();
            }).toList();

            prop['booked_periods'] =
                periods; // إضافة الفترات للتوافق مع analyzeProperty إذا كانت تستخدمها
          });
          bookingFutures.add(future);
        }
      }

      // انتظر الجلب الموازي
      await Future.wait(bookingFutures);

      // الآن، قم بتحليل كل عقار بعد إضافة الحجوزات
      final analyzedProperties =
          propertyDataList.map((data) => analyzeProperty(data)).toList();

      return analyzedProperties;
    } catch (e) {
      // معالجة الخطأ، مثل إرجاع قائمة فارغة أو تسجيل
      print("خطأ في جلب الحجوزات: $e");
      return [];
    }
  }
}
