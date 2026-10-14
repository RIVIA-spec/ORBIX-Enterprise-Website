// lib/core/widgets/custom_dropdown.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomDropdown<T> extends StatelessWidget {
  final String? label;
  final T? value;
  final List<DropdownOption<T>> items;
  final ValueChanged<T?>? onChanged;
  final String? hint;
  final IconData? icon;
  final Color? iconColor;
  final bool isDense;
  final double? fontSize;

  const CustomDropdown({
    super.key,
    this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    this.hint,
    this.icon,
    this.iconColor,
    this.isDense = true,
    this.fontSize
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if(label != null)
        Text(
          label!,
          style: GoogleFonts.cairo(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<T>(
          value: value,
          hint: hint != null
              ? Text(
                  hint!,
                  style: GoogleFonts.cairo(color: Colors.grey.shade600),
                )
              : null,
          isExpanded: true,
          isDense: isDense,
          icon: Icon(
            Icons.keyboard_arrow_down_rounded,
            color: iconColor ?? Colors.blueAccent,
            size: 20,
          ),
          elevation: 8,
          dropdownColor: Colors.white,
          borderRadius: BorderRadius.circular(16),
          style: GoogleFonts.cairo(
            fontSize: 15,
            color: Colors.black87,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey.shade50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            prefixIcon: icon != null
                ? Icon(icon, color: iconColor ?? Colors.blueAccent, size: 22)
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: Theme.of(context).primaryColor, width: 2.5),
            ),
          ),
          items: items.map((option) {
            return DropdownMenuItem<T>(
              value: option.value,
              child: Text(
                option.title,
                style: GoogleFonts.cairo(fontSize: fontSize ?? 15),
                overflow: TextOverflow.ellipsis,
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

// كلاس مساعد لتحديد القيمة والعنوان
class DropdownOption<T> {
  final T value;
  final String title;

  const DropdownOption({required this.value, required this.title});
}