import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/features/contracts_section/model/contract_model.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';
import 'package:real_estate_app/features/contracts_section/view/contract_signing_webview.dart';

class ContractDetailsPage extends StatefulWidget {
  final String contractId;

  const ContractDetailsPage({super.key, required this.contractId});

  @override
  State<ContractDetailsPage> createState() => _ContractDetailsPageState();
}

class _ContractDetailsPageState extends State<ContractDetailsPage> {
  final ContractService _service = ContractService();
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    return Scaffold(
      appBar: CustomAppBar(title: 'تفاصيل العقد'),
      body: StreamBuilder<ContractModel?>(
        stream: _service.watchContract(widget.contractId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) return const _StateMessage(title: 'تعذر تحميل العقد');
          final contract = snapshot.data;
          if (contract == null) return const _StateMessage(title: 'العقد غير موجود');
          final canSign = contract.requiresSignatureFrom(uid);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _InfoCard(
                title: 'العقد المباشر',
                rows: [
                  'الحالة: ${contract.statusLabel}',
                  'المزود: ${contract.provider}',
                  'المعاملة: ${contract.transactionId}',
                  if (contract.expiresAt != null) 'ينتهي: ${DateFormat('yyyy/MM/dd').format(contract.expiresAt!)}',
                ],
              ),
              const SizedBox(height: 12),
              _InfoCard(
                title: 'الأطراف',
                rows: [
                  'الطرف الأول: ${contract.partyAUid}',
                  'الطرف الثاني: ${contract.partyBUid}',
                ],
              ),
              const SizedBox(height: 12),
              _AuditList(stream: _service.watchContractAudit(contract.id)),
              if (contract.signedDocumentStoragePath != null) ...[
                const SizedBox(height: 12),
                _InfoCard(title: 'الملف الموقع', rows: [contract.signedDocumentStoragePath!]),
              ],
              const SizedBox(height: 20),
              if (canSign)
                ElevatedButton.icon(
                  onPressed: _loading ? null : () => _openSigning(contract.id),
                  icon: _loading
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.edit_document),
                  label: const Text('توقيع العقد'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 52),
                    backgroundColor: Colors.blue.shade700,
                    foregroundColor: Colors.white,
                  ),
                )
              else
                Text(
                  'لا يوجد توقيع مطلوب منك حاليا. تعتمد الحالة على تحديث DocuSeal في Firestore.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade700),
                ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openSigning(String contractId) async {
    setState(() => _loading = true);
    try {
      final session = await _service.getSigningSession(contractId);
      await Get.to(() => ContractSigningWebView(signingUrl: session.signingUrl));
      Get.snackbar('تم إغلاق التوقيع', 'سيتم عرض الحالة الحقيقية بعد وصول تحديث DocuSeal.', snackPosition: SnackPosition.BOTTOM);
    } catch (_) {
      Get.snackbar('تعذر فتح التوقيع', 'تحقق من أن دورك مطلوب الآن ثم حاول مرة أخرى.', snackPosition: SnackPosition.BOTTOM);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _AuditList extends StatelessWidget {
  final Stream<List<AuditEventModel>> stream;

  const _AuditList({required this.stream});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<AuditEventModel>>(
      stream: stream,
      builder: (context, snapshot) {
        final events = snapshot.data ?? const [];
        return _InfoCard(
          title: 'سجل الأحداث',
          rows: events.isEmpty
              ? ['لا توجد أحداث بعد.']
              : events.map((event) {
                  final date = event.timestamp == null ? '' : DateFormat('yyyy/MM/dd HH:mm').format(event.timestamp!);
                  return '${event.type} - ${event.actorType}${date.isEmpty ? '' : ' - $date'}';
                }).toList(),
        );
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
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            ...rows.map((row) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(row),
                )),
          ],
        ),
      ),
    );
  }
}

class _StateMessage extends StatelessWidget {
  final String title;

  const _StateMessage({required this.title});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text(title, textAlign: TextAlign.center));
  }
}
