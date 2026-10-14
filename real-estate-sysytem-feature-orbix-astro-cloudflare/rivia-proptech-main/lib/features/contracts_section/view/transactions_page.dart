import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/features/contracts_section/model/contract_model.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';
import 'package:real_estate_app/features/contracts_section/view/transaction_details_page.dart';

class TransactionsPage extends StatelessWidget {
  final ContractService _service = ContractService();

  TransactionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final userCtr = Get.find<UserController>();
    return Scaffold(
      appBar: CustomAppBar(title: 'المعاملات'),
      body: Obx(() {
        if (!userCtr.isLoggedIn.value) {
          return const _EmptyState(title: 'تسجيل الدخول مطلوب', subtitle: 'سجل دخولك لعرض معاملاتك.');
        }
        return StreamBuilder<List<TransactionModel>>(
          stream: _service.watchMyTransactions(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return _EmptyState(title: 'تعذر تحميل المعاملات', subtitle: 'حاول مرة أخرى.', onRetry: () {});
            }
            final transactions = snapshot.data ?? const [];
            if (transactions.isEmpty) {
              return const _EmptyState(title: 'لا توجد معاملات', subtitle: 'ستظهر هنا معاملات البيع والإيجار والحجوزات المرتبطة بك.');
            }
            return RefreshIndicator(
              onRefresh: () async {},
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: transactions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) => _TransactionTile(transaction: transactions[index]),
              ),
            );
          },
        );
      }),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final TransactionModel transaction;

  const _TransactionTile({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final date = transaction.createdAt == null ? '' : DateFormat('yyyy/MM/dd').format(transaction.createdAt!);
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.teal.shade50,
          child: Icon(Icons.swap_horiz, color: Colors.teal.shade700),
        ),
        title: Text(transaction.typeLabel, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text([transaction.statusLabel, transaction.commission.statusLabel, date].where((item) => item.isNotEmpty).join(' - ')),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
        onTap: () => Get.to(() => TransactionDetailsPage(transactionId: transaction.id)),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onRetry;

  const _EmptyState({required this.title, required this.subtitle, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.receipt_long_outlined, size: 56, color: Colors.grey.shade500),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(subtitle, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade700)),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
            ],
          ],
        ),
      ),
    );
  }
}
