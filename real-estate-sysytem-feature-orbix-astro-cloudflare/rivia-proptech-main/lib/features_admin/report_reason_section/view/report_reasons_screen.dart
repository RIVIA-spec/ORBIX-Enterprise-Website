// lib/features/report_reasons/view/report_reasons_screen.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/no_data_with_refresh_indicator.dart';
import 'package:real_estate_app/features_admin/report_reason_section/widget/report_reason_tile.dart';
import 'package:real_estate_app/features_admin/report_reason_section/widget/show_add_reason_bottom_sheet.dart';
import '../controller/report_reasons_controller.dart';

class ReportReasonsScreen extends StatelessWidget {
  final ReportReasonsController reportReasonCtr = Get.put(ReportReasonsController());

  ReportReasonsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: CustomAppBar(title: "أسباب الإبلاغ",
          // backgroundColor: Colors.redAccent,
        ),
        body: Obx(() {
          if (reportReasonCtr.isLoading.value) {
            return LoadingDiscreteCircular();
          }
          if (reportReasonCtr.reasons.isEmpty) {
            return NoDataWithRefreshIndicator(noDataText: "لا توجد أسباب بعد", 
              onRefresh: reportReasonCtr.loadReasons
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              reportReasonCtr.loadReasons();
            },
            child: ListView.builder(
              itemCount: reportReasonCtr.reasons.length,
              itemBuilder: (context, index) {
                final reason = reportReasonCtr.reasons[index];
                if(index == 0){
                  return Column(
                    children: [
                      SizedBox(height: 20,),
                      ReportReasonTile(reason: reason, controller: reportReasonCtr)
                    ],
                  );
                }
                return ReportReasonTile(reason: reason, controller: reportReasonCtr);
              },
            ),
          );
        }),
        floatingActionButton: FloatingActionButton(
          backgroundColor: Colors.blueAccent /* Theme.of(context).primaryColor */,
          child: const Icon(Icons.add, color: Colors.white),
          onPressed: () {
            showAddReasonBottomSheet(
              controller: reportReasonCtr
            );
          },
        ),
      ),
    );
  }
}