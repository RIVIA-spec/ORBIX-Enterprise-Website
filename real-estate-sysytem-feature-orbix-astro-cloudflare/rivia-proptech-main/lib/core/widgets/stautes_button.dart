import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StatusButton extends StatelessWidget {
  final String text;
  final String type;

  const StatusButton({super.key, required this.text, required this.type});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (type) {
      case "مؤكدة":
        color = Colors.blueAccent;
        break;
      case "قيد الانتظار":
        color = Colors.indigo;
        break;
      case "مسودة":
        color = Colors.grey;
        break;
      case "نشط":
        color = Colors.blue;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: GoogleFonts.cairo(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
