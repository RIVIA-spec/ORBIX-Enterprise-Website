import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'dart:developer' as dev;

class LocationPickerController extends GetxController {
  Rx<LatLng?> selectedLatLng = Rx<LatLng?>(null);
  RxString selectedAddress = ''.obs;
}

class LocationPickerPage extends StatefulWidget {
  final double? latitude;
  final double? longitude;
  final bool showing; // وضع العرض فقط

  const LocationPickerPage({
    super.key,
    this.latitude,
    this.longitude,
    this.showing = false, // افتراضي: وضع الاختيار
  });

  @override
  State<LocationPickerPage> createState() => _LocationPickerPageState();
}

class _LocationPickerPageState extends State<LocationPickerPage> {
  final LocationPickerController controller = Get.put(LocationPickerController());
  GoogleMapController? mapController;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();

    // إذا كان في موقع مقدم → اعرضه مباشرة
    if (widget.latitude != null && widget.longitude != null) {
      final latLng = LatLng(widget.latitude!, widget.longitude!);
      controller.selectedLatLng.value = latLng;
      _getAddressFromCoordinates(latLng);

      // حرك الكاميرا للموقع المحدد
      WidgetsBinding.instance.addPostFrameCallback((_) {
        mapController?.animateCamera(CameraUpdate.newLatLngZoom(latLng, 16));
      });
    }
  }

  Future<void> _searchLocation(String query) async {
    if (widget.showing || query.trim().isEmpty) return;

    try {
      List<Location> locations = await locationFromAddress(query);
      if (locations.isNotEmpty) {
        final loc = locations.first;
        final latLng = LatLng(loc.latitude, loc.longitude);
        controller.selectedLatLng.value = latLng;
        _getAddressFromCoordinates(latLng);
        mapController?.animateCamera(CameraUpdate.newLatLngZoom(latLng, 16));
      } else {
        showSnackBar('لم يُعثر', 'لم يتم العثور على الموقع');
      }
    } catch (e) {
      showSnackBar('خطأ', 'فشل البحث');
    }
  }

  Future<void> _getAddressFromCoordinates(LatLng position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        String address = [
          place.street,
          place.subLocality,
          place.locality,
          place.administrativeArea,
          place.country,
        ].where((e) => e != null && e.isNotEmpty).join(', ');

        controller.selectedAddress.value = address.isNotEmpty ? address : 'عنوان غير متاح';
      } else {
        controller.selectedAddress.value = 'عنوان غير متاح';
      }
    } catch (e) {
      controller.selectedAddress.value = 'خطأ في جلب العنوان';
    }
  }

  void _updateSelectedLocation(LatLng position) {
    if (widget.showing) return; // منع التعديل في وضع العرض

    controller.selectedLatLng.value = position;
    _getAddressFromCoordinates(position);
  }

  Future<void> _getCurrentLocation() async {
    if (widget.showing) return; // منع استخدام الموقع الحالي في وضع العرض

    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      showSnackBar('خطأ', 'يرجى تفعيل خدمات الموقع');
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }
    if (permission == LocationPermission.deniedForever) {
      showSnackBar('خطأ', 'الصلاحيات مرفوضة نهائيًا');
      return;
    }

    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      final latLng = LatLng(position.latitude, position.longitude);
      controller.selectedLatLng.value = latLng;
      _getAddressFromCoordinates(latLng);
      mapController?.animateCamera(CameraUpdate.newLatLngZoom(latLng, 16));
    } catch (e) {
      showSnackBar('خطأ', 'فشل جلب الموقع الحالي');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: widget.showing ? 'عرض الموقع' : 'اختر الموقع',
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: controller.selectedLatLng.value ??
                  const LatLng(24.7136, 46.6753), // الرياض كافتراضي
              zoom: 15,
            ),
            onMapCreated: (GoogleMapController ctrl) {
              mapController = ctrl;
            },
            onTap: widget.showing ? null : _updateSelectedLocation,
            markers: {
              if (controller.selectedLatLng.value != null)
                Marker(
                  markerId: const MarkerId('selected'),
                  position: controller.selectedLatLng.value!,
                  draggable: !widget.showing, // لا يمكن السحب في وضع العرض
                  icon: BitmapDescriptor.defaultMarkerWithHue(
                    widget.showing ? BitmapDescriptor.hueBlue : BitmapDescriptor.hueRed,
                  ),
                ),
            },
            myLocationEnabled: !widget.showing,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: !widget.showing,
            mapToolbarEnabled: false,
          ),

          // مؤشر ثابت في الوسط (فقط في وضع الاختيار)
          if (!widget.showing)
            Center(
              child: IgnorePointer(
                child: Icon(Icons.location_on, color: Colors.red, size: 44),
              ),
            ),

          // عرض العنوان
          Positioned(
            bottom: widget.showing ? 20 : 100,
            left: 16,
            right: 16,
            child: Obx(() => controller.selectedLatLng.value != null
                ? Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 2))
                      ],
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.location_on, color: Colors.red),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            controller.selectedAddress.value.isNotEmpty
                                ? controller.selectedAddress.value
                                : 'جاري تحميل العنوان...',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink()),
          ),

          // حقل البحث (فقط في وضع الاختيار)
          if (!widget.showing)
            Positioned(
              top: Get.height * 0.13,
              left: 16,
              right: 16,
              child: Material(
                elevation: 6,
                borderRadius: BorderRadius.circular(12),
                child: TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  onSubmitted: _searchLocation,
                  decoration: InputDecoration(
                    hintText: 'ابحث عن مكان أو عنوان...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),

          // زر الموقع الحالي (فقط في وضع الاختيار)
          if (!widget.showing)
            Positioned(
              bottom: 100,
              right: 16,
              child: FloatingActionButton(
                backgroundColor: Colors.blue,
                onPressed: _getCurrentLocation,
                child: const Icon(Icons.my_location, color: Colors.white),
              ),
            ),

          // زر التأكيد (فقط في وضع الاختيار)
          if (!widget.showing)
            Positioned(
              bottom: 20,
              left: 30,
              right: 30,
              child: CustomButton(
                text: "تأكيد الموقع",
                onPressed: () {
                  if (controller.selectedLatLng.value != null) {
                    safeBack(result: {
                      'latitude': controller.selectedLatLng.value!.latitude.toString(),
                      'longitude': controller.selectedLatLng.value!.longitude.toString(),
                      'address': controller.selectedAddress.value,
                    });
                  } else {
                    showSnackBar('خطأ', 'يرجى اختيار موقع أولاً');
                  }
                },
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    mapController?.dispose();
    super.dispose();
  }
}