import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/business/business_rules.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/image_preview_widget.dart';
import 'package:real_estate_app/features/edit_property_section/view/edit_property_screen.dart';
import 'package:real_estate_app/features/google_maps_section/view/google_maps_screen.dart';
import 'package:real_estate_app/features/property_details_section/controller/comment_controller.dart';
import 'package:real_estate_app/features/property_details_section/controller/property_details_controller.dart';
import 'package:real_estate_app/features/property_details_section/controller/rating_controller.dart';
import 'package:real_estate_app/features/property_details_section/widget/build_pro_details_feature.dart';
import 'package:real_estate_app/features/property_details_section/widget/build_section.dart';
import 'package:real_estate_app/features/property_details_section/widget/comment_widget.dart';
import 'package:real_estate_app/features/property_details_section/widget/contact_owner.dart';
import 'package:real_estate_app/features/property_details_section/widget/copy_property_id.dart';
import 'package:real_estate_app/features/property_details_section/widget/panorama_tour_section.dart';
import 'package:real_estate_app/features/property_details_section/widget/price_and_booking.dart';
import 'package:real_estate_app/features/property_details_section/widget/rating_widget.dart';
import 'package:real_estate_app/features/property_details_section/widget/show_delete_bottom_sheet.dart';
import 'package:real_estate_app/features/property_details_section/widget/show_report_dialog.dart';

class PropertyDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> property;
  final PropertyDetailsController detailsCtr =
      Get.put(PropertyDetailsController());

  PropertyDetailsScreen({super.key, required this.property});

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    final int num = int.tryParse(number.toString()) ?? 0;
    return num.toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match.group(1)},',
    );
  }

  List<String> _collectPropertyImages(Map<String, dynamic> property) {
    final collected = <String>[];

    void addIfValid(dynamic value) {
      final url = value?.toString().trim() ?? '';
      if (url.isEmpty) return;
      if (!url.startsWith('http://') && !url.startsWith('https://')) return;
      if (!collected.contains(url)) {
        collected.add(url);
      }
    }

    addIfValid(property['mainImage']);

    final rawImages = property['images'];
    if (rawImages is List) {
      for (final item in rawImages) {
        if (item is String) {
          addIfValid(item);
        }
      }
    }

    return collected;
  }

  @override
  Widget build(BuildContext context) {
    final normalizedProperty = normalizePropertyMap(this.property);
    final property = normalizedProperty;
    final userCtr = Get.find<UserController>();
    Get.put(CommentController());
    Get.put(RatingController());

    final List<String> images = _collectPropertyImages(normalizedProperty);
    detailsCtr.images.value = images;
    if (detailsCtr.currentImageIndex.value >= images.length) {
      detailsCtr.currentImageIndex.value = 0;
    }

    final String category = normalizedProperty['property_category_title'] ??
        normalizedProperty['category'] ??
        '';
    final String type =
        normalizePropertyType(normalizedProperty['property_type']);
    final bool isRent = isRentProperty(normalizedProperty);
    final bool isSale = isSaleProperty(normalizedProperty);

    final dynamic price = normalizedPropertyPrice(normalizedProperty);
    final String currency = normalizedPropertyCurrency(normalizedProperty) ?? '';

    final String priceText = isRent
        ? "${_formatNumber(price)} $currency / يوم"
        : isSale
            ? "${_formatNumber(price)} $currency"
            : price != null
                ? "${_formatNumber(price)} $currency"
                : "غير محدد";

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: CustomAppBar(
          title: "تفاصيل العقار",
          actions: [
            if (userCtr.isAdmin.value || userCtr.isOwner.value)
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: Colors.white),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onSelected: (value) {
                  if (value == 'edit') {
                    Get.to(() => EditPropertyScreen(proporty: property));
                  } else if (value == 'delete') {
                    showDeleteConfirmationBottomSheet(
                        property['id'], property["ownerId"]);
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit, size: 20, color: Colors.blue),
                        SizedBox(width: 10),
                        Text("تعديل"),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, size: 20, color: Colors.red),
                        SizedBox(width: 10),
                        Text("حذف"),
                      ],
                    ),
                  ),
                ],
              )
            else if (userCtr.userId.value == property['ownerId'])
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: Colors.white),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onSelected: (value) {
                  if (value == 'edit') {
                    Get.to(() => EditPropertyScreen(
                          proporty: property,
                          isPropertyOwner: true,
                        ));
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit, size: 20, color: Colors.blue),
                        SizedBox(width: 10),
                        Text("تعديل"),
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
              Obx(
                () => detailsCtr.images.isEmpty
                    ? Container(
                        height: 220,
                        margin: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.image,
                            size: 60, color: Colors.grey),
                      )
                    : Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: ImagePreviewWidget(
                          imageUrl: detailsCtr
                              .images[detailsCtr.currentImageIndex.value],
                          width: double.infinity,
                          height: 220,
                          fit: BoxFit.contain,
                        ),
                      ),
              ),
              const SizedBox(height: 12),
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
                              onTap: () =>
                                  detailsCtr.currentImageIndex.value = index,
                              child: Container(
                                margin:
                                    const EdgeInsets.symmetric(horizontal: 4),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: detailsCtr.currentImageIndex.value ==
                                            index
                                        ? Colors.blue
                                        : Colors.transparent,
                                    width: 2,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: ImagePreviewWidget(
                                    imageUrl: detailsCtr.images[index],
                                    width: 100,
                                    height: 80,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
              ),
              const SizedBox(height: 16),
              PriceAndBooking(
                isRent: isRent,
                priceText: priceText,
                property: normalizedProperty,
              ),
              if (userCtr.isAdmin.value)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ContactOwner(contactNumber: property['contact_number']),
                    CopyPropertyId(propertyId: property['id']),
                  ],
                )
              else
                CopyPropertyId(propertyId: property['id']),
              const SizedBox(height: 8),
              PanoramaTourSection(propertyId: property['id']),
              BuildProDetailsSection(
                title: property['title'] ?? 'بدون عنوان',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        buildTag(
                          text: type,
                          bg: isRent
                              ? Colors.green.shade50
                              : Colors.orange.shade50,
                          border: isRent
                              ? Colors.green.shade200
                              : Colors.orange.shade200,
                          textColor: isRent
                              ? Colors.green.shade700
                              : Colors.orange.shade700,
                        ),
                        const SizedBox(width: 8),
                        buildTag(
                          text: category,
                          bg: Colors.blue.shade50,
                          border: Colors.blue.shade200,
                          textColor: Colors.blue.shade700,
                        ),
                        const Spacer(),
                        BuildProDetailsFeature(
                          icon: Icons.location_on_rounded,
                          label: "${property['city']}, ${property['country']}",
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 14,
                      runSpacing: 12,
                      children: [
                        BuildProDetailsFeature(
                          icon: Icons.square_foot_rounded,
                          label:
                              "${property['area']} ${property['area_unit'] ?? 'م²'}",
                        ),
                        BuildProDetailsFeature(
                          icon: Icons.bathtub_rounded,
                          label: "${property['bathrooms']} حمام",
                        ),
                        BuildProDetailsFeature(
                          icon: Icons.bed_rounded,
                          label: "${property['bedrooms']} غرفة",
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (property['description']?.toString().isNotEmpty == true)
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
                            Icon(Icons.notes_rounded,
                                size: 20, color: Colors.blue.shade600),
                            const SizedBox(width: 8),
                            Text(
                              "تفاصيل العقار",
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
                          property['description'] ?? "لا يوجد وصف متاح.",
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
              if (property['features'] != null &&
                  (property['features'] as List).isNotEmpty)
                BuildProDetailsSection(
                  title: "المميزات",
                  child: Wrap(
                    spacing: 12,
                    runSpacing: 10,
                    children: (property['features'] as List)
                        .map<Widget>(
                          (f) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
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
                              border: Border.all(
                                  color: Colors.green.shade200, width: 1),
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
                        )
                        .toList(),
                  ),
                ),
              if (property['rules']?.toString().isNotEmpty == true)
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
                              "قوانين العقار",
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
                          property['rules'],
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
              BuildProDetailsSection(
                title: "الموقع",
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.blue.shade200, width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade100,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.location_on_rounded,
                              size: 20,
                              color: Colors.blue.shade800,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            "تفاصيل الموقع",
                            style: GoogleFonts.cairo(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue.shade900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      BuildProDetailsFeature(
                        icon: Icons.public_rounded,
                        label: property['country'] ?? 'غير محدد',
                      ),
                      const SizedBox(height: 10),
                      BuildProDetailsFeature(
                        icon: Icons.location_city_rounded,
                        label: property['city'] ?? 'غير محدد',
                      ),
                      const SizedBox(height: 16),
                      if (property['latitude'] != null &&
                          property['longitude'] != null)
                        GestureDetector(
                          onTap: () {
                            var latitude =
                                double.tryParse(property['latitude']);
                            var longitude =
                                double.tryParse(property['longitude']);
                            if (longitude == null || latitude == null) {
                              showSnackBar(
                                "خطأ",
                                "موقع غير صالح",
                                backgroundColor: Colors.red,
                                colorText: Colors.white,
                              );
                              return;
                            }
                            Get.to(() {
                              return LocationPickerPage(
                                latitude: double.tryParse(property['latitude']),
                                longitude:
                                    double.tryParse(property['longitude']),
                                showing: true,
                              );
                            });
                          },
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                                vertical: 14, horizontal: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color: Colors.blue.shade400, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.blue.shade100.withOpacity(0.6),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade700,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.map_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        property['address']
                                                    ?.toString()
                                                    .isNotEmpty ==
                                                true
                                            ? property['address']
                                            : "عرض الموقع على الخريطة",
                                        style: GoogleFonts.cairo(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.blue.shade900,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        "اضغط لعرض الموقع بدقة",
                                        style: GoogleFonts.cairo(
                                          fontSize: 11,
                                          color: Colors.blue.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  size: 18,
                                  color: Colors.blue.shade700,
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        BuildProDetailsFeature(
                          icon: Icons.pin_drop_rounded,
                          label: property['address'] ?? 'غير محدد',
                        ),
                    ],
                  ),
                ),
              ),
              CommentWidget(property: property),
              const SizedBox(height: 12),
              RatingWidget(property: property),
              const SizedBox(height: 16),
              Center(
                child: OutlinedButton.icon(
                  onPressed: () {
                    showPropertyReportDialog(property);
                  },
                  icon:
                      const Icon(Icons.flag_outlined, color: Colors.redAccent),
                  label: Text(
                    "الإبلاغ عن هذا العقار",
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
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 12),
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
}
