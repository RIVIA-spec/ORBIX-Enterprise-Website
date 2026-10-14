// lib/features/home_section/controller/home_controller.dart
import 'dart:async';
import 'dart:developer' as dev;
import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:real_estate_app/core/controller/favorites_controller.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class HomeController extends GetxController {
  var featuredProperties = <Map<String, dynamic>>[].obs;
  var latestProperties = <Map<String, dynamic>>[].obs;
  var hotels = <Map<String, dynamic>>[].obs;
  var mixedItems =
      <Map<String, dynamic>>[].obs; // قائمة مختلطة من العقارات والفنادق
  var searchResults = <Map<String, dynamic>>[].obs;
  var allProperties =
      <Map<String, dynamic>>[].obs; // جديد: لتخزين جميع العقارات قبل الفلتر
  var allHotels =
      <Map<String, dynamic>>[].obs; // لتخزين جميع الفنادق قبل الفلتر
  var isLoading = false.obs;
  var isLoadingHotels = false.obs;
  var searchQuery = ''.obs;
  var isSearching = false.obs;
  var isFilterApplied = false.obs; // جديد: للتحقق من وجود فلتر مطبق
  final searchController = TextEditingController();
  Timer? _refreshTimer;
  var isSilverAppBarCollapsed = true.obs;

  // متغيرات لعرض العناصر
  var displayedMixedItemsCount =
      8.obs; // عدد العناصر المعروضة في قسم العقارات والفنادق
  var displayedHotelsCount =
      4.obs; // عدد الفنادق المعروضة (القيمة الافتراضية: 4)

  // متغيرات الفلتر الجديدة
  var propertyCategories = <Map<String, dynamic>>[].obs;
  var features = <String>[].obs;
  var selectedPropertyTypes = <String>[].obs; // e.g., ['بيع', 'إيجار']
  var selectedCategoryIds = <String>[].obs;
  var selectedFeatures = <String>[].obs;
  var featuresFilterMode = 'OR'.obs; // 'OR' or 'AND'
  var userLocation = Rxn<LatLng>(); // موقع المستخدم الحالي
  var maxDistanceKm = 10.0.obs; // المسافة القصوى (0 = إيقاف الفلتر)
  var isLocationFilterEnabled = false.obs; // هل الفلتر مفعّل؟

  final favoritesCtr = Get.put(FavoritesController());

  double _calculateDistance(LatLng p1, LatLng p2) {
    const double earthRadius = 6371; // km

    final double dLat = (p2.latitude - p1.latitude) * (pi / 180);
    final double dLon = (p2.longitude - p1.longitude) * (pi / 180);

    final double lat1 = p1.latitude * (pi / 180);
    final double lat2 = p2.latitude * (pi / 180);

    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);

    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadius * c;
  }

  @override
  void onInit() async {
    super.onInit();
    loadPropertyCategories();
    loadFeaturesData();
    loadData();
    loadHotels();
    startPeriodicUpdates(); // للتحديث الفوري

    await favoritesCtr.loadFavoritesOnce();
  }

  Future<void> loadPropertyCategories() async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('property_category')
          .orderBy('created_at')
          .get();

      propertyCategories.assignAll(snapshot.docs.map((doc) {
        return {
          'id': doc.id,
          'title': doc.data()['title'] ?? 'غير محدد',
        };
      }).toList());
    } catch (e) {
      dev.log("خطأ في جلب فئات العقارات: $e");
    }
  }

  Future<void> loadFeaturesData() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('features')
          .doc('global')
          .get();

      features.value = List<String>.from(doc.data()?['list'] ?? []);
    } catch (e) {
      dev.log("خطأ في جلب الميزات: $e");
    }
  }

  Future<void> loadData({
    bool? withOutLoading,
  }) async {
    if (withOutLoading != true) isLoading.value = true;
    try {
      final snap = await FirebaseFirestore.instance
          .collection('properties')
          .where('isVisible', isEqualTo: true)
          .get();

      final List<Map<String, dynamic>> allProps = snap.docs.map((doc) {
        final data = normalizePropertyMap(doc.data(), id: doc.id);

        // --- تحليل الحالة الأساسية (بدون حجوزات) ---
        final isRent = isRentMap(data);
        final isSale = isSaleMap(data);

        // 1. إذا بيع → تحقق من isSold
        if (isSale) {
          bool isSold = data['isSold'] ?? false;
          if (isSold == false) {
            data['isSold'] = 'متاح';
            data['statusColor'] = Colors.green;
          }
        }

        // 2. إذا إيجار → ضبط مؤقت (سيتم تحديثه لاحقًا)
        else if (isRent) {
          data['book_status'] =
              "جاري التحقق..."; // placeholder للدلالة على الانتظار
          data['statusColor'] = Colors.grey; // لون رمادي مؤقت
        }

        // إذا نوع آخر → افتراضي
        else {
          data['book_status'] = "متاح";
          data['statusColor'] = Colors.green;
        }

        return data;
      }).toList();

      // allProperties.value = [...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps, ...allProps]; // حفظ الجميع قبل الفلتر
      allProperties.value = allProps; // حفظ الجميع قبل الفلتر
      // allProperties.value += allProperties.value;
      await applyFilters(); // تطبيق الفلتر تلقائيًا

      // بعد الانتهاء، استدعاء الدالة الثانية لجلب الحجوزات في الخلفية
      loadBookingsForProperties(allProperties);
    } catch (e, s) {
      dev.log("خطأ في جلب العقارات", error: e, stackTrace: s);
      featuredProperties.clear();
      latestProperties.clear();
      allProperties.clear();
    } finally {
      if (withOutLoading != true) isLoading.value = false;
    }
  }

  // دالة لتطبيق الفلتر على الفنادق
  Future<void> applyFiltersToHotels() async {
    var filteredHotels = allHotels.toList();

    // 0. فلتر الفئة (إذا كانت هناك فئات محددة ولكن "فنادق" غير محدد، نخفي الفنادق)
    if (selectedCategoryIds.isNotEmpty &&
        !selectedCategoryIds.contains('hotels')) {
      // إذا كانت هناك فئات محددة ولكن "فنادق" غير محدد، نخفي الفنادق
      filteredHotels = [];
    }

    // 1. فلتر الميزات (البحث في ميزات الفندق وميزات أنواع الغرف)
    if (selectedFeatures.isNotEmpty) {
      final List<Map<String, dynamic>> hotelsWithMatchingFeatures = [];

      for (var hotel in filteredHotels) {
        bool matches = false;

        // البحث في ميزات الفندق نفسه
        final hotelFeatures = (hotel['features'] as List<dynamic>? ?? [])
            .map((f) => f.toString().trim())
            .toSet();

        if (featuresFilterMode.value == 'OR') {
          matches = selectedFeatures.any((sf) => hotelFeatures.contains(sf));
        } else {
          matches = selectedFeatures.every((sf) => hotelFeatures.contains(sf));
        }

        // إذا لم يطابق من ميزات الفندق، ابحث في أنواع الغرف
        if (!matches) {
          try {
            final roomTypesSnapshot = await FirebaseFirestore.instance
                .collection('hotels')
                .doc(hotel['id'])
                .collection('room_types')
                .where('isVisible', isEqualTo: true)
                .where('status', isEqualTo: 'approved')
                .get();

            for (var roomTypeDoc in roomTypesSnapshot.docs) {
              final roomTypeData = roomTypeDoc.data();
              final roomFeatures =
                  (roomTypeData['features'] as List<dynamic>? ?? [])
                      .map((f) => f.toString().trim())
                      .toSet();

              if (featuresFilterMode.value == 'OR') {
                if (selectedFeatures.any((sf) => roomFeatures.contains(sf))) {
                  matches = true;
                  break;
                }
              } else {
                if (selectedFeatures.every((sf) => roomFeatures.contains(sf))) {
                  matches = true;
                  break;
                }
              }
            }
          } catch (e) {
            dev.log("خطأ في جلب أنواع الغرف للفندق ${hotel['id']}: $e");
          }
        }

        if (matches) {
          hotelsWithMatchingFeatures.add(hotel);
        }
      }

      filteredHotels = hotelsWithMatchingFeatures;
    }

    // 2. فلتر المسافة (إذا مفعّل وفيه موقع)
    if (isLocationFilterEnabled.value &&
        userLocation.value != null &&
        maxDistanceKm.value > 0) {
      final userLatLng = userLocation.value!;
      filteredHotels = filteredHotels.where((h) {
        final lat = double.tryParse(h['latitude']?.toString() ?? '');
        final lng = double.tryParse(h['longitude']?.toString() ?? '');
        if (lat == null || lng == null) return false;
        final hotelLatLng = LatLng(lat, lng);
        final distance = _calculateDistance(userLatLng, hotelLatLng);
        return distance <= maxDistanceKm.value;
      }).toList();
    }

    // تحديث قائمة الفنادق
    hotels.value = filteredHotels
      ..sort((a, b) {
        if (a['created_at'] == null || b['created_at'] == null) return 0;
        final timeA = (a['created_at'] as Timestamp).toDate();
        final timeB = (b['created_at'] as Timestamp).toDate();
        return timeB.compareTo(timeA);
      });
  }

  // دالة لتطبيق الفلتر على allProperties
  Future<void> applyFilters() async {
    var filtered = allProperties.toList();

    // 0. إذا كان "فنادق" فقط محدد (بدون فئات أخرى)، نخفي جميع العقارات
    final hasHotelsOnly = selectedCategoryIds.contains('hotels') &&
        selectedCategoryIds.length == 1;
    if (hasHotelsOnly) {
      filtered = [];
    } else {
      // 1. فلتر نوع العقار
      if (selectedPropertyTypes.isNotEmpty) {
        filtered = filtered
            .where((p) => selectedPropertyTypes
                .contains(normalizePropertyMap(p)['property_type']))
            .toList();
      }

      // 2. فلتر الفئة (إذا كان "فنادق" محدد مع فئات أخرى، نفلتر حسب الفئات فقط)
      final categoryIdsWithoutHotels =
          selectedCategoryIds.where((id) => id != 'hotels').toList();
      if (categoryIdsWithoutHotels.isNotEmpty) {
        filtered = filtered
            .where((p) =>
                categoryIdsWithoutHotels.contains(p['property_category_id']))
            .toList();
      }

      // 3. فلتر الميزات
      if (selectedFeatures.isNotEmpty) {
        filtered = filtered.where((p) {
          final propFeatures = (p['features'] as List<dynamic>? ?? [])
              .map((f) => f.toString().trim())
              .toSet();
          return featuresFilterMode.value == 'OR'
              ? selectedFeatures.any((sf) => propFeatures.contains(sf))
              : selectedFeatures.every((sf) => propFeatures.contains(sf));
        }).toList();
      }

      // 4. فلتر المسافة (إذا مفعّل وفيه موقع)
      if (isLocationFilterEnabled.value &&
          userLocation.value != null &&
          maxDistanceKm.value > 0) {
        final userLatLng = userLocation.value!;
        filtered = filtered.where((p) {
          final lat = double.tryParse(p['latitude'].toString());
          final lng = double.tryParse(p['longitude'].toString());
          if (lat == null || lng == null) return false;
          final propertyLatLng = LatLng(lat, lng);
          final distance = _calculateDistance(userLatLng, propertyLatLng);
          return distance <= maxDistanceKm.value;
        }).toList();
      }
    }

    // تحديث القوائم
    // جلب العقارات المميزة (استبعادها من latestProperties)
    final featuredProps =
        filtered.where((p) => p['isDistinct'] == true).toList();

    // العقارات غير المميزة فقط (لتجنب التكرار)
    latestProperties.value = filtered
        .where((p) => p['isDistinct'] != true && p['created_at'] != null)
        .toList()
      ..sort((a, b) => (b['created_at'] as Timestamp)
          .compareTo(a['created_at'] as Timestamp));

    // تطبيق الفلاتر على الفنادق أيضاً
    await applyFiltersToHotels();

    // جلب الفنادق المميزة
    final featuredHotels =
        hotels.where((h) => h['isDistinct'] == true).toList();

    // دمج العقارات والفنادق المميزة وترتيبها حسب التاريخ من الأحدث للأقدم
    final List<Map<String, dynamic>> allFeatured = [];

    // إضافة العقارات المميزة
    for (var prop in featuredProps) {
      allFeatured.add({
        ...prop,
        'item_type': 'property',
      });
    }

    // إضافة الفنادق المميزة
    for (var hotel in featuredHotels) {
      allFeatured.add({
        ...hotel,
        'item_type': 'hotel',
      });
    }

    // ترتيب حسب التاريخ من الأحدث للأقدم
    allFeatured.sort((a, b) {
      final aDate = a['created_at'] as Timestamp?;
      final bDate = b['created_at'] as Timestamp?;
      if (aDate == null && bDate == null) return 0;
      if (aDate == null) return 1;
      if (bDate == null) return -1;
      return bDate.compareTo(aDate); // الأحدث أولاً
    });

    featuredProperties.value = allFeatured;

    // تحديث حالة الفلتر
    isFilterApplied.value = selectedPropertyTypes.isNotEmpty ||
        selectedCategoryIds.isNotEmpty ||
        selectedFeatures.isNotEmpty ||
        (isLocationFilterEnabled.value && maxDistanceKm.value > 0);

    if (isSearching.value) search(searchQuery.value);
    dev.log(
        "تم تحميل ${featuredProperties.length} مميزة و ${latestProperties.length} حديثة بعد الفلتر");

    // دمج العقارات والفنادق بشكل متناوب
    _mixPropertiesAndHotels();

    // إذا كان البحث نشطًا، أعد البحث مع الفلتر الجديد
    if (isSearching.value) {
      search(searchQuery.value);
    }
  }

  // دالة جديدة: إزالة جميع الفلاتر
  void clearFilters() async {
    selectedPropertyTypes.clear();
    selectedCategoryIds.clear();
    selectedFeatures.clear();
    featuresFilterMode.value = 'OR';
    isLocationFilterEnabled.value = false;
    maxDistanceKm.value = 10.0; // إعادة إلى القيمة الافتراضية
    await applyFilters();
  }

  // دالة جديدة لجلب الحجوزات في الخلفية (بدون isLoading)
  Future<void> loadBookingsForProperties(
      List<Map<String, dynamic>> props) async {
    try {
      // جمع futures للعقارات الإيجار فقط
      final List<Future<void>> bookingFutures = [];

      for (final prop in props) {
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

            prop['booked_periods'] = periods; // إضافة الفترات للتوافق

            final now = DateTime.now();
            DateTime? currentBookingEnd;
            bool isBookedNow = false;

            for (final p in periods) {
              final from = _readBookingDate(p['from']);
              final to = _readBookingDate(p['to']);
              if (from == null || to == null) continue;

              // نضيف يومًا واحدًا للنهاية ليشمل اليوم الأخير كاملاً
              final effectiveEnd = to.add(const Duration(days: 1));

              if ((now.isAfter(from) || now.isAtSameMomentAs(from)) &&
                  now.isBefore(effectiveEnd)) {
                isBookedNow = true;
                if (currentBookingEnd == null ||
                    to.isAfter(currentBookingEnd)) {
                  currentBookingEnd =
                      to; // نعرض تاريخ النهاية الأصلي في الواجهة
                }
              }
            }

            if (isBookedNow && currentBookingEnd != null) {
              prop['book_status'] =
                  "محجوز حتى ${currentBookingEnd.day}/${currentBookingEnd.month}/${currentBookingEnd.year}";
              prop['statusColor'] = Colors.red;
            } else {
              prop['book_status'] = "متاح";
              prop['statusColor'] = Colors.green;
            }
          }).catchError((e) {
            dev.log("خطأ في جلب الحجوزات للعقار $propertyId: $e");
            // prop['book_status'] = "متاح";
            // prop['statusColor'] = Colors.green;
          });

          bookingFutures.add(future);
        }
      }

      // انتظر الجلب الموازي
      await Future.wait(bookingFutures);

      // بعد تحديث جميع الحجوزات، إعادة تطبيق الفلاتر لتحديث featuredProperties و latestProperties
      await applyFilters();

      dev.log("تم تحديث حالة الحجوزات لـ ${bookingFutures.length} عقار");
    } catch (e, s) {
      dev.log("خطأ في جلب الحجوزات", error: e, stackTrace: s);
      // يمكن إضافة fallback هنا، مثل ضبط book_status إلى "خطأ في التحقق"
    }
  }

  Future<void> loadHotels({
    bool? withOutLoading,
  }) async {
    if (withOutLoading != true) isLoadingHotels.value = true;
    try {
      final snap = await FirebaseFirestore.instance
          .collection('hotels')
          .where('isVisible', isEqualTo: true)
          .where('status', isEqualTo: 'approved')
          .get();

      final List<Map<String, dynamic>> loadedHotels = snap.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();

      // حفظ جميع الفنادق قبل الفلتر
      allHotels.value = loadedHotels;
      // allHotels.value = [...loadedHotels, ...loadedHotels, ...loadedHotels, ...loadedHotels, ...loadedHotels, ...loadedHotels, ...loadedHotels, ...loadedHotels, ...loadedHotels, ...loadedHotels];
      // تطبيق الفلاتر على الفنادق
      applyFiltersToHotels();

      // إعادة تعيين عدد الفنادق المعروضة إلى 4 (القيمة الافتراضية)
      displayedHotelsCount.value = 4;

      dev.log(
          "تم تحميل ${loadedHotels.length} فندق (${hotels.length} بعد الفلتر)");
    } catch (e, s) {
      dev.log("خطأ في جلب الفنادق", error: e, stackTrace: s);
      hotels.clear();
    } finally {
      if (withOutLoading != true) isLoadingHotels.value = false;
    }
  }

  // دمج العقارات والفنادق بشكل متناوب
  void _mixPropertiesAndHotels() {
    final List<Map<String, dynamic>> mixed = [];
    final List<Map<String, dynamic>> props = [...latestProperties];

    // استبعاد الفنادق المميزة من الفنادق العادية (لأنها تظهر في featuredProperties)
    final List<Map<String, dynamic>> hots =
        hotels.where((h) => h['isDistinct'] != true).toList();

    int propIndex = 0;
    int hotelIndex = 0;
    bool useProperty = true; // نبدأ بالعقار

    // دمج حتى نفاد أحد القوائم
    while (propIndex < props.length || hotelIndex < hots.length) {
      if (useProperty && propIndex < props.length) {
        final prop = Map<String, dynamic>.from(props[propIndex]);
        prop['item_type'] = 'property'; // إضافة حقل للتمييز
        mixed.add(prop);
        propIndex++;
      } else if (!useProperty && hotelIndex < hots.length) {
        final hotel = Map<String, dynamic>.from(hots[hotelIndex]);
        hotel['item_type'] = 'hotel'; // إضافة حقل للتمييز
        mixed.add(hotel);
        hotelIndex++;
      }

      // التبديل بين العقارات والفنادق
      useProperty = !useProperty;

      // إذا انتهت إحدى القوائم، استمر بالأخرى
      if (propIndex >= props.length && hotelIndex < hots.length) {
        final hotel = Map<String, dynamic>.from(hots[hotelIndex]);
        hotel['item_type'] = 'hotel';
        mixed.add(hotel);
        hotelIndex++;
      } else if (hotelIndex >= hots.length && propIndex < props.length) {
        final prop = Map<String, dynamic>.from(props[propIndex]);
        prop['item_type'] = 'property';
        mixed.add(prop);
        propIndex++;
      }
    }

    mixedItems.value = mixed;

    // إعادة تعيين عدد العناصر المعروضة إلى 8 (القيمة الافتراضية)
    displayedMixedItemsCount.value = 8;
  }

  String formatDate(DateTime date) {
    return "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
  }

  void startPeriodicUpdates() {
    // إلغاء أي مؤقت سابق لتجنب التكرار
    _refreshTimer?.cancel();

    // مؤقت يحدث البيانات كل 5 دقائق
    _refreshTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      loadData(withOutLoading: true);
    });
  }

  // استدعِها عند الخروج من الصفحة أو إغلاق التطبيق
  void stopPeriodicUpdates() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  void search(String query) {
    searchQuery.value = query.trim();
    isSearching.value = query.isNotEmpty;

    if (query.isEmpty) {
      searchResults.clear();
      return;
    }

    final lowerQuery = query.toLowerCase();

    // ابدأ من allProperties المفلترة بالفعل (من applyFilters)
    var baseItems = <Map<String, dynamic>>[];

    // إضافة العقارات (المميزة والعادية)
    baseItems.addAll(featuredProperties.toList());
    baseItems.addAll(latestProperties.toList());

    // إضافة الفنادق (المميزة والعادية)
    // الفنادق المميزة موجودة بالفعل في featuredProperties، لذا نضيف فقط الفنادق العادية
    for (var hotel in hotels) {
      // التحقق من أن الفندق غير موجود بالفعل في featuredProperties
      final hotelId = hotel['id'] as String? ?? '';
      final isAlreadyInFeatured = featuredProperties.any((item) =>
          item['item_type'] == 'hotel' &&
          (item['id'] as String? ?? '') == hotelId);

      if (!isAlreadyInFeatured) {
        final hotelWithType = Map<String, dynamic>.from(hotel);
        hotelWithType['item_type'] = 'hotel';
        baseItems.add(hotelWithType);
      }
    }

    // إزالة التكرار باستخدام Map مع id كمفتاح
    final uniqueMap = <String, Map<String, dynamic>>{};
    for (final item in baseItems) {
      final id = item['id'] as String? ?? '';
      if (id.isNotEmpty) {
        uniqueMap[id] = item;
      }
    }

    final uniqueItems = uniqueMap.values.toList();

    searchResults.assignAll(
      uniqueItems.where((item) {
        final itemType = item['item_type'] ?? 'property';

        // للعقارات: البحث في title و id
        if (itemType == 'property') {
          final title = (item['title'] ?? '').toString().toLowerCase();
          final id = (item['id'] ?? '').toString().toLowerCase();
          return title.contains(lowerQuery) || id.contains(lowerQuery);
        }
        // للفنادق: البحث في hotel_name و id
        else if (itemType == 'hotel') {
          final hotelName = (item['hotel_name'] ?? '').toString().toLowerCase();
          final id = (item['id'] ?? '').toString().toLowerCase();
          return hotelName.contains(lowerQuery) || id.contains(lowerQuery);
        }

        return false;
      }).toList(),
    );
  }

  // @override
  // void onClose() {
  //   // stopPeriodicUpdates();
  //   // searchController.dispose();
  //   super.onClose();
  // }

  DateTime? _readBookingDate(dynamic value) {
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    return null;
  }
}
