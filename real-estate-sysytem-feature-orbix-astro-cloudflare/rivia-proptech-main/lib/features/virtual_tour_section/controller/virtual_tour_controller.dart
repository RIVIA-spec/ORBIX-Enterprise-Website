import 'dart:io';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

class TourController extends GetxController {
  var images = <File>[].obs;
  final picker = ImagePicker();

  Future<void> pickImage() async {
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      images.add(File(picked.path));
    }
  }
}