import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/features/hotel_section/view/hotel_details_screen.dart';

class HotelCard extends StatelessWidget {
  final Map<String, dynamic> hotel;

  const HotelCard({super.key, required this.hotel});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Get.to(() => HotelDetailsScreen(hotel: hotel)),
      borderRadius: BorderRadius.circular(15),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Card(
          elevation: 4,
          shadowColor: Colors.black.withOpacity(0.07),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // صورة الفندق
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                    child: SizedBox(
                      height: 140,
                      width: double.infinity,
                      child: Image.network(
                        hotel['mainImage'] ?? hotel['images']?[0] ?? '',
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey[300],
                          child: const Icon(Icons.hotel, color: Colors.grey, size: 40),
                        ),
                      ),
                    ),
                  ),
                  // تاج الفندق
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.purple.shade600,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.hotel, color: Colors.white, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            "فندق",
                            style: GoogleFonts.cairo(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // إشارة مميز
                  if (hotel['isDistinct'] == true)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade600,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: Text(
                          "مميز",
                          style: GoogleFonts.cairo(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),

              // التفاصيل
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // اسم الفندق
                    Text(
                      hotel['hotel_name'] ?? 'بدون عنوان',
                      style: GoogleFonts.cairo(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 6),

                    // الموقع
                    Row(
                      children: [
                        Icon(Icons.location_on_rounded, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            "${hotel['city'] ?? ''}, ${hotel['country'] ?? ''}",
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 8),

                    // معلومات أنواع الغرف والعدد الإجمالي
                    FutureBuilder<QuerySnapshot>(
                      future: FirebaseFirestore.instance
                          .collection('hotels')
                          .doc(hotel['id'])
                          .collection('room_types')
                          .where('isVisible', isEqualTo: true)
                          .where('status', isEqualTo: 'approved')
                          .get(),
                      builder: (context, snapshot) {
                        if (!snapshot.hasData) {
                          return const SizedBox.shrink();
                        }

                        final roomTypes = snapshot.data!.docs;
                        int totalRooms = 0;
                        int availableRooms = 0;
                        List<String> roomTypeNames = [];

                        for (var doc in roomTypes) {
                          final data = doc.data() as Map<String, dynamic>;
                          final totalCount = data['total_count'] ?? 0;
                          final availableCount = data['available_count'] ?? 0;
                          totalRooms += totalCount as int;
                          availableRooms += availableCount as int;
                          
                          final title = data['title'] ?? '';
                          if (title.isNotEmpty && !roomTypeNames.contains(title)) {
                            roomTypeNames.add(title);
                          }
                        }

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // أنواع الغرف
                            if (roomTypeNames.isNotEmpty) ...[
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: roomTypeNames.take(3).map((name) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.blue.shade50,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.blue.shade200, width: 1),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.bed, size: 12, color: Colors.blue.shade700),
                                        const SizedBox(width: 4),
                                        Text(
                                          name,
                                          style: GoogleFonts.cairo(
                                            fontSize: 10,
                                            color: Colors.blue.shade900,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                              if (roomTypeNames.length > 3)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    "+${roomTypeNames.length - 3} نوع آخر",
                                    style: GoogleFonts.cairo(
                                      fontSize: 10,
                                      color: Colors.grey[600],
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 6),
                            ],

                            // عدد الغرف الإجمالية (سطر منفصل)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.green.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.green.shade200),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.hotel, size: 12, color: Colors.green.shade700),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      _formatNumber(totalRooms) + " غرفة",
                                      style: GoogleFonts.cairo(
                                        fontSize: 10,
                                        color: Colors.green.shade900,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            
                            const SizedBox(height: 4),
                            
                            // الغرف المتاحة (سطر منفصل)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: availableRooms > 0 
                                    ? Colors.orange.shade50 
                                    : Colors.red.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: availableRooms > 0 
                                      ? Colors.orange.shade200 
                                      : Colors.red.shade200,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    availableRooms > 0 ? Icons.check_circle : Icons.cancel,
                                    size: 12,
                                    color: availableRooms > 0 
                                        ? Colors.orange.shade700 
                                        : Colors.red.shade700,
                                  ),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      _formatNumber(availableRooms) + " متاح",
                                      style: GoogleFonts.cairo(
                                        fontSize: 10,
                                        color: availableRooms > 0 
                                            ? Colors.orange.shade900 
                                            : Colors.red.shade900,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // معلومات ظريفة
                            if (hotel['features'] != null && (hotel['features'] as List).isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 4,
                                runSpacing: 4,
                                children: (hotel['features'] as List).take(2).map((feature) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.purple.shade50,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.star, size: 10, color: Colors.purple.shade700),
                                        const SizedBox(width: 3),
                                        Text(
                                          feature.toString(),
                                          style: GoogleFonts.cairo(
                                            fontSize: 9,
                                            color: Colors.purple.shade900,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // دالة لتنسيق الأعداد الكبيرة (إضافة فواصل للألوف)
  String _formatNumber(int number) {
    if (number < 1000) {
      return number.toString();
    }
    
    // للأعداد الكبيرة، نستخدم تنسيق بسيط
    String numStr = number.toString();
    
    // إضافة فواصل كل 3 أرقام من اليمين
    String formatted = '';
    int count = 0;
    for (int i = numStr.length - 1; i >= 0; i--) {
      if (count == 3) {
        formatted = ',' + formatted;
        count = 0;
      }
      formatted = numStr[i] + formatted;
      count++;
    }
    
    return formatted;
  }
}

