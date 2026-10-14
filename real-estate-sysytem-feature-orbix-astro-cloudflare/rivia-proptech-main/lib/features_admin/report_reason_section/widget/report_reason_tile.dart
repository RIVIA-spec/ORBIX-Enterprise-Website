// lib/features/report_reasons/widgets/report_reason_tile.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/features_admin/report_reason_section/widget/show_delete_reason.dart';
import 'package:real_estate_app/features_admin/report_reason_section/widget/show_edit_reason.dart';
import '../controller/report_reasons_controller.dart';

class ReportReasonTile extends StatelessWidget {
  final Map<String, dynamic> reason;
  final ReportReasonsController controller;

  const ReportReasonTile({required this.reason, required this.controller, super.key});

  @override
  Widget build(BuildContext context) {
    final TextEditingController reasonCtrl = TextEditingController(text: reason['reason']);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        title: Text(
          reason['reason'],
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        // subtitle: Text(
        //   "ID: ${reason['id']}",
        //   style: GoogleFonts.cairo(color: Colors.grey[600], fontSize: 12),
        // ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.blue),
              onPressed: () {
                EditReasonSheet.show(
                  reasonId: reason['id'],
                  currentReason: reason['reason'],
                  controller: controller,
                );
              },
            ),
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () {
                DeleteReasonSheet.show(
                  reasonId: reason['id'],
                  reasonText: reason['reason'],
                  controller: controller,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}