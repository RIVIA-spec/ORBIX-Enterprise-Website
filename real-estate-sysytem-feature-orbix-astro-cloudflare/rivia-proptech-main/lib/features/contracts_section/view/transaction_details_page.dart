import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/features/contracts_section/model/contract_model.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';
import 'package:real_estate_app/features/contracts_section/view/commission_payment_page.dart';
import 'package:real_estate_app/features/contracts_section/view/contract_details_page.dart';
import 'package:real_estate_app/features/contracts_section/view/contract_signing_webview.dart';

class TransactionDetailsPage extends StatefulWidget {
  final String transactionId;

  const TransactionDetailsPage({super.key, required this.transactionId});

  @override
  State<TransactionDetailsPage> createState() => _TransactionDetailsPageState();
}

class _TransactionDetailsPageState extends State<TransactionDetailsPage> {
  final ContractService _service = ContractService();
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final userCtr = Get.find<UserController>();
    return Scaffold(
      appBar: CustomAppBar(title: 'تفاصيل المعاملة'),
      body: StreamBuilder<TransactionModel?>(
        stream: _service.watchTransaction(widget.transactionId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
          if (snapshot.hasError) return const Center(child: Text('تعذر تحميل المعاملة'));
          final transaction = snapshot.data;
          if (transaction == null) return const Center(child: Text('المعاملة غير موجودة'));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _InfoCard(title: transaction.typeLabel, rows: [
                'دور Orbix: وسيط ومنصة توثيق',
                'الحالة: ${transaction.statusLabel}',
                'الطرف الأول: ${transaction.partyAUid}',
                'الطرف الثاني: ${transaction.partyBUid}',
              ]),
              const SizedBox(height: 12),
              _InfoCard(title: 'العقد', rows: [
                transaction.contractId == null ? 'لم يتم إنشاء عقد بعد.' : 'رقم العقد: ${transaction.contractId}',
              ]),
              if (transaction.contractId != null) ...[
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => Get.to(() => ContractDetailsPage(contractId: transaction.contractId!)),
                  icon: const Icon(Icons.description_outlined),
                  label: const Text('فتح العقد'),
                ),
              ],
              const SizedBox(height: 12),
              _InfoCard(title: 'الإتمام', rows: [
                'تأكيد الطرف الأول: ${transaction.partyAConfirmedAt == null ? 'لم يتم' : _format(transaction.partyAConfirmedAt!)}',
                'تأكيد الطرف الثاني: ${transaction.partyBConfirmedAt == null ? 'لم يتم' : _format(transaction.partyBConfirmedAt!)}',
              ]),
              const SizedBox(height: 12),
              _InfoCard(title: 'عمولة Orbix', rows: [
                'الحالة: ${transaction.commission.statusLabel}',
                'القيمة: ${(transaction.commission.amount / 100).toStringAsFixed(2)} ${transaction.commission.currency.toUpperCase()}',
                'الدافع: ${transaction.commission.payerUid}',
              ]),
              const SizedBox(height: 12),
              _AuditList(stream: _service.watchTransactionAudit(transaction.id)),
              const SizedBox(height: 20),
              if (transaction.contractId == null)
                ElevatedButton.icon(
                  onPressed: _busy ? null : () => _createContract(transaction.id),
                  icon: const Icon(Icons.add),
                  label: const Text('إنشاء عقد مباشر بين الطرفين'),
                ),
              if (transaction.canConfirm(uid))
                ElevatedButton.icon(
                  onPressed: _busy ? null : () => _confirm(transaction.id),
                  icon: const Icon(Icons.task_alt),
                  label: const Text('تأكيد إتمام المعاملة'),
                ),
              if (transaction.canPayCommission(uid))
                ElevatedButton.icon(
                  onPressed: _busy ? null : () => Get.to(() => CommissionPaymentPage(transactionId: transaction.id)),
                  icon: const Icon(Icons.payments_outlined),
                  label: const Text('دفع عمولة Orbix'),
                ),
              if (userCtr.isAdmin.value || userCtr.isOwner.value)
                Wrap(
                  spacing: 8,
                  children: [
                    OutlinedButton(onPressed: _busy ? null : () => _review(transaction.id, 'approve'), child: const Text('اعتماد')),
                    OutlinedButton(onPressed: _busy ? null : () => _review(transaction.id, 'reject'), child: const Text('رفض')),
                    OutlinedButton(onPressed: _busy ? null : () => _review(transaction.id, 'dispute'), child: const Text('نزاع')),
                  ],
                ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _createContract(String transactionId) async {
    setState(() => _busy = true);
    try {
      final result = await _service.createDirectPartyContract(transactionId: transactionId);
      if (result.signingUrl.isNotEmpty) {
        await Get.to(() => ContractSigningWebView(signingUrl: result.signingUrl));
      }
    } catch (_) {
      Get.snackbar('تعذر إنشاء العقد', 'تحقق من بيانات الطرفين وحاول مرة أخرى.', snackPosition: SnackPosition.BOTTOM);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirm(String transactionId) async {
    setState(() => _busy = true);
    try {
      await _service.confirmTransactionCompletion(transactionId);
    } catch (_) {
      Get.snackbar('تعذر تأكيد الإتمام', 'قد تكون أكدت مسبقا أو لا تملك صلاحية التأكيد.', snackPosition: SnackPosition.BOTTOM);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _review(String transactionId, String decision) async {
    setState(() => _busy = true);
    try {
      await _service.reviewTransactionCompletion(transactionId: transactionId, decision: decision);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _format(DateTime date) => DateFormat('yyyy/MM/dd HH:mm').format(date);
}

class _AuditList extends StatelessWidget {
  final Stream<List<AuditEventModel>> stream;

  const _AuditList({required this.stream});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<AuditEventModel>>(
      stream: stream,
      builder: (context, snapshot) {
        final rows = (snapshot.data ?? const <AuditEventModel>[])
            .map((event) => '${event.type} - ${event.actorType}${event.timestamp == null ? '' : ' - ${DateFormat('yyyy/MM/dd HH:mm').format(event.timestamp!)}'}')
            .toList();
        return _InfoCard(title: 'سجل الأحداث', rows: rows.isEmpty ? ['لا توجد أحداث بعد.'] : rows);
      },
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<String> rows;

  const _InfoCard({required this.title, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            ...rows.map((row) => Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(row))),
          ],
        ),
      ),
    );
  }
}
