import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:real_estate_app/core/business/business_rules.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';
import 'package:real_estate_app/features/identify_section/view/identify_verification_screen.dart';
import 'package:real_estate_app/core/services/deal_service.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/widgets/custom_button.dart';
import 'package:real_estate_app/features/login_sction/view/login_screen.dart';
import 'package:real_estate_app/features/payment_section/view/pyament_screen.dart';
import 'package:real_estate_app/features/payment_section/view/purchase_invoice_details_screen.dart';
import 'package:real_estate_app/features/property_details_section/controller/property_details_controller.dart';
import 'package:real_estate_app/features/contracts_section/services/contract_service.dart';
import 'package:real_estate_app/features/contracts_section/view/contract_signing_webview.dart';

class PriceAndBooking extends StatefulWidget {
  final Map<String, dynamic> property;
  final String priceText;
  final bool isRent;

  const PriceAndBooking({
    super.key,
    required this.property,
    required this.priceText,
    required this.isRent,
  });

  @override
  State<PriceAndBooking> createState() => _PriceAndBookingState();
}

class _PriceAndBookingState extends State<PriceAndBooking> {
  final RxBool _isSubmittingPurchase = false.obs;
  final RxBool _isOpeningBooking = false.obs;

  Future<String> _createPurchaseInvoice({
    required String dealId,
    required String contractId,
    required String customerUserId,
    required Map<String, String>? purchaseContact,
  }) async {
    final property = normalizePropertyMap(widget.property);
    final propertyId = (property['id'] ?? '').toString();
    final ownerUserId = (property['ownerId'] ?? '').toString();
    final propertyTitle = (property['title'] ?? 'غير محدد').toString();
    final amount = getTotalAmountFromProperty(property);
    final currency = (normalizedPropertyCurrency(property) ?? 'SYP').toString();

    final invoiceRef =
        await FirebaseFirestore.instance.collection('invoices').add({
      'dealId': dealId,
      'contractId': contractId,
      'propertyId': propertyId,
      'customerUserId': customerUserId,
      'ownerUserId': ownerUserId,
      'customerName': purchaseContact?['customerName'] ?? '',
      'customerPhone': purchaseContact?['customerPhone'] ?? '',
      'customerEmail': purchaseContact?['customerEmail'] ?? '',
      'type': 'purchase',
      'amount': amount,
      'currency': currency,
      'description': 'دفعة شراء العقار: $propertyTitle',
      'paymentMethod': 'bank_transfer',
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'notes': purchaseContact?['customerNote'] ?? '',
    });

    return invoiceRef.id;
  }

  Future<Map<String, String>?> _showPurchaseConfirmationSheet({
    required String currentUserId,
    required UserController userCtr,
  }) async {
    final userDoc = await FirebaseFirestore.instance
        .collection('users')
        .doc(currentUserId)
        .get();

    final userData = userDoc.data() ?? <String, dynamic>{};
    final authEmail = FirebaseAuth.instance.currentUser?.email ?? '';
    final initialName = (userData['fullName'] ??
            userData['name'] ??
            userData['username'] ??
            userCtr.username.value)
        .toString()
        .trim();
    final initialPhone = (userData['phone'] ?? '').toString().trim();
    final initialEmail = (userData['email'] ?? authEmail).toString().trim();

    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: initialName);
    final phoneController = TextEditingController(text: initialPhone);
    final emailController = TextEditingController(text: initialEmail);
    final noteController = TextEditingController();

    final result = await Get.bottomSheet<Map<String, String>>(
      SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'تأكيد بيانات الشراء',
                    style: GoogleFonts.cairo(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: nameController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'الاسم الكامل',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'الاسم الكامل مطلوب';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'رقم الهاتف',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'رقم الهاتف مطلوب';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: emailController,
                    readOnly: true,
                    decoration: const InputDecoration(
                      labelText: 'البريد الإلكتروني',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'البريد الإلكتروني غير متوفر للحساب الحالي';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: noteController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'ملاحظة',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: CustomButton(
                      text: 'تأكيد وإرسال الطلب',
                      onPressed: () {
                        if (!formKey.currentState!.validate()) return;
                        Get.back(result: {
                          'customerName': nameController.text.trim(),
                          'customerPhone': phoneController.text.trim(),
                          'customerEmail': emailController.text.trim(),
                          'customerNote': noteController.text.trim(),
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      isScrollControlled: true,
    );

    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    noteController.dispose();
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final detailsCtr = Get.find<PropertyDetailsController>();
    final userCtr = Get.find<UserController>();
    final property = normalizePropertyMap(widget.property);
    final String status = detailsCtr.getBookingStatus(property);
    final bool isBooked = status.contains("محجوز") || status == "تم البيع";
    final bool isPurchaseProperty = !widget.isRent;
    final RxBool actionLoading =
        isPurchaseProperty ? _isSubmittingPurchase : _isOpeningBooking;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isBooked
              ? [Colors.red.shade600, Colors.red.shade800]
              : [Colors.blue.shade600, Colors.blue.shade800],
        ),
        boxShadow: [
          BoxShadow(
            color: (isBooked ? Colors.red : Colors.blue).withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.priceText,
            style: GoogleFonts.cairo(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              shadows: const [
                Shadow(
                  color: Colors.black26,
                  blurRadius: 5,
                  offset: Offset(0, 2),
                )
              ],
            ),
          ),
          if (widget.isRent)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Row(
                children: [
                  Icon(Icons.access_time_filled, color: Colors.white, size: 22),
                  SizedBox(width: 6),
                  Text(
                    "إيجار شهري",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withOpacity(0.25),
                width: 1.2,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isBooked
                      ? Icons.lock_outline_rounded
                      : Icons.check_circle_rounded,
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    status,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.cairo(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (!isBooked) ...[
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: isPurchaseProperty ? 62 : 56,
              child: CustomButton(
                text: isPurchaseProperty ? "شراء العقار" : "احجز الآن",
                leadingIcon: isPurchaseProperty
                    ? Icons.shopping_cart_checkout_rounded
                    : Icons.calendar_today_rounded,
                backgroundColor: Colors.white,
                foregroundColor:
                    isBooked ? Colors.red.shade700 : Colors.blue.shade700,
                fontSize: 17,
                fontWeight: FontWeight.w700,
                borderRadius: 28,
                isLoading: actionLoading,
                loadingText: isPurchaseProperty
                    ? "جاري إرسال الطلب..."
                    : "جاري فتح الحجز...",
                showInlineLoadingContent: true,
                loadingIndicatorSize: 18,
                onPressed: () async {
                  if (!userCtr.isLoggedIn.value) {
                    Get.to(() => LoginScreen());
                    return;
                  }

                  if (actionLoading.value) {
                    return;
                  }

                  try {
                    final currentUserId = userCtr.userId.value;

                    if (currentUserId.isEmpty) {
                      Get.snackbar(
                        'خطأ',
                        'تعذر معرفة المستخدم الحالي',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                      return;
                    }

                    actionLoading.value = true;

                    final verificationDoc = await FirebaseFirestore.instance
                        .collection('verifications')
                        .doc(currentUserId)
                        .get();

                    final verificationStatus =
                        verificationDoc.data()?['status'];

                    if (verificationStatus != 'verified') {
                      Get.snackbar(
                        'التحقق مطلوب',
                        'يجب التحقق من الهوية أولاً قبل إنشاء الصفقة',
                        snackPosition: SnackPosition.BOTTOM,
                      );

                      Get.to(() => IdentityVerificationScreen());
                      return;
                    }

                    Map<String, String>? purchaseContact;
                    if (isPurchaseProperty) {
                      purchaseContact = await _showPurchaseConfirmationSheet(
                        currentUserId: currentUserId,
                        userCtr: userCtr,
                      );

                      if (purchaseContact == null) {
                        return;
                      }
                    }

                    final dealFuture = DealService().createDeal(
                      property: property,
                      customerUserId: currentUserId,
                      customerName: purchaseContact?['customerName'],
                      customerPhone: purchaseContact?['customerPhone'],
                      customerEmail: purchaseContact?['customerEmail'],
                      customerNote: purchaseContact?['customerNote'],
                    );

                    if (isPurchaseProperty) {
                      final dealId = await dealFuture;
                      final contractResult =
                          await ContractService().createDirectPartyContract(dealId: dealId);

                      final invoiceId = await _createPurchaseInvoice(
                        dealId: dealId,
                        contractId: contractResult.contractId,
                        customerUserId: currentUserId,
                        purchaseContact: purchaseContact,
                      );

                      final queueAdminEmail = FirebaseFunctions.instance
                          .httpsCallable('queueAdminEmail');
                      await queueAdminEmail.call({
                        'emailType': 'purchase',
                        'dealId': dealId,
                        'contractId': contractResult.contractId,
                        'propertyId': property['id'] ?? '',
                        'propertyTitle': property['title'] ?? 'غير محدد',
                        'customerUserId': currentUserId,
                        'customerName': purchaseContact?['customerName'] ?? '',
                        'customerPhone':
                            purchaseContact?['customerPhone'] ?? '',
                        'customerEmail':
                            purchaseContact?['customerEmail'] ?? '',
                        'customerNote': purchaseContact?['customerNote'] ?? '',
                        'ownerUserId': property['ownerId'] ?? '',
                        'templateType': 'direct_party_contract',
                      });

                      Get.snackbar(
                        'تم',
                        'تم استلام طلب الشراء وإنشاء العقد وإرساله إلى الإدارة',
                        snackPosition: SnackPosition.BOTTOM,
                      );
                      if (contractResult.signingUrl.isNotEmpty) {
                        await Get.to(() => ContractSigningWebView(
                              signingUrl: contractResult.signingUrl,
                            ));
                      }
                      Get.to(() => PurchaseInvoiceDetailsScreen(
                            invoiceId: invoiceId,
                            propertyTitle: (property['title'] ?? '').toString(),
                          ));
                    } else {
                      Get.to(() => PaymentPage(
                            property: property,
                            dealIdFuture: dealFuture,
                          ));
                    }
                  } catch (e) {
                    Get.snackbar(
                      'خطأ',
                      'فشل إنشاء الصفقة: $e',
                      snackPosition: SnackPosition.BOTTOM,
                    );
                  } finally {
                    actionLoading.value = false;
                  }
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}
