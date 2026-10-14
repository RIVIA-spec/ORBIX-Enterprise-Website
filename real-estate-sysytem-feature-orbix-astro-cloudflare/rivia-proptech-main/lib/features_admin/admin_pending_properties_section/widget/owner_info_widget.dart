// lib/features/admin/pending_properties/widget/owner_info_widget.dart
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class OwnerInfoWidget extends StatelessWidget {
  final String ownerId;

  const OwnerInfoWidget({super.key, required this.ownerId});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance.collection('users').doc(ownerId).get(),
      builder: (context, snapshot) {
        // حالة التحميل
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _InfoRow(
            icon: Icons.person,
            label: "جاري تحميل المالك...",
            color: Colors.grey,
          );
        }

        // حالة الخطأ أو غير موجود
        if (snapshot.hasError || !snapshot.hasData || !snapshot.data!.exists) {
          return const _InfoRow(
            icon: Icons.error,
            label: "المالك غير متوفر",
            color: Colors.red,
          );
        }

        final data = snapshot.data!.data() as Map<String, dynamic>;
        final name = data['username'] ?? data['name'] ?? 'بدون اسم';
        final email = data['email'] ?? 'بدون بريد';

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _InfoRow(icon: Icons.person, label: "المالك: $name"),
            _InfoRow(icon: Icons.email, label: email),
          ],
        );
      },
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _InfoRow({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color ?? Colors.grey[600]),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              label,
              style: TextStyle(fontSize: 13, color: color ?? Colors.grey[700]),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}