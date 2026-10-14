import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/stautes_button.dart';

class dashbordBookingCard extends StatelessWidget {
  final String title;
  final String status;
  final String date;
  final String imagePath;

  const dashbordBookingCard({
    super.key,
    required this.title,
    required this.status,
    required this.date,
    required this.imagePath,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(imagePath,
                  width: 80, height: 80, fit: BoxFit.cover),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: GoogleFonts.cairo(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(date,
                      style: GoogleFonts.cairo(
                          color: Colors.grey[600], fontSize: 14)),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: StatusButton(text: status, type: status),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
