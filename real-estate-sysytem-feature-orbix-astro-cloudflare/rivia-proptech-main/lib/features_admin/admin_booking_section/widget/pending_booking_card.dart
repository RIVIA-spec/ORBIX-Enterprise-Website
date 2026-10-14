// lib/features/admin/view/widgets/pending_booking_card.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/image_preview_widget.dart';
import 'package:real_estate_app/features_admin/admin_booking_section/widget/reject_confirm_dialog.dart';

class PendingBookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  final VoidCallback onConfirm;
  final Function(String?) onReject;

  const PendingBookingCard({
    super.key,
    required this.booking,
    required this.onConfirm,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // صورة العقار + العنوان
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: ImagePreviewWidget(
                    imageUrl: booking['property_type'] == "فندق" 
                        ? (booking['hotelImage'] ?? '')
                        : (booking['propertyImage'] ?? ''),
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booking['property_type'] == "فندق"
                            ? (booking['hotelName'] ?? "")
                            : (booking['propertyTitle'] ?? ""),
                        style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        booking['property_type'] == "فندق"
                            ? "فندق - ${booking['roomTypeTitle'] ?? ""}"
                            : (booking['property_type'] ?? ""),
                        style: GoogleFonts.cairo(fontSize: 13, color: Colors.blue[700]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 20),

            // تفاصيل الحجز
            _infoRow(Icons.person, "العميل: ${booking['userName'] ?? ""}"),
            _infoRow(Icons.email, "الإيميل: ${booking['email'] ?? ""}"),
            
            // حجز فندق
            if(booking['property_type'] == "فندق") ...[
              _infoRow(Icons.hotel, "الفندق: ${booking['hotelName'] ?? ""}"),
              _infoRow(Icons.bed, "نوع الغرفة: ${booking['roomTypeTitle'] ?? ""}"),
              _infoRow(Icons.nightlight, "نوع الحجز: ${booking['booking_type'] ?? "ليلي"}"),
              _infoRow(
                Icons.calendar_today,
                "من: ${booking['check_in'] ?? ""} ← إلى: ${booking['check_out'] ?? ""}",
              ),
              _infoRow(Icons.people, "الضيوف: ${booking['guests'] ?? ""}"),
              if(booking['nights'] != null && booking['nights'] > 0)
                _infoRow(Icons.event, "عدد ${booking['booking_type'] == 'ليلي' ? 'الليالي' : 'الأيام'}: ${booking['nights']}"),
              if(booking['total_amount'] != null && booking['total_amount'].toString().isNotEmpty)
                _infoRow(
                  Icons.attach_money,
                  "المبلغ الإجمالي: ${booking['total_amount']} ${booking['booking_type'] == 'ليلي' ? (booking['nightly_currency'] ?? '') : (booking['daily_price_currency'] ?? '')}",
                ),
            ]
            // حجز عقار إيجار
            else if(booking['property_type'] == "إيجار") ...[
              _infoRow(
                Icons.calendar_today,
                "من: ${booking['check_in'] ?? ""} ← إلى: ${booking['check_out'] ?? ""}",
              ),
              _infoRow(Icons.people, "الضيوف: ${booking['guests'] ?? ""}"),
            ]
            // حجز عقار بيع
            else if(booking['property_type'] == "بيع") ...[
              _infoRow(Icons.attach_money, "السعر: ${booking['selling_price'] ?? ""} ${booking['selling_price_currency'] ?? ""}"),
            ],

            const SizedBox(height: 12),

            // الأزرار
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onConfirm,
                    icon: const Icon(Icons.check, size: 18),
                    label: Text("تأكيد", style: GoogleFonts.cairo()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => showRejectDialog(context, onReject),
                    icon: const Icon(Icons.close, size: 18, color: Colors.red),
                    label: Text("رفض", style: GoogleFonts.cairo(color: Colors.red)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 6),
          Text(text, style: GoogleFonts.cairo(fontSize: 14)),
        ],
      ),
    );
  }
}