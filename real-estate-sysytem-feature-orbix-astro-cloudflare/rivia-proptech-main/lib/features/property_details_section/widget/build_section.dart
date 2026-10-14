// lib/features/property_details_scetion/widget/build_section.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class BuildProDetailsSection extends StatelessWidget {
  final String title;
  final Widget child;
  final IconData? icon;
  final Color? color;

  const BuildProDetailsSection({
    super.key,
    required this.title,
    required this.child,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: (color ?? Colors.blue).withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: color ?? Colors.blue.shade700, size: 26),
                ),
                const SizedBox(width: 14),
              ],
              Text(
                title,
                style: GoogleFonts.cairo(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Divider(color: Colors.grey.shade200, thickness: 1.2),
          const SizedBox(height: 20),
          DefaultTextStyle(
            style: GoogleFonts.cairo(fontSize: 15.5, height: 1.7, color: Colors.grey[800]),
            child: child,
          ),
        ],
      ),
    );
  }
}