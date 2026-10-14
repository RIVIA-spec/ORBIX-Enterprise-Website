import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';
import 'package:url_launcher/url_launcher.dart';

class CommissionPaymentPage extends StatefulWidget {
  final String transactionId;

  const CommissionPaymentPage({super.key, required this.transactionId});

  @override
  State<CommissionPaymentPage> createState() => _CommissionPaymentPageState();
}

class _CommissionPaymentPageState extends State<CommissionPaymentPage> {
  final ContractService _service = ContractService();
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'دفع عمولة Orbix'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'سيتم فتح صفحة Stripe لتحصيل عمولة Orbix فقط. لا يتم تمرير ثمن العقار أو الإيجار أو الحجز إلى Stripe في هذه المرحلة.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _loading ? null : _openCheckout,
              icon: _loading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.open_in_browser),
              label: const Text('فتح صفحة الدفع'),
            ),
            const SizedBox(height: 12),
            Text(
              'نجاح الدفع يعتمد على Stripe webhook وتحديث Firestore، وليس على عودة المتصفح.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openCheckout() async {
    setState(() => _loading = true);
    try {
      final url = await _service.createCommissionCheckout(widget.transactionId);
      final uri = Uri.parse(url);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      Get.snackbar('تعذر فتح الدفع', 'تحقق من استحقاق العمولة وحاول مرة أخرى.', snackPosition: SnackPosition.BOTTOM);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
