import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class LocationPickerController extends GetxController {
  Rx<LatLng?> selectedLatLng = Rx<LatLng?>(null);
  RxString selectedAddress = ''.obs;
}
