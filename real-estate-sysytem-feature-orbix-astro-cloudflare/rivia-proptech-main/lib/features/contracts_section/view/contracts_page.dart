import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/features/contracts_section/model/contract_model.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';
import 'package:real_estate_app/features/contracts_section/view/contract_details_page.dart';

class ContractsPage extends StatelessWidget {
  final bool partnerView;
  final ContractService _service = ContractService();

  ContractsPage({
    super.key,
    this.partnerView = false,
  });

  @override
  Widget build(BuildContext context) {
    final userCtr = Get.find<UserController>();

    return Scaffold(
      appBar: CustomAppBar(title: partnerView ? 'عقود الشريك' : 'عقودي'),
      body: Obx(() {
        if (!userCtr.isLoggedIn.value) {
          return const _MessageState(
            icon: Icons.lock_outline,
            title: 'تسجيل الدخول مطلوب',
            subtitle: 'سجل دخولك لعرض العقود المرتبطة بحسابك.',
          );
        }

        return StreamBuilder<List<ContractModel>>(
          stream: _service.watchMyContracts(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return const _MessageState(
                icon: Icons.error_outline,
                title: 'تعذر تحميل العقود',
                subtitle: 'تحقق من الاتصال وحاول مرة أخرى.',
              );
            }

            final contracts = snapshot.data ?? const [];
            if (contracts.isEmpty) {
              return const _MessageState(
                icon: Icons.description_outlined,
                title: 'لا توجد عقود',
                subtitle: 'ستظهر هنا العقود التي تكون طرفا فيها.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: contracts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final contract = contracts[index];
                return _ContractTile(contract: contract);
              },
            );
          },
        );
      }),
    );
  }
}

class _ContractTile extends StatelessWidget {
  final ContractModel contract;

  const _ContractTile({required this.contract});

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('yyyy/MM/dd');
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade50,
          child: Icon(Icons.assignment_outlined, color: Colors.blue.shade700),
        ),
        title: Text(
          'اتفاقية خدمة',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          [
            contract.statusLabel,
            if (contract.createdAt != null) formatter.format(contract.createdAt!),
          ].join(' - '),
        ),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
        onTap: () => Get.to(() => ContractDetailsPage(contractId: contract.id)),
      ),
    );
  }
}

class _MessageState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _MessageState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: Colors.grey.shade500),
            const SizedBox(height: 14),
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
