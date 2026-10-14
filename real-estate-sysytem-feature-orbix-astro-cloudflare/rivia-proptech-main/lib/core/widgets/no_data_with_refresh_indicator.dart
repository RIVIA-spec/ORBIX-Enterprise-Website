import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

class NoDataWithRefreshIndicator extends StatelessWidget {
  const NoDataWithRefreshIndicator({
    super.key, required this.noDataText, required this.onRefresh,
    this.icon,
  });

  final Widget? icon;
  final String noDataText;
  final Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        onRefresh();
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: Get.height, // يجعل الصفحة بنفس طول الشاشة → scoll يعمل حتى لو المحتوى قليل
          width: Get.width,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                icon ?? Icon(Icons.event_available,
                    size: 80, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  noDataText,
                  style: GoogleFonts.cairo(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
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