import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';

class CopyPropertyId extends StatelessWidget {
  const CopyPropertyId({super.key, required this.propertyId,
    this.isHotel = false,
  });

  final String propertyId;  
  final bool isHotel;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        child: OutlinedButton.icon(
          onPressed: () {
            Clipboard.setData(ClipboardData(text: propertyId));
            showSnackBar(
              "تم النسخ",
              "معرف العقار: $propertyId",
              backgroundColor: Colors.green.shade600,
              colorText: Colors.white,
              snackPosition: SnackPosition.BOTTOM,
              margin: const EdgeInsets.all(16),
              borderRadius: 12,
              icon: const Icon(Icons.check_circle, color: Colors.white),
              duration: const Duration(seconds: 2),
            );
          },
          icon: const Icon(Icons.copy, size: 16),
          label: Text(
            isHotel ? "نسخ معرف الفندق" : "نسخ معرف العقار",
            style: GoogleFonts.cairo(
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.blue.shade700,
            side: BorderSide(color: Colors.blue.shade300, width: 1.2),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12), // ← أقل انحناء
            ),
            backgroundColor: Colors.blue.shade50.withOpacity(0.2),
          ),
        ),
      ),
    );
  }
}