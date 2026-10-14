import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/widgets/image_preview_widget.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/features/google_maps_section/controller/google_maps_controller.dart';
import 'package:real_estate_app/features/google_maps_section/view/google_maps_screen.dart';
import 'package:real_estate_app/features/panorama_tour_viewer_section/view/panorama_viewer_screen.dart';
import 'package:real_estate_app/features_admin/admin_pending_properties_section/widget/admin_panorama_view.dart';
import 'package:real_estate_app/features_admin/admin_pending_properties_section/widget/contact_ower_button_pending.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'owner_info_widget.dart';
import '../controller/admin_pending_property_controller.dart';

class AdminPendingPropertyCard extends StatelessWidget {
  final Map<String, dynamic> request;
  final AdminPendingPropertyController ctrl;

  const AdminPendingPropertyCard(
      {super.key, required this.request, required this.ctrl});

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    final int num = int.tryParse(number.toString()) ?? 0;
    return num.toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (match) => '${match.group(1)},',
    );
  }

  void _openImagePreview(String imageUrl) {
    Get.dialog(
      Dialog(
        backgroundColor: Colors.black87,
        child: Stack(
          children: [
            Center(
                child: ImagePreviewWidget(
                    imageUrl: imageUrl, fit: BoxFit.contain)),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => safeBack(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String getRequestTypeText(String requestType) {
    switch (requestType) {
      case "publish":
        return "نشر";
      case "edit":
        return "تعديل";
      default:
        return "غير محدد";
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<String> images = [];
    if (request['mainImage'] != null) images.add(request['mainImage']);
    images.addAll(List<String>.from(request['images'] ?? []));

    final String requestType = request['request_type'] ?? '';
    final String propertyType = request['property_type'] ?? '';
    final bool isRent = propertyType == "إيجار";
    final bool isSale = propertyType == "بيع";

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // عرض نوع الطلب
            Row(
              children: [
                Text(
                  "نوع الطلب: ${getRequestTypeText(requestType)}",
                  style: GoogleFonts.cairo(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade800),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // العنوان + النوع + الفئة
            Row(
              children: [
                Expanded(
                  child: Text(
                    request['title'] ?? 'بدون عنوان',
                    style: GoogleFonts.cairo(
                        fontSize: 18, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.visible,
                  ),
                ),
                const SizedBox(width: 8),
                _buildTag(request['property_category_title'] ?? 'غير محدد',
                    Colors.blue.shade50, Colors.blue.shade800),
                const SizedBox(width: 8),
                _buildTag(
                    propertyType,
                    isRent ? Colors.green.shade50 : Colors.orange.shade50,
                    isRent ? Colors.green.shade800 : Colors.orange.shade800),
              ],
            ),
            const SizedBox(height: 12),

            // الصور المصغرة
            if (images.isNotEmpty)
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: images.length,
                  itemBuilder: (context, index) {
                    if (index == 0) return SizedBox.shrink();
                    return GestureDetector(
                      onTap: () => _openImagePreview(images[index]),
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: ImagePreviewWidget(
                            imageUrl: images[index],
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            const SizedBox(height: 12),

            if (request['ownerId'] != null)
              OwnerInfoWidget(ownerId: request['ownerId']),

            const SizedBox(height: 12),

            // الموقع + المالك
            _buildInfoRow(Icons.location_city,
                "${request['city'] ?? ''}, ${request['country'] ?? ''}"),
            const SizedBox(height: 3),
            // زر العنوان (قابل للضغط لاحقًا)
            if (request['address']?.toString().trim().isNotEmpty == true)
              GestureDetector(
                onTap: () {
                  var longitude = double.tryParse(request['longitude']);
                  var latitude = double.tryParse(request['latitude']);
                  
                  if(longitude == null || latitude == null){
                    showSnackBar(
                      "خطأ", "الموقع غير صحيح",
                      colorText: Colors.white,
                      backgroundColor: Colors.red
                    );
                    return;
                  }
                  // مؤقتًا: نعرض رسالة، لاحقًا يمكن فتح الخريطة أو نسخ العنوان
                  showSnackBar("العنوان", request['address'],
                      backgroundColor: Colors.blue.shade600);
            
                  Get.to(() => LocationPickerPage(
                      latitude: latitude,
                      longitude: longitude,
                      showing: true,
                    ));
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.blue.shade300, width: 1),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.location_on,
                          size: 18, color: Colors.blue.shade700),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          request['address'],
                          style: GoogleFonts.cairo(
                            fontSize: 13,
                            color: Colors.blue.shade900,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 8),

            // زر التواصل مع المالك
            if (request['contact_number'] != null &&
                request['contact_number'].toString().trim().isNotEmpty)
              Center(
                child: SizedBox(
                  width: Get.width * 0.7,
                  child: CustomButton(
                    text: "التواصل مع المالك",
                    leadingIcon: Icons.phone_enabled,
                    // backgroundColor: Colors.green.shade600,
                    foregroundColor: Colors.green.shade600,
                    isOutlined: true,
                    borderColor: Colors.green.shade600,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    onPressed: () {
                      final phone = request['contact_number'].toString().trim();

                      // جرب فتح واتساب أولاً (الأكثر شيوعًا)
                      final whatsappUrl = "whatsapp://send?phone=$phone";
                      final phoneUrl = "tel:$phone";

                      launchUrlString(whatsappUrl).catchError((e) {
                        // إذا فشل واتساب (غير مثبت)، افتح تطبيق الهاتف
                        return launchUrlString(phoneUrl);
                      }).catchError((e) {
                        showSnackBar("فشل الفتح",
                            "تعذر فتح تطبيق التواصل، حاول يدويًا: $phone");
                      });
                    },
                  ),
                ),
              ),

            const Divider(height: 32),

            AdminPanoramaView(request: request),
            // الأسعار
            if (isRent) ...[
              Row(
                children: [
                  _buildPriceChip("يومي", _formatNumber(request['daily_price']),
                      request['daily_price_currency'], Colors.blue),
                  const SizedBox(width: 8),
                  if (request['nightly_price'] != null)
                    _buildPriceChip(
                        "ليلي",
                        _formatNumber(request['nightly_price']),
                        request['nightly_currency'],
                        Colors.purple),
                ],
              ),
            ] else if (isSale && request['selling_price'] != null) ...[
              _buildPriceChip(
                  "سعر البيع",
                  _formatNumber(request['selling_price']),
                  request['selling_price_currency'],
                  Colors.red),
            ],
            const SizedBox(height: 12),

            // تفاصيل العقار
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _buildDetailChip(Icons.square_foot,
                    "${request['area'] ?? 0} ${request['area_unit'] ?? ''}"),
                _buildDetailChip(
                    Icons.bathtub, "${request['bathrooms'] ?? 0} حمام"),
                _buildDetailChip(Icons.bed, "${request['bedrooms'] ?? 0} غرفة"),
              ],
            ),
            const SizedBox(height: 12),

            // الميزات
            if (request['features'] != null &&
                (request['features'] as List).isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: (request['features'] as List)
                    .map<Widget>((f) => Chip(
                          label: Text(f, style: const TextStyle(fontSize: 12)),
                          backgroundColor: Colors.green.shade50,
                        ))
                    .toList(),
              ),
            const SizedBox(height: 12),

            // الحجوزات للعقارات للإيجار
            if (isRent &&
                (request['booked_periods'] as List?)?.isNotEmpty == true)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("الحجوزات القادمة:",
                      style: GoogleFonts.cairo(
                          fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: (request['booked_periods'] as List).map((p) {
                      final from = (p['from'] as Timestamp).toDate();
                      final to = (p['to'] as Timestamp).toDate();
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          border: Border.all(color: Colors.orange.shade300),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "${from.day}/${from.month}/${from.year}",
                              style: GoogleFonts.cairo(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.orange.shade800),
                            ),
                            const Text("إلى",
                                style: TextStyle(
                                    fontSize: 10, color: Colors.orange)),
                            Text(
                              "${to.day}/${to.month}/${to.year}",
                              style: GoogleFonts.cairo(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.orange.shade800),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                ],
              ),

            // وصف وقوانين
            if (request['description']?.toString().isNotEmpty == true)
              _buildSection("الوصف", request['description']),
            if (request['rules']?.toString().isNotEmpty == true)
              _buildSection("القوانين والشروط", request['rules'],
                  color: Colors.red.shade50, borderColor: Colors.red.shade100),

            const SizedBox(height: 16),

            // أزرار الموافقة/الرفض
            Row(
              children: [
                Expanded(
                  child: CustomButton(
                    text: "موافقة",
                    leadingIcon: Icons.check,
                    isOutlined: true,
                    foregroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    onPressed: () =>
                        ctrl.approve(request['request_id'], request),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: CustomButton(
                    text: "رفض",
                    isOutlined: true,
                    leadingIcon: Icons.close,
                    foregroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    onPressed: () =>
                        _showRejectSheet(context, ctrl, request['request_id']),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(String text, Color bg, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Text(text,
          style: GoogleFonts.cairo(
              fontSize: 11, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 6),
          Expanded(
              child: Text(text,
                  style: TextStyle(fontSize: 13, color: Colors.grey[700]))),
        ],
      ),
    );
  }

  Widget _buildPriceChip(
      String label, String price, String? currency, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20)),
      child: Text("$label: $price ${currency ?? ''}",
          style: TextStyle(
              color: color, fontWeight: FontWeight.bold, fontSize: 13)),
    );
  }

  Widget _buildDetailChip(IconData icon, String text) {
    return Chip(
      avatar: Icon(icon, size: 16, color: Colors.blue),
      label: Text(text, style: const TextStyle(fontSize: 12)),
      backgroundColor: Colors.blue.shade50,
    );
  }

  Widget _buildSection(String title, String content,
      {Color? color, Color? borderColor}) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color ?? Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor ?? Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(content,
              style:
                  GoogleFonts.cairo(fontSize: 13, color: Colors.grey.shade800)),
        ],
      ),
    );
  }

  void _showRejectSheet(
      BuildContext context, AdminPendingPropertyController ctrl, String id) {
    final reasonCtrl = TextEditingController();
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("سبب الرفض",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            CustomTextFormField(
              hint: "أدخل سبب الرفض...",
              controller: reasonCtrl,
              maxLines: 3,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "هذا الحقل مطلوب";
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                    child: TextButton(
                        onPressed: () => safeBack(),
                        child: const Text("إلغاء"))),
                const SizedBox(width: 8),
                Expanded(
                  child: CustomButton(
                    text: "تأكيد الرفض",
                    backgroundColor: Colors.red,
                    onPressed: () {
                      ctrl.reject(
                          id, reasonCtrl.text.trim(), request["request_type"]);
                      safeBack();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      isScrollControlled: true,
      enableDrag: true,
    );
  }
}
