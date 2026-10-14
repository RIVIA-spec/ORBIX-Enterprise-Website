import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class ClearFilterButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool enabled;
  final String label;

  const ClearFilterButton({
    super.key,
    required this.onPressed,
    required this.enabled,
    this.label = "إزالة الفلتر",
  });

  @override
  Widget build(BuildContext context) {
    final gradientStart = Colors.red.shade50;
    final gradientEnd = Colors.red.shade100;

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 350),
      opacity: enabled ? 1 : 0,
      curve: Curves.easeOutCubic,
      child: GestureDetector(
        onTap: enabled ? onPressed : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.only(top: 10),
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.red.shade200.withOpacity(enabled ? 0.35 : 0.12),
                blurRadius: enabled ? 24 : 8,
                offset: const Offset(0, 6),
              ),
            ],
            border: Border.all(
              color: Colors.red.shade200.withOpacity(0.35),
              width: 1.0,
            ),
            gradient: LinearGradient(
              colors: [gradientStart, gradientEnd],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned.fill(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
                    child: Container(
                      color: Colors.white.withOpacity(0.03),
                    ),
                  ),
                ),
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: enabled ? onPressed : null,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.backspace_rounded,
                            color: Colors.red.shade700,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              label,
                              textAlign: TextAlign.center,
                              textDirection: TextDirection.rtl,
                              style: GoogleFonts.cairo(
                                color: Colors.red.shade700,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
