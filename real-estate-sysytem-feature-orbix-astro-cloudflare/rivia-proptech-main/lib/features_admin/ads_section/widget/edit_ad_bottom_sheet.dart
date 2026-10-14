// lib/features_admin/ads/widget/edit_ad_bottom_sheet.dart

import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:real_estate_app/features_admin/ads_section/ad_model.dart';
import 'package:real_estate_app/features_admin/ads_section/controller/ads_managment_controller.dart';


class EditAdBottomSheet extends StatefulWidget {
  final AdModel ad;
  final Function(File?, int, String) onUpdate; // إضافة String للرابط

  const EditAdBottomSheet({
    required this.ad,
    required this.onUpdate,
    super.key,
  });

  @override
  State<EditAdBottomSheet> createState() => _EditAdBottomSheetState();
}

class _EditAdBottomSheetState extends State<EditAdBottomSheet> {
  File? _newImage;
  int _selectedOrder = 1;
  late TextEditingController _linkController;

  @override
  void initState() {
    super.initState();
    _selectedOrder = widget.ad.order;
    _linkController = TextEditingController(text: widget.ad.link);
  }

  @override
  void dispose() {
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _pickNewImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked != null) {
      setState(() {
        _newImage = File(picked.path);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final adsCtrl = Get.find<AdsManagmentController>();
    final maxPossibleOrder = adsCtrl.ads.length;

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('تعديل الإعلان', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),

          // حقل الترتيب
          Row(
            children: [
              const Icon(Icons.format_list_numbered, color: Colors.blueAccent),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: _selectedOrder,
                  decoration: InputDecoration(
                    labelText: 'ترتيب الإعلان',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: List.generate(maxPossibleOrder, (index) => index + 1)
                      .map((num) => DropdownMenuItem(value: num, child: Text('الترتيب $num')))
                      .toList(),
                  onChanged: (value) {
                    if (value != null) setState(() => _selectedOrder = value);
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // حقل الرابط (اختياري)
          Row(
            children: [
              const Icon(Icons.link, color: Colors.blueAccent),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _linkController,
                  decoration: InputDecoration(
                    labelText: 'رابط الإعلان (اختياري)',
                    hintText: 'https://example.com',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  keyboardType: TextInputType.url,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // معاينة الصورة
          GestureDetector(
            onTap: _pickNewImage,
            child: Container(
              height: 180,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade400, width: 2),
                borderRadius: BorderRadius.circular(16),
                color: Colors.grey[100],
              ),
              child: _newImage != null
                  ? ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.file(_newImage!, fit: BoxFit.cover))
                  : widget.ad.imageUrl.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: CachedNetworkImage(
                            imageUrl: widget.ad.imageUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                          ),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate_outlined, size: 60, color: Colors.grey[600]),
                            const SizedBox(height: 12),
                            Text('اضغط لتغيير الصورة', style: GoogleFonts.cairo(color: Colors.grey[700])),
                          ],
                        ),
            ),
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () => widget.onUpdate(_newImage, _selectedOrder, _linkController.text),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                'حفظ التعديلات',
                style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}