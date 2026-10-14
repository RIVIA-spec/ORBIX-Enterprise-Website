import 'package:flutter/services.dart';

class NumberWithCommasFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // 1. تنظيف النص من الفواصل
    String cleaned = newValue.text.replaceAll(',', '');

    // 2. السماح بالأرقام فقط
    if (cleaned.isEmpty) {
      return newValue.copyWith(text: '');
    }

    if (int.tryParse(cleaned) == null) {
      return oldValue; // لا تسمح بغير الأرقام
    }

    // 3. تنسيق العرض بفواصل
    final formatted = _formatWithCommas(cleaned);

    // 4. إرجاع القيمة:
    //    - `text`: العرض (مع فواصل)
    //    - `selection`: مؤشر في نهاية النص
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
      // مهم: هذا يحفظ القيمة النظيفة في controller.text
      composing: TextRange.empty,
    );
  }

  String _formatWithCommas(String text) {
    final number = int.parse(text);
    return number.toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match.group(1)},',
    );
  }
}