// lib/features/admin/view/widgets/confirm_dialog.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void showConfirmDialog(BuildContext context, VoidCallback onConfirm) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text("تأكيد الحجز", style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
      content: Text("هل أنت متأكد من تأكيد هذا الحجز؟", style: GoogleFonts.cairo()),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: Text("إلغاء", style: GoogleFonts.cairo(color: Colors.grey)),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(ctx);
            onConfirm();
          },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
          child: Text("تأكيد", style: GoogleFonts.cairo(color: Colors.white)),
        ),
      ],
    ),
  );
}

void showRejectDialog(BuildContext context, Function(String?) onReject) {
  final TextEditingController reasonCtrl = TextEditingController();

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          const Icon(Icons.close, color: Colors.red),
          const SizedBox(width: 8),
          Text("رفض الحجز", style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("هل تريد رفض هذا الحجز؟", style: GoogleFonts.cairo()),
          const SizedBox(height: 12),
          TextField(
            controller: reasonCtrl,
            decoration: InputDecoration(
              hintText: "السبب (اختياري)",
              hintStyle: GoogleFonts.cairo(color: Colors.grey),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 8),
          Text("* السبب اختياري", style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: Text("إلغاء", style: GoogleFonts.cairo(color: Colors.grey)),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(ctx);
            onReject(reasonCtrl.text.isEmpty ? null : reasonCtrl.text);
          },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          child: Text("رفض", style: GoogleFonts.cairo(color: Colors.white)),
        ),
      ],
    ),
  );
}