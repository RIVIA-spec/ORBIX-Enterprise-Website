// lib/features/bookings/view/widgets/booking_card.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/features/my_booking_section/widget/status_chip.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;

  const BookingCard({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    final status = booking['status'] ?? 'pending';
    final rejectReason = booking['reject_reason']?.toString();

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.only(bottom: 16),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // العنوان
            Text(
              booking['property_title'] ?? 'عقار غير محدد',
              style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 12),

            // التفاصيل
            _infoRow(Icons.home_outlined, booking['property_type'] ?? 'غير محدد', Colors.blue[700]!),
            if (booking['property_type'] == "بيع")
              _infoRow(Icons.monetization_on_outlined, "${booking['selling_price'] ?? "غير محدد"} ${booking['selling_price_currency'] ?? "غير محدد"}", Colors.green[700]!),

            if (booking['property_type'] == "إيجار") ...[
              _infoRow(Icons.calendar_today_outlined, "${booking['check_in']} → ${booking['check_out']}", Colors.orange[700]!),
              _infoRow(Icons.people_outlined, "${booking['guests']} أشخاص", Colors.purple[700]!),
            ],

            const SizedBox(height: 16),

            // الحالة
            Row(
              children: [
                Text("الحالة: ", style: GoogleFonts.cairo(fontWeight: FontWeight.w600, color: Colors.grey[800])),
                StatusChip(status: status),
              ],
            ),

            // سبب الرفض
            if (status == 'rejected' && rejectReason != null && rejectReason.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, color: Colors.red[700], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "سبب الرفض: $rejectReason",
                        style: GoogleFonts.cairo(color: Colors.red[700], fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 12),

            // تاريخ الطلب
            Text(
              "تم الطلب: ${_formatDate(booking['created_at'])}",
              style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: iconColor),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.cairo(fontSize: 14, color: Colors.black87),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(dynamic timestamp) {
    if (timestamp is Timestamp) {
      final date = timestamp.toDate();
      return "${date.day}/${date.month}/${date.year}";
    }
    return 'غير معروف';
  }
}