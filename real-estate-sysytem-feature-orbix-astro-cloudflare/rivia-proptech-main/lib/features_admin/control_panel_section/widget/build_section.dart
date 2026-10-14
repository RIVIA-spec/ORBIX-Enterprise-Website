import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/features_admin/control_panel_section/widget/empty_section.dart';

class BuildSection <T extends Map<String, dynamic>> extends StatelessWidget {
  const BuildSection ({
    required this. title,
    required this.items,
    required this.itemBuilder
  });

  final String title;
  final RxList<T> items;
  final Widget Function(T) itemBuilder;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return EmptySection(title: "$title (لا يوجد)");
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ...items.map(itemBuilder), // الآن الأنواع متطابقة
      ],
    );
  }
}