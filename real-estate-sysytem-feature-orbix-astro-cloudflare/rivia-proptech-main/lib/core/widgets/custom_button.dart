// lib/core/widgets/custom_button.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double fontSize;
  final FontWeight fontWeight;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final double height;
  final double? width;
  final double borderRadius;
  RxBool? isLoading;
  final bool isOutlined; // Ø¬Ø¯ÙŠØ¯: Ø²Ø± Ø´ÙØ§Ù Ø¨Ø­Ø¯ÙˆØ¯
  final EdgeInsetsGeometry? padding;
  final Color? borderColor;
  final String? loadingText;
  final bool showInlineLoadingContent;
  final double loadingIndicatorSize;

  CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.backgroundColor,
    this.foregroundColor,
    this.fontSize = 17,
    this.fontWeight = FontWeight.w600,
    this.leadingIcon,
    this.trailingIcon,
    this.height = 56,
    this.width,
    this.borderRadius = 16,
    this.isLoading,
    this.isOutlined = false,
    this.padding,
    this.borderColor,
    this.loadingText,
    this.showInlineLoadingContent = false,
    this.loadingIndicatorSize = 16,
  });

  @override
  Widget build(BuildContext context) {
    isLoading ??= false.obs;

    final theme = Theme.of(context);
    final bgColor =
        backgroundColor ?? (isOutlined ? Colors.transparent : theme.primaryColor);
    final fgColor = foregroundColor ??
        (isOutlined ? theme.primaryColor : Colors.white);

    return Padding(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: SizedBox(
        height: height,
        width: width,
        child: ElevatedButton(
          onPressed: (isLoading?.value ?? false) ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: bgColor,
            foregroundColor: fgColor,
            elevation: isOutlined ? 0 : 6,
            shadowColor: isOutlined ? Colors.transparent : Colors.black26,
            side: isOutlined
                ? BorderSide(color: borderColor ?? theme.primaryColor, width: 2.2)
                : null,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(borderRadius),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24),
          ),
          child: Obx(() {
            final loading = isLoading?.value ?? false;

            if (loading) {
              if (showInlineLoadingContent) {
                return Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: loadingIndicatorSize,
                      height: loadingIndicatorSize,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(fgColor),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Flexible(
                      child: Text(
                        loadingText ?? text,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.cairo(
                          fontSize: fontSize,
                          fontWeight: fontWeight,
                          color: fgColor,
                          height: 1.35,
                          letterSpacing: 0.4,
                        ),
                        softWrap: true,
                        overflow: TextOverflow.visible,
                      ),
                    ),
                  ],
                );
              }

              return LoadingProgressiveDots(color: fgColor);
            }

            return Row(
              children: [
                // Ø§Ù„Ù†Øµ ÙŠØ£Ø®Ø° ÙƒÙ„ Ø§Ù„Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ© ÙˆÙŠÙƒØ³Ø± Ø¹Ù„Ù‰ Ø£Ø³Ø·Ø± Ù…ØªØ¹Ø¯Ø¯Ø©
                // Ø§Ù„Ø£ÙŠÙ‚ÙˆÙ†Ø© Ø¯Ø§Ø¦Ù…Ù‹Ø§ Ø¹Ù„Ù‰ Ø§Ù„ÙŠÙ…ÙŠÙ† (Ù„Ù„Ø¹Ø±Ø¨ÙŠØ©)
                if (leadingIcon != null) ...[
                  const SizedBox(width: 12),
                  Icon(
                    leadingIcon,
                    size: 28,
                    color: fgColor,
                  ),
                ],
                Expanded(
                  child: Text(
                    text,
                    textAlign: TextAlign.center, // Ù…Ù‡Ù… Ø¬Ø¯Ù‹Ø§: Ø§Ù„Ù†Øµ ÙŠØ¨Ø¯Ø£ Ù…Ù† Ø§Ù„ÙŠÙ…ÙŠÙ† (Ù„Ù„Ø¹Ø±Ø¨ÙŠØ©)
                    style: GoogleFonts.cairo(
                      fontSize: fontSize,
                      fontWeight: fontWeight,
                      color: fgColor,
                      height: 1.35,
                      letterSpacing: 0.4,
                    ),
                    softWrap: true,
                    overflow: TextOverflow.visible,
                  ),
                ),
                if (trailingIcon != null) ...[
                  const SizedBox(width: 12),
                  Icon(
                    trailingIcon,
                    size: 28,
                    color: fgColor,
                  ),
                ],
              ],
            );
          }),
        ),
      ),
    );
  }
}
