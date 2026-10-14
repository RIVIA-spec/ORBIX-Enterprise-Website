import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/favorites_controller.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/property_details_section/view/property_details_screen.dart';

class PropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;
  final isLoadingFavourite = false.obs;

  PropertyCard({super.key, required this.property});

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    final parsed = num.tryParse(number.toString().replaceAll(',', ''));
    if (parsed == null) return number.toString();
    return parsed.round().toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m.group(1)},',
        );
  }

  @override
  Widget build(BuildContext context) {
    final userCtr = Get.find<UserController>();
    final normalized = normalizePropertyMap(property);
    final isRent = isRentMap(normalized);
    final isSale = isSaleMap(normalized);
    final rawPrice = normalizedPropertyPrice(normalized);
    final currency = normalizedPropertyCurrency(normalized) ?? '';
    final priceText = isRent
        ? '${_formatNumber(rawPrice)} $currency / \u064a\u0648\u0645'
        : isSale
            ? '${_formatNumber(rawPrice)} $currency'
            : rawPrice != null
                ? '${_formatNumber(rawPrice)} $currency'
                : '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f';

    return InkWell(
      onTap: () => Get.to(() => PropertyDetailsScreen(property: normalized)),
      borderRadius: BorderRadius.circular(15),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Card(
          elevation: 4,
          shadowColor: Colors.black.withOpacity(0.07),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(15)),
                    child: SizedBox(
                      height: 140,
                      width: double.infinity,
                      child: Image.network(
                        (normalized['mainImage'] ?? '').toString(),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey[300],
                          child: const Icon(Icons.image, color: Colors.grey),
                        ),
                      ),
                    ),
                  ),
                  if (normalized['isDistinct'] == true ||
                      normalized['isFeatured'] == true)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: _tag(
                        text: '\u0645\u0645\u064a\u0632',
                        bg: Colors.amber.shade600,
                        color: Colors.white,
                      ),
                    ),
                  if (userCtr.isLoggedIn.value)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Obx(() {
                        final propertyId =
                            (normalized['id'] ?? normalized['propertyId'] ?? '')
                                .toString();
                        final isFav =
                            FavoritesController.to.isFavorite(propertyId);
                        return CircleAvatar(
                          radius: 18,
                          backgroundColor: Colors.white.withOpacity(0.92),
                          child: IconButton(
                            padding: EdgeInsets.zero,
                            icon: isLoadingFavourite.value
                                ? LoadingThreeArchedCircle(
                                    size: 18,
                                    color: isFav ? Colors.black54 : Colors.red,
                                  )
                                : Icon(
                                    isFav
                                        ? Icons.favorite_rounded
                                        : Icons.favorite_border_rounded,
                                    color: isFav
                                        ? Colors.red
                                        : Colors.grey.shade700,
                                    size: 20,
                                  ),
                            onPressed: () async {
                              isLoadingFavourite.value = true;
                              await FavoritesController.to
                                  .toggleFavorite(propertyId);
                              isLoadingFavourite.value = false;
                            },
                          ),
                        );
                      }),
                    ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (normalized['title'] ??
                              '\u0628\u062f\u0648\u0646 \u0639\u0646\u0648\u0627\u0646')
                          .toString(),
                      style: GoogleFonts.cairo(
                          fontWeight: FontWeight.bold, fontSize: 14),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _tag(
                          text: (normalized['property_category_title'] ??
                                  normalized['propertyType'] ??
                                  normalized['category'] ??
                                  '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f')
                              .toString(),
                          bg: Colors.blue.shade50,
                          color: Colors.blue.shade800,
                        ),
                        const SizedBox(width: 6),
                        _tag(
                          text: normalized['isSold'] == true
                              ? kSoldStatus
                              : (normalized['property_type'] ?? '').toString(),
                          bg: isRent
                              ? Colors.green.shade50
                              : Colors.orange.shade50,
                          color: isRent
                              ? Colors.green.shade800
                              : Colors.orange.shade800,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on_rounded,
                            size: 16, color: Colors.grey.shade600),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '${normalized['city'] ?? ''}, ${normalized['country'] ?? ''}',
                            style: GoogleFonts.cairo(
                                color: Colors.grey.shade600, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.square_foot_rounded,
                            size: 16, color: Colors.grey.shade600),
                        const SizedBox(width: 4),
                        Text(
                          '${normalized['area'] ?? 0} ${normalized['area_unit'] ?? ''}',
                          style: GoogleFonts.cairo(fontSize: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      priceText,
                      style: GoogleFonts.cairo(
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    if (normalized['isSold'] != true) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.info_outline_rounded,
                            size: 14,
                            color: normalized['statusColor'] ?? Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              isRent
                                  ? (normalized['book_status'] ??
                                          kAvailableStatus)
                                      .toString()
                                  : kAvailableStatus,
                              style: GoogleFonts.cairo(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: normalized['statusColor'] ?? Colors.grey,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag({required String text, required Color bg, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Text(
        text,
        style: GoogleFonts.cairo(
            fontSize: 10, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }
}
