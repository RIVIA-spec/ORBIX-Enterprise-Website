// lib/features/user/my_property/widget/pending_requests_header.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class PendingRequestsHeader extends StatelessWidget {
  final int count;
  final VoidCallback onTap;

  const PendingRequestsHeader({
    super.key,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.hourglass_bottom, color: Colors.orange.shade700),
            const SizedBox(width: 12),
            Text(
              "لديك $count طلبات نشر معلقة",
              style: TextStyle(
                color: Colors.orange.shade800,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const Spacer(),
            Icon(Icons.arrow_forward_ios, size: 16, color: Colors.orange.shade700),
          ],
        ),
      ),
    );
  }
}