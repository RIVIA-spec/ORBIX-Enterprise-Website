import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_controller/add_hotel_controller.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_view/widgets/hotel_basic_details.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_view/widgets/hotel_contact_info.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_view/widgets/hotel_photos.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_view/widgets/hotel_site_details.dart';
import 'package:real_estate_app/features_admin/add_hotel_sectoin/add_hotel_view/widgets/room_group_widget.dart';

class AddHotelView extends StatelessWidget {
  final Map<String, dynamic>? hotel; // معامل اختياري للفندق في وضع التعديل

  const AddHotelView({super.key, this.hotel});

  @override
  Widget build(BuildContext context) {
    final AddHotelController hotelCtr = Get.put(AddHotelController());
    var errorMsg = "".obs;

    // إذا كان في وضع التعديل، قم بتحميل البيانات
    if (hotel != null && hotel!['id'] != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        hotelCtr.loadHotelData(hotel!['id']);
      });
    }

    return Scaffold(
      appBar: CustomAppBar(
        title: hotel != null ? "تعديل الفندق" : "إضافة فندق",
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(5),
        child: Form(
          key: hotelCtr.formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // معلومات الفندق الأساسية
              HotelBasicDetails(),

              const SizedBox(height: 10),

              // موقع الفندق
              HotelSiteDetails(),

              const SizedBox(height: 10),

              // 🟦 صور الفندق
              HotelPhotos(),

              const SizedBox(height: 10),

              // مجموعات الغرف
              Obx(
                () => Column(
                  children: [
                    for (int i = 0; i < hotelCtr.roomGroups.length; i++)
                      Column(
                        children: [
                          RoomGroupWidget(
                            roomGroup: hotelCtr.roomGroups[i],
                            index: i,
                          ),
                          const SizedBox(height: 10),
                        ],
                      ),
                  ],
                ),
              ),

              // زر إضافة مجموعة غرف جديدة
              Center(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ElevatedButton.icon(
                    onPressed: () {
                      hotelCtr.addRoomGroup();
                    },
                    icon: Icon(Icons.add),
                    label: Text("إضافة مجموعة غرف جديدة"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              // معلومات الاتصال
              HotelContactInfo(),

              const SizedBox(height: 20),

              // رسالة الخطأ
              Obx(
                () {
                  if (errorMsg.value.isEmpty) {
                    return SizedBox.shrink();
                  } else {
                    return SizedBox(
                      width: Get.width,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(height: 10),
                          Container(
                            alignment: Alignment.center,
                            width: Get.width * 0.6,
                            padding: EdgeInsets.symmetric(vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: Text(
                              errorMsg.value,
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          )
                        ],
                      ),
                    );
                  }
                },
              ),

              const SizedBox(height: 10),

              // عرض حالة رفع الصور
              Obx(() {
                if (hotelCtr.uploadImagesStatus.isEmpty &&
                    hotelCtr.uploadedPanoramaStatus.isEmpty) {
                  return SizedBox.shrink();
                }

                Widget _buildStatusIcon(String status) {
                  switch (status) {
                    case "pending":
                      return SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Colors.blue,
                        ),
                      );
                    case "success":
                      return Icon(Icons.check_circle_outline, color: Colors.green, size: 26);
                    case "failed":
                      return Icon(Icons.close, color: Colors.red, size: 26);
                    default:
                      return SizedBox.shrink();
                  }
                }

                Widget _buildImageRow(String title, String status) {
                  return Container(
                    margin: EdgeInsets.symmetric(vertical: 6),
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    width: Get.width * 0.7,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 8,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: GoogleFonts.cairo(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                        _buildStatusIcon(status),
                      ],
                    ),
                  );
                }

                return SizedBox(
                  width: Get.width,
                  child: Obx(
                    () => Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        for (var i = 0; i < hotelCtr.uploadImagesStatus.length; i++)
                          Obx(() => _buildImageRow(
                                "الصورة رقم ${i + 1}",
                                hotelCtr.uploadImagesStatus[i],
                              )),
                        for (var i = 0; i < hotelCtr.uploadedPanoramaStatus.length; i++)
                          Obx(() => _buildImageRow(
                                "صورة البانوراما رقم ${i + 1}",
                                hotelCtr.uploadedPanoramaStatus[i],
                              )),
                      ],
                    ),
                  ),
                );
              }),

              const SizedBox(height: 10),

              // زر الحفظ
              ListTile(
                title: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 25),
                  child: ElevatedButton(
                    onPressed: () {
                      if (hotelCtr.isLoading.value)return;
                      if (hotelCtr.formKey.currentState!.validate() == false) {
                        errorMsg.value = "يرجى مراجعة البيانات";
                      } else if (hotelCtr.formKey.currentState!.validate()) {
                        errorMsg.value = "";
                        hotelCtr.submitHotelRequest();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 5,
                    ),
                    child: Obx(
                      () => hotelCtr.isLoading.value
                          ? LoadingProgressiveDots()
                          : Text("حفظ", style: GoogleFonts.cairo()),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
