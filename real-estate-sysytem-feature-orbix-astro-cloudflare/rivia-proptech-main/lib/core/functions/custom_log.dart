import 'dart:developer' as dev;

void customLog(
  String msg, {
  String tag = 'LOG',
  bool isError = false,
  bool isSuccess = false,
  bool isWarning = false,
}) {
  final color = isError
      ? '\x1B[31m' // أحمر
      : isSuccess
          ? '\x1B[32m' // أخضر
          : isWarning
              ? '\x1B[33m' // أصفر
              : '\x1B[34m'; // أزرق

  final reset = '\x1B[0m';
  dev.log('$color[$tag] $msg$reset');
}