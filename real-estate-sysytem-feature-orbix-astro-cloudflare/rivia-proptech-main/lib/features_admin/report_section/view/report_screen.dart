// lib/screens/report_screen.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features_admin/report_section/controller/report_controller.dart';
import 'package:real_estate_app/features_admin/report_section/widget/report_card_widget.dart';

class ReportScreen extends StatelessWidget {
  const ReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reportCtr = Get.put(ReportController());

    return Scaffold(
      appBar: const CustomAppBar(title: "الإبلاغات"),
      body: Column(
        children: [
          // === شريط البحث ===
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              onChanged: (value) => reportCtr.searchQuery.value = value,
              decoration: InputDecoration(
                hintText: "ابحث عن طريق المعرف أو العنوان...",
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                filled: true,
                fillColor: Colors.grey.shade50,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              style: GoogleFonts.cairo(),
            ),
          ),

          // === الفلاتر ===
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                // زر "الكل"
                Expanded(
                  child: Obx(() => _FilterChip(
                        label: "الكل",
                        selected: reportCtr.selectedFilter.value == 'all',
                        onSelected: (_) => reportCtr.selectedFilter.value = 'all',
                      )),
                ),
                const SizedBox(width: 12),
                // فلتر "المنتظرة"
                Expanded(
                  child: Obx(() => _FilterChip(
                        label: "المنتظرة",
                        selected: reportCtr.selectedFilter.value == 'pending',
                        onSelected: (_) => reportCtr.selectedFilter.value = 'pending',
                      )),
                ),
                const SizedBox(width: 12),
                // فلتر "المغلقة"
                Expanded(
                  child: Obx(() => _FilterChip(
                        label: "المغلقة",
                        selected: reportCtr.selectedFilter.value == 'closed',
                        onSelected: (_) => reportCtr.selectedFilter.value = 'closed',
                      )),
                ),
                
                
              ],
            ),
          ),

          // === القائمة ===
          Expanded(
            child: Obx(() {
              if (reportCtr.isLoading.value) {
                return const LoadingDiscreteCircular();
              }

              if (reportCtr.filteredReports.isEmpty) {
                return NoDataWithRefreshIndicator(
                  noDataText: "لا توجد إبلاغات تطابق البحث",
                  onRefresh: reportCtr.loadReports,
                );
              }

              return RefreshIndicator(
                onRefresh: reportCtr.loadReports,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: reportCtr.filteredReports.length,
                  itemBuilder: (context, index) {
                    return ReportCardWidget(
                      report: reportCtr.filteredReports[index],
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// === ويدجت فلتر مخصص ===
class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final void Function(bool) onSelected;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label, style: GoogleFonts.cairo(fontWeight: FontWeight.w600)),
      selected: selected,
      onSelected: onSelected,
      selectedColor: Colors.blue.shade100,
      checkmarkColor: Colors.blue.shade700,
      backgroundColor: Colors.grey.shade100,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: selected ? Colors.blue : Colors.grey.shade300),
      ),
    );
  }
}