

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/state_manager.dart';

void safeBack({dynamic result}) {
    if (Get.isSnackbarOpen) Get.closeCurrentSnackbar();
    if (Navigator.canPop(Get.context!)) {
      Navigator.of(Get.context!).pop(result);
    }
  }
