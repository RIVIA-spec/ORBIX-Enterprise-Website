// lib/features/property_categories/widget/property_category_tile.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'show_add_category_bottom_sheet.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class PropertyCategoryTile extends StatelessWidget {
  final Map<String, dynamic> category;
  final dynamic controller;

  const PropertyCategoryTile({super.key, required this.category, required this.controller});

  @override
  Widget build(BuildContext context) {
    final id = category['id'] as String;
    final title = category['title'] as String;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.w600)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.blue),
              onPressed: () {
                final editCtrl = TextEditingController(text: title);
                Get.bottomSheet(
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text("تعديل الفئة", style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        TextField(
                          controller: editCtrl,
                          decoration: InputDecoration(
                            hintText: "اسم الفئة",
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            filled: true,
                            fillColor: Colors.grey.shade50,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: TextButton(
                                onPressed: () => safeBack(),
                                child: const Text("إلغاء"),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  final newTitle = editCtrl.text.trim();
                                  if (newTitle.isNotEmpty) {
                                    controller.updateCategory(id, newTitle);
                                    safeBack();
                                  }
                                },
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                                child: const Text("حفظ", style: TextStyle(color: Colors.white)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  isScrollControlled: true,
                );
              },
            ),
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () {
                Get.dialog(
                  AlertDialog(
                    title: const Text("تأكيد الحذف"),
                    content: Text("هل تريد حذف فئة \"$title\"؟"),
                    actions: [
                      TextButton(onPressed: () => safeBack(), child: const Text("إلغاء")),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                        onPressed: () {
                          controller.deleteCategory(id);
                          safeBack();
                        },
                        child: const Text("حذف"),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}