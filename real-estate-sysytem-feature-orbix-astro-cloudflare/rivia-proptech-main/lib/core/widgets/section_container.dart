import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SectionContainer extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final Widget child;
  final Color? color;

  const SectionContainer({
    Key? key,
    this.title,
    this.subtitle,
    required this.child,
    this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade400),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title!,
            style: GoogleFonts.cairo(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.right,
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey),
              textAlign: TextAlign.right,
            ),
          Divider(),
          SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}