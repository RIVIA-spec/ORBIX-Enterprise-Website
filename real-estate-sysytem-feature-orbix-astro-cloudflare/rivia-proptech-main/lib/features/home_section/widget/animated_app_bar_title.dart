

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';

class AnimatedAppBarTitle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final settings = context.dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
        final deltaExtent = settings!.maxExtent - settings.minExtent;
        final t = (1.0 - (settings.currentExtent - settings.minExtent) / deltaExtent).clamp(0.0, 1.0);

        return Stack(
          children: [
            // التدرج الذي ينتشر من المنتصف
            AnimatedContainer(
              duration: const Duration(milliseconds: 600),
              curve: Curves.easeOutCubic,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Color(0xFF1E88E5).withOpacity(t),
                    Color(0xFF1565C0).withOpacity(t),
                  ],
                ),
              ),
            ),

            // العنوان + اللوجو + الأيقونات
            Center(
              child: Opacity(
                opacity: t,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Hero(
                      tag: "app_logo",
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: 
                        Image.asset(
                          "assets/icon/orbix.png", width: 46, height: 46),
                          // SvgPicture.asset(
                          // "assets/icon/rivia-logo-transparent.svg", width: 46, height: 46),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      "Reality Reimagined",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.cairo(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}