import 'package:flutter/material.dart';

class CustomButtonReport extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const CustomButtonReport({required this.label, required this.onPressed, super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blueAccent, // اللون الرئيسي
        padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 30),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30), // زر مدور
        ),
      ),
      onPressed: onPressed,
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 16,
          color: Colors.white, // النص باللون الأبيض
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
