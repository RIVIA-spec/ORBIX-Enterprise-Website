import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/hotel_section/view/hotel_booking_screen.dart';
import 'package:real_estate_app/features/hotel_section/hotel_controller/hotel_details_controller.dart';
import 'package:real_estate_app/features/property_details_section/controller/comment_controller.dart';
import 'package:real_estate_app/features/property_details_section/controller/rating_controller.dart';
import 'package:real_estate_app/features/property_details_section/widget/build_pro_details_feature.dart';
import 'package:real_estate_app/features/property_details_section/widget/build_section.dart';
import 'package:real_estate_app/features/property_details_section/widget/comment_widget.dart';
import 'package:real_estate_app/features/property_details_section/widget/contact_owner.dart';
import 'package:real_estate_app/features/property_details_section/widget/copy_property_id.dart';
import 'package:real_estate_app/features/property_details_section/widget/panorama_tour_section.dart';
import 'package:real_estate_app/features/property_details_section/widget/rating_widget.dart';
import 'package:real_estate_app/features/hotel_section/view/show_hotel_report_dialog.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_view/add_hotel_view.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';
import 'package:real_estate_app/features/google_maps_section/view/google_maps_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class HotelDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> hotel;
  final HotelDetailsController detailsCtr = Get.put(HotelDetailsController());

  HotelDetailsScreen({super.key, required this.hotel});

  // تنسيق الأرقام الكبيرة
  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    final int num = int.tryParse(number.toString()) ?? 0;
    return num.toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match.group(1)},',
    );
  }

  @override
  Widget build(BuildContext context) {
    final userCtr = Get.find<UserController>();
    Get.put(CommentController());
    Get.put(RatingController());
    
    // جمع الصور
    final List<String> images = [];
    if (hotel['mainImage'] != null) images.add(hotel['mainImage']);
    images.addAll(List<String>.from(hotel['images'] ?? []));
    detailsCtr.images.value = images;

    // تحميل أنواع الغرف
    detailsCtr.loadRoomTypes(hotel['id']);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: CustomAppBar(
          title: "تفاصيل الفندق",
          actions: [
            if (userCtr.isAdmin.value || userCtr.isOwner.value)
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: Colors.white),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onSelected: (value) {
                  if (value == 'edit') {
                    Get.to(() => AddHotelView(hotel: hotel));
                  } else if (value == 'delete') {
                    // TODO: إضافة دالة حذف الفندق
                    showSnackBar(
                      "قريباً",
                      "ميزة حذف الفندق قيد التطوير",
                      backgroundColor: Colors.orange,
                      colorText: Colors.white,
                    );
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: const [
                        Icon(Icons.edit, size: 20, color: Colors.blue),
                        SizedBox(width: 10),
                        Text("تعديل"),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: const [
                        Icon(Icons.delete, size: 20, color: Colors.red),
                        SizedBox(width: 10),
                        Text("حذف"),
                      ],
                    ),
                  ),
                ],
              )
          ],
        ),
        body: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // === الصورة الرئيسية ===
              Obx(
                () => detailsCtr.images.isEmpty
                    ? Container(
                        height: 220,
                        margin: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.image, size: 60, color: Colors.grey),
                      )
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Image.network(
                            detailsCtr.images[detailsCtr.currentImageIndex.value],
                            width: double.infinity,
                            height: 220,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => Container(
                              height: 220,
                              color: Colors.grey[300],
                              child: const Icon(Icons.broken_image, size: 60),
                            ),
                          ),
                        ),
                      ),
              ),
              const SizedBox(height: 12),

              // === الصور المصغرة ===
              Obx(
                () => detailsCtr.images.isEmpty
                    ? const SizedBox.shrink()
                    : SizedBox(
                        height: 80,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          scrollDirection: Axis.horizontal,
                          itemCount: detailsCtr.images.length,
                          itemBuilder: (context, index) {
                            if (index == 0) {
                              return const SizedBox.shrink();
                            }
                            return GestureDetector(
                              onTap: () => detailsCtr.currentImageIndex.value = index,
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 4),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: detailsCtr.currentImageIndex.value == index
                                        ? Colors.blue
                                        : Colors.transparent,
                                    width: 2,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: Image.network(
                                    detailsCtr.images[index],
                                    width: 100,
                                    height: 80,
                                    fit: BoxFit.contain,
                                    errorBuilder: (_, __, ___) => Container(
                                      width: 100,
                                      height: 80,
                                      color: Colors.grey[300],
                                      child: const Icon(Icons.image, size: 30),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
              ),

              const SizedBox(height: 16),

              // === معلومات الاتصال ===
              if (userCtr.isOwner.value || userCtr.isAdmin.value)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ContactOwner(contactNumber: hotel['contact_number']),
                    CopyPropertyId(propertyId: hotel['id'], isHotel: true),
                  ],
                )
              else
                CopyPropertyId(propertyId: hotel['id']),

              const SizedBox(height: 8),

              // === جولة بانوراما 360° ===
              PanoramaTourSection(propertyId: hotel['id']),

              // === معلومات الفندق الأساسية ===
              BuildProDetailsSection(
                title: hotel['hotel_name'] ?? 'بدون عنوان',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        // تاج النوع (فندق)
                        buildTag(
                          text: "فندق",
                          bg: Colors.purple.shade50,
                          border: Colors.purple.shade200,
                          textColor: Colors.purple.shade700,
                        ),
                        const Spacer(),
                        // الموقع
                        BuildProDetailsFeature(
                          icon: Icons.location_on_rounded,
                          label: "${hotel['city']}, ${hotel['country']}",
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // === الوصف ===
              if (hotel['description']?.toString().isNotEmpty == true)
                BuildProDetailsSection(
                  title: "الوصف",
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200, width: 1),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.notes_rounded, size: 20, color: Colors.blue.shade600),
                            const SizedBox(width: 8),
                            Text(
                              "تفاصيل الفندق",
                              style: GoogleFonts.cairo(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Colors.blue.shade700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          hotel['description'] ?? "لا يوجد وصف متاح.",
                          textAlign: TextAlign.start,
                          style: GoogleFonts.cairo(
                            fontSize: 14,
                            height: 1.7,
                            color: Colors.grey.shade800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // === الميزات ===
              if (hotel['features'] != null && (hotel['features'] as List).isNotEmpty)
                BuildProDetailsSection(
                  title: "الميزات",
                  child: Wrap(
                    spacing: 12,
                    runSpacing: 10,
                    children: (hotel['features'] as List).map<Widget>(
                      (f) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.green.shade50,
                              Colors.green.shade100.withOpacity(0.35),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.green.shade200, width: 1),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.green.withOpacity(0.05),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.green.shade100,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.check_rounded,
                                size: 14,
                                color: Colors.green.shade700,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              f,
                              style: GoogleFonts.cairo(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Colors.green.shade800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ).toList(),
                  ),
                ),

              // === القوانين ===
              if (hotel['rules']?.toString().isNotEmpty == true)
                BuildProDetailsSection(
                  title: "القوانين والشروط",
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade100, width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.red.shade100,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.gavel_rounded,
                                  size: 18, color: Colors.red.shade700),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "قوانين الفندق",
                              style: GoogleFonts.cairo(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Colors.red.shade800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          hotel['rules'],
                          style: GoogleFonts.cairo(
                            fontSize: 14,
                            height: 1.7,
                            color: Colors.grey.shade800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // === الموقع ===
              BuildProDetailsSection(
                title: "الموقع",
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade100),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade100,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.location_on_rounded,
                              size: 18,
                              color: Colors.blue.shade700,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "تفاصيل الموقع",
                            style: GoogleFonts.cairo(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.blue.shade800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      BuildProDetailsFeature(
                        icon: Icons.public_rounded,
                        label: hotel['country'] ?? 'غير محدد',
                      ),
                      const SizedBox(height: 10),
                      BuildProDetailsFeature(
                        icon: Icons.location_city_rounded,
                        label: hotel['city'] ?? 'غير محدد',
                      ),
                      const SizedBox(height: 10),
                      GestureDetector(
                        onTap: () {
                          // فتح الخريطة لعرض الموقع
                          final latitude = hotel['latitude'];
                          final longitude = hotel['longitude'];
                          
                          if (latitude != null && longitude != null) {
                            final lat = double.tryParse(latitude.toString());
                            final lng = double.tryParse(longitude.toString());
                            
                            if (lat != null && lng != null) {
                              Get.to(() => LocationPickerPage(
                                    latitude: lat,
                                    longitude: lng,
                                    showing: true, // وضع العرض فقط
                                  ));
                            } else {
                              showSnackBar(
                                "خطأ",
                                "إحداثيات الموقع غير صحيحة",
                                backgroundColor: Colors.orange,
                                colorText: Colors.white,
                              );
                            }
                          } else {
                            showSnackBar(
                              "تنبيه",
                              "لا يوجد موقع محدد للفندق",
                              backgroundColor: Colors.orange,
                              colorText: Colors.white,
                            );
                          }
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.blue.shade700,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 2,
                                offset: Offset(0, 1),
                              ),
                            ],
                          ),
                          padding: EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.pin_drop_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  hotel['address'] ?? 'غير محدد',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // === أنواع الغرف ===
              BuildProDetailsSection(
                title: "أنواع الغرف المتاحة",
                child: Obx(
                  () => detailsCtr.isLoadingRoomTypes.value
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20.0),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      : detailsCtr.roomTypes.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Text(
                                "لا توجد أنواع غرف متاحة حالياً",
                                style: GoogleFonts.cairo(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                                textAlign: TextAlign.center,
                              ),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: detailsCtr.roomTypes.length,
                              itemBuilder: (context, index) {
                                final roomType = detailsCtr.roomTypes[index];
                                return _buildRoomTypeCard(roomType);
                              },
                            ),
                ),
              ),

              // === تعليقات الزوار ===
              CommentWidget(property: hotel, isHotel: true),

              const SizedBox(height: 12),

              // === التقييمات ===
              RatingWidget(property: hotel),

              const SizedBox(height: 16),

              // === زر الإبلاغ ===
              Center(
                child: OutlinedButton.icon(
                  onPressed: () {
                    showHotelReportDialog(hotel);
                  },
                  icon: const Icon(Icons.flag_outlined, color: Colors.redAccent),
                  label: Text(
                    "الإبلاغ عن هذا الفندق",
                    style: GoogleFonts.cairo(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.redAccent, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    backgroundColor: Colors.red.shade50.withOpacity(0.3),
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoomTypeCard(Map<String, dynamic> roomType) {
    final availableCount = roomType['available_count'] ?? 0;
    final totalCount = roomType['total_count'] ?? 0;
    final isAvailable = availableCount > 0;
    final roomTypeId = roomType['id'];
    final hotelId = hotel['id'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAvailable ? Colors.green.shade200 : Colors.grey.shade300,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // الصورة الرئيسية
          if (roomType['mainImage'] != null)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: Image.network(
                roomType['mainImage'],
                width: double.infinity,
                height: 180,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 180,
                  color: Colors.grey[300],
                  child: const Icon(Icons.image, size: 50),
                ),
              ),
            ),
          
          // الصور الإضافية (إذا كانت موجودة)
          if (roomType['images'] != null && (roomType['images'] as List).isNotEmpty)
            _buildRoomImagesGallery(
              (roomType['images'] as List).map((e) => e.toString()).toList(),
            ),
          
          // جولة البانوراما
          _buildRoomPanoramaTour(hotelId, roomTypeId),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // العنوان
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        roomType['title'] ?? 'نوع غرفة',
                        style: GoogleFonts.cairo(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                    ),
                    // حالة التوفر
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isAvailable ? Colors.green.shade50 : Colors.red.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isAvailable ? Colors.green.shade300 : Colors.red.shade300,
                        ),
                      ),
                      child: Text(
                        isAvailable ? "متاح" : "غير متاح",
                        style: GoogleFonts.cairo(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isAvailable ? Colors.green.shade700 : Colors.red.shade700,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // الوصف
                if (roomType['description']?.toString().isNotEmpty == true)
                  Text(
                    roomType['description'],
                    style: GoogleFonts.cairo(
                      fontSize: 14,
                      color: Colors.grey[700],
                      height: 1.5,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                const SizedBox(height: 12),

                // المميزات الأساسية
                Wrap(
                  spacing: 10,
                  runSpacing: 8,
                  children: [
                    if (roomType['area'] != null)
                      BuildProDetailsFeature(
                        icon: Icons.square_foot_rounded,
                        label: "${roomType['area']} ${roomType['area_unit'] ?? 'م²'}",
                      ),
                    if (roomType['bedrooms'] != null)
                      BuildProDetailsFeature(
                        icon: Icons.bed_rounded,
                        label: "${roomType['bedrooms']} غرفة",
                      ),
                    if (roomType['bathrooms'] != null)
                      BuildProDetailsFeature(
                        icon: Icons.bathtub_rounded,
                        label: "${roomType['bathrooms']} حمام",
                      ),
                  ],
                ),

                // الميزات الإضافية
                if (roomType['features'] != null && (roomType['features'] as List).isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.shade200, width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.star_rounded, size: 18, color: Colors.green.shade700),
                            const SizedBox(width: 6),
                            Text(
                              "ميزات الغرفة",
                              style: GoogleFonts.cairo(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.green.shade800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: (roomType['features'] as List).map<Widget>(
                            (f) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.green.shade50,
                                    Colors.green.shade100.withOpacity(0.4),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.green.shade200, width: 1),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.green.withOpacity(0.05),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: Colors.green.shade100,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.check_rounded,
                                      size: 12,
                                      color: Colors.green.shade700,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    f.toString(),
                                    style: GoogleFonts.cairo(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.green.shade800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ).toList(),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 12),

                // الأسعار
                Row(
                  children: [
                    if (roomType['daily_price']?.toString().isNotEmpty == true)
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.blue.shade200),
                          ),
                          child: Column(
                            children: [
                              Text(
                                "يومي",
                                style: GoogleFonts.cairo(
                                  fontSize: 11,
                                  color: Colors.blue.shade700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "${_formatNumber(roomType['daily_price'])} ${roomType['daily_price_currency'] ?? ''}",
                                style: GoogleFonts.cairo(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue.shade900,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    if (roomType['daily_price']?.toString().isNotEmpty == true &&
                        roomType['nightly_price']?.toString().isNotEmpty == true)
                      const SizedBox(width: 8),
                    if (roomType['nightly_price']?.toString().isNotEmpty == true)
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.purple.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.purple.shade200),
                          ),
                          child: Column(
                            children: [
                              Text(
                                "ليلي",
                                style: GoogleFonts.cairo(
                                  fontSize: 11,
                                  color: Colors.purple.shade700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "${_formatNumber(roomType['nightly_price'])} ${roomType['nightly_currency'] ?? ''}",
                                style: GoogleFonts.cairo(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.purple.shade900,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                // عدد الغرف المتاحة
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.hotel, size: 18, color: Colors.orange.shade700),
                      const SizedBox(width: 8),
                      Text(
                        "متاح: $availableCount من $totalCount",
                        style: GoogleFonts.cairo(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.orange.shade900,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // زر الحجز
                CustomButton(
                  text: isAvailable ? "احجز الآن" : "غير متاح",
                  height: 56,
                  borderRadius: 12,
                  fontSize: 16,
                  backgroundColor: isAvailable ? Colors.green : Colors.grey,
                  leadingIcon: Icons.hotel,
                  onPressed: isAvailable
                      ? () {
                          Get.to(() => HotelBookingScreen(
                                hotel: hotel,
                                roomType: roomType,
                              ));
                        }
                      : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildTag({
    required String text,
    required Color bg,
    required Color border,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border, width: 1.5),
      ),
      child: Text(
        text,
        style: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  // عرض معرض الصور الإضافية للغرفة
  Widget _buildRoomImagesGallery(List<String> images) {
    if (images.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "صور إضافية",
            style: GoogleFonts.cairo(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: () {
                    // فتح معرض الصور
                    _showImageGallery(images, index);
                  },
                  child: Container(
                    width: 100,
                    margin: const EdgeInsets.only(left: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        images[index],
                        width: 100,
                        height: 100,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 100,
                          height: 100,
                          color: Colors.grey[300],
                          child: const Icon(Icons.image, size: 30),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // عرض جولة البانوراما للغرفة
  Widget _buildRoomPanoramaTour(String hotelId, String roomTypeId) {
    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance
          .collection('hotels')
          .doc(hotelId)
          .collection('room_types')
          .doc(roomTypeId)
          .collection('panorama_tour')
          .doc('main')
          .get(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || !snapshot.data!.exists) {
          return const SizedBox.shrink();
        }

        final data = snapshot.data!.data() as Map<String, dynamic>?;
        if (data == null) return const SizedBox.shrink();

        final List panoramas = data['images'] ?? [];
        if (panoramas.isEmpty) return const SizedBox.shrink();

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "جولة بانوراما 360°",
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 110,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: panoramas.length,
                  itemBuilder: (context, index) {
                    final img = panoramas[index];
                    final name = img['name'] ?? 'غرفة ${index + 1}';
                    final imgUrl = img['url'] ?? '';

                    if (imgUrl.isEmpty) return const SizedBox.shrink();

                    return GestureDetector(
                      onTap: () {
                        Get.to(() => PanoramaViewerScreen(
                              panoramas: panoramas,
                              startIndex: index,
                            ));
                      },
                      child: Container(
                        width: 110,
                        margin: const EdgeInsets.only(left: 8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Stack(
                            children: [
                              Image.network(
                                imgUrl,
                                width: 110,
                                height: 110,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 110,
                                  height: 110,
                                  color: Colors.grey[300],
                                  child: const Icon(Icons.image, size: 30),
                                ),
                              ),
                              Positioned(
                                bottom: 0,
                                child: Container(
                                  width: 110,
                                  color: Colors.black.withOpacity(0.6),
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Text(
                                    name,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.cairo(
                                      color: Colors.white,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ),
                              // أيقونة 360
                              Positioned(
                                top: 4,
                                right: 4,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade700,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.threesixty,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // عرض معرض الصور في صفحة منفصلة
  void _showImageGallery(List<String> images, int initialIndex) {
    Get.to(() => _ImageGalleryScreen(images: images, initialIndex: initialIndex));
  }
}

// شاشة معرض الصور
class _ImageGalleryScreen extends StatelessWidget {
  final List<String> images;
  final int initialIndex;

  const _ImageGalleryScreen({
    required this.images,
    required this.initialIndex,
  });

  @override
  Widget build(BuildContext context) {
    final PageController pageController = PageController(initialPage: initialIndex);
    final RxInt currentIndex = initialIndex.obs;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black54,
          title: Obx(() => Text(
                'صورة ${currentIndex.value + 1} من ${images.length}',
                style: GoogleFonts.cairo(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              )),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => safeBack(),
          ),
        ),
        body: PageView.builder(
          controller: pageController,
          itemCount: images.length,
          onPageChanged: (index) => currentIndex.value = index,
          itemBuilder: (context, index) {
            return Center(
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Image.network(
                  images[index],
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Center(
                    child: Icon(Icons.broken_image, color: Colors.white, size: 60),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
