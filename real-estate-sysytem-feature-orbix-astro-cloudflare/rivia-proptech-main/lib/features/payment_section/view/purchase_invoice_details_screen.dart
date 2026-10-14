import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';

class PurchaseInvoiceDetailsScreen extends StatelessWidget {
  final String invoiceId;
  final String propertyTitle;

  const PurchaseInvoiceDetailsScreen({
    super.key,
    required this.invoiceId,
    required this.propertyTitle,
  });

  String _formatDate(dynamic value) {
    if (value is Timestamp) {
      return DateFormat('dd/MM/yyyy - hh:mm a').format(value.toDate());
    }
    return 'غير متوفر';
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'قيد المعالجة';
      case 'contract_created':
        return 'تم إنشاء العقد';
      case 'invoice_created':
        return 'تم إنشاء الفاتورة';
      case 'under_review':
        return 'قيد المراجعة';
      case 'payment_under_review':
        return 'الدفع قيد المراجعة';
      case 'paid':
        return 'تم الدفع';
      case 'submitted':
        return 'تم إرسال الإثبات';
      case 'approved':
        return 'تمت الموافقة';
      case 'rejected':
        return 'مرفوض';
      case 'cancelled':
        return 'ملغي';
      case 'expired':
        return 'منتهية الصلاحية';
      default:
        return status.isEmpty ? 'غير متوفر' : status;
    }
  }

  Color _statusBackgroundColor(String status) {
    switch (status) {
      case 'paid':
      case 'approved':
        return Colors.green.shade100;
      case 'under_review':
      case 'payment_under_review':
      case 'submitted':
        return Colors.orange.shade100;
      case 'pending':
      case 'invoice_created':
      case 'contract_created':
        return Colors.blue.shade100;
      case 'rejected':
      case 'cancelled':
      case 'expired':
        return Colors.red.shade100;
      default:
        return Colors.grey.shade200;
    }
  }

  Color _statusTextColor(String status) {
    switch (status) {
      case 'paid':
      case 'approved':
        return Colors.green.shade800;
      case 'under_review':
      case 'payment_under_review':
      case 'submitted':
        return Colors.orange.shade900;
      case 'pending':
      case 'invoice_created':
      case 'contract_created':
        return Colors.blue.shade800;
      case 'rejected':
      case 'cancelled':
      case 'expired':
        return Colors.red.shade800;
      default:
        return Colors.grey.shade800;
    }
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(
        fontSize: 18,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: GoogleFonts.cairo(
                fontSize: 14,
                color: Colors.grey.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            flex: 6,
            child: Text(
              value.isEmpty ? 'غير متوفر' : value,
              textAlign: TextAlign.start,
              style: GoogleFonts.cairo(
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard({required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'تفاصيل الفاتورة'),
      body: FutureBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        future: FirebaseFirestore.instance
            .collection('invoices')
            .doc(invoiceId)
            .get(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'تعذر تحميل الفاتورة',
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final data = snapshot.data?.data();
          if (data == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'الفاتورة غير موجودة',
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final amount = (data['amount'] ?? '').toString();
          final currency = (data['currency'] ?? '').toString();
          final paymentMethod = (data['paymentMethod'] ?? '').toString();
          final status = (data['status'] ?? '').toString();
          final statusLabel = _statusLabel(status);
          final description = (data['description'] ?? '').toString();
          final createdAt = _formatDate(data['createdAt']);
          final resolvedPropertyTitle =
              (data['propertyTitle'] ?? propertyTitle).toString();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('معلومات الفاتورة'),
                const SizedBox(height: 12),
                _infoCard(
                  children: [
                    _detailRow('رقم الفاتورة', snapshot.data!.id),
                    _detailRow('العقار', resolvedPropertyTitle),
                    _detailRow('المبلغ', amount),
                    _detailRow('العملة', currency),
                    _detailRow('طريقة الدفع', paymentMethod),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 4,
                            child: Text(
                              'الحالة',
                              style: GoogleFonts.cairo(
                                fontSize: 14,
                                color: Colors.grey.shade700,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 6,
                            child: Align(
                              alignment: Alignment.centerRight,
                              child: _PurchaseStatusChip(
                                label: statusLabel,
                                backgroundColor:
                                    _statusBackgroundColor(status),
                                textColor: _statusTextColor(status),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    _detailRow('الوصف', description),
                    _detailRow('تاريخ الإنشاء', createdAt),
                  ],
                ),
                const SizedBox(height: 24),
                _sectionTitle('تعليمات التحويل البنكي'),
                const SizedBox(height: 12),
                _infoCard(
                  children: const [
                    SizedBox(height: 4),
                    _InvoiceStaticRow(
                      label: 'اسم المستفيد',
                      value: 'Rivia Proptech LLC',
                    ),
                    _InvoiceStaticRow(
                      label: 'اسم البنك',
                      value: 'Sample Bank',
                    ),
                    _InvoiceStaticRow(
                      label: 'رقم الحساب / IBAN',
                      value: 'SA00 0000 0000 0000 0000 0000',
                    ),
                    _InvoiceStaticRow(
                      label: 'SWIFT',
                      value: 'SAMPBANKXXX',
                    ),
                    _InvoiceStaticRow(
                      label: 'ملاحظات التحويل',
                      value: 'يرجى كتابة رقم الفاتورة في تفاصيل الحوالة',
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'رفع إثبات الدفع',
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                    onPressed: () {
                      showSnackBar(
                        'قريباً',
                        'ميزة رفع إثبات الدفع غير مفعلة بعد',
                        backgroundColor: Colors.orange,
                        colorText: Colors.white,
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _PurchaseStatusChip extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;

  const _PurchaseStatusChip({
    required this.label,
    required this.backgroundColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: GoogleFonts.cairo(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: textColor,
        ),
      ),
    );
  }
}

class _InvoiceStaticRow extends StatelessWidget {
  final String label;
  final String value;

  const _InvoiceStaticRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: GoogleFonts.cairo(
                fontSize: 14,
                color: Colors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            flex: 6,
            child: Text(
              value,
              style: GoogleFonts.cairo(
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
