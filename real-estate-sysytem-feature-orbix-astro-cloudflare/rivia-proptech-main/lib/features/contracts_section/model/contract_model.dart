import 'package:cloud_firestore/cloud_firestore.dart';

class ContractModel {
  final String id;
  final String transactionId;
  final String provider;
  final String providerSubmissionId;
  final String type;
  final String status;
  final String partyAUid;
  final String partyBUid;
  final String? signedDocumentStoragePath;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? expiresAt;

  ContractModel({
    required this.id,
    required this.transactionId,
    required this.provider,
    required this.providerSubmissionId,
    required this.type,
    required this.status,
    required this.partyAUid,
    required this.partyBUid,
    this.signedDocumentStoragePath,
    this.createdAt,
    this.updatedAt,
    this.expiresAt,
  });

  factory ContractModel.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return ContractModel(
      id: doc.id,
      transactionId: (data['transactionId'] ?? '').toString(),
      provider: (data['provider'] ?? '').toString(),
      providerSubmissionId: (data['providerSubmissionId'] ?? '').toString(),
      type: (data['type'] ?? '').toString(),
      status: (data['status'] ?? 'draft').toString(),
      partyAUid: (data['partyAUid'] ?? '').toString(),
      partyBUid: (data['partyBUid'] ?? '').toString(),
      signedDocumentStoragePath: data['signedDocumentStoragePath']?.toString(),
      createdAt: toDate(data['createdAt']),
      updatedAt: toDate(data['updatedAt']),
      expiresAt: toDate(data['expiresAt']),
    );
  }

  bool requiresSignatureFrom(String uid) {
    return (status == 'awaiting_party_a_signature' && partyAUid == uid) ||
        (status == 'awaiting_party_b_signature' && partyBUid == uid);
  }

  String get statusLabel {
    switch (status) {
      case 'draft':
        return 'مسودة';
      case 'awaiting_party_a_signature':
        return 'بانتظار توقيع الطرف الأول';
      case 'awaiting_party_b_signature':
        return 'بانتظار توقيع الطرف الثاني';
      case 'completed':
        return 'مكتمل';
      case 'declined':
        return 'مرفوض';
      case 'expired':
        return 'منتهي الصلاحية';
      case 'failed':
        return 'فشل';
      default:
        return status;
    }
  }
}

class TransactionModel {
  final String id;
  final String type;
  final String platformRole;
  final String dealStatus;
  final String? contractId;
  final String partyAUid;
  final String partyARole;
  final String partyBUid;
  final String partyBRole;
  final CommissionModel commission;
  final DateTime? partyAConfirmedAt;
  final DateTime? partyBConfirmedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TransactionModel({
    required this.id,
    required this.type,
    required this.platformRole,
    required this.dealStatus,
    required this.contractId,
    required this.partyAUid,
    required this.partyARole,
    required this.partyBUid,
    required this.partyBRole,
    required this.commission,
    this.partyAConfirmedAt,
    this.partyBConfirmedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory TransactionModel.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    final parties = (data['parties'] as Map<String, dynamic>?) ?? {};
    final completion = (data['completion'] as Map<String, dynamic>?) ?? {};
    return TransactionModel(
      id: doc.id,
      type: (data['type'] ?? '').toString(),
      platformRole: (data['platformRole'] ?? 'facilitator').toString(),
      dealStatus: (data['dealStatus'] ?? 'draft').toString(),
      contractId: data['contractId']?.toString(),
      partyAUid: (parties['partyAUid'] ?? '').toString(),
      partyARole: (parties['partyARole'] ?? '').toString(),
      partyBUid: (parties['partyBUid'] ?? '').toString(),
      partyBRole: (parties['partyBRole'] ?? '').toString(),
      commission: CommissionModel.fromMap(
        (data['commission'] as Map<String, dynamic>?) ?? const {},
      ),
      partyAConfirmedAt: toDate(completion['partyAConfirmedAt']),
      partyBConfirmedAt: toDate(completion['partyBConfirmedAt']),
      createdAt: toDate(data['createdAt']),
      updatedAt: toDate(data['updatedAt']),
    );
  }

  bool get hasBothConfirmations => partyAConfirmedAt != null && partyBConfirmedAt != null;

  bool canConfirm(String uid) {
    if (dealStatus != 'awaiting_party_confirmations') return false;
    if (uid == partyAUid) return partyAConfirmedAt == null;
    if (uid == partyBUid) return partyBConfirmedAt == null;
    return false;
  }

  bool canPayCommission(String uid) {
    return dealStatus == 'completed' &&
        commission.status == 'due' &&
        commission.payerUid == uid;
  }

  String get typeLabel {
    switch (type) {
      case 'property_sale':
        return 'بيع عقار';
      case 'property_rental':
        return 'إيجار عقار';
      case 'hotel_booking':
        return 'حجز فندق';
      default:
        return type;
    }
  }

  String get statusLabel {
    switch (dealStatus) {
      case 'draft':
        return 'مسودة';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'awaiting_party_confirmations':
        return 'بانتظار تأكيد الطرفين';
      case 'completed':
        return 'مكتملة';
      case 'cancelled':
        return 'ملغاة';
      case 'disputed':
        return 'متنازع عليها';
      default:
        return dealStatus;
    }
  }
}

class CommissionModel {
  final int amount;
  final String currency;
  final String status;
  final String payerUid;
  final String? checkoutSessionId;
  final String? paymentIntentId;
  final String? invoiceRef;
  final DateTime? paidAt;

  CommissionModel({
    required this.amount,
    required this.currency,
    required this.status,
    required this.payerUid,
    this.checkoutSessionId,
    this.paymentIntentId,
    this.invoiceRef,
    this.paidAt,
  });

  factory CommissionModel.fromMap(Map<String, dynamic> data) {
    return CommissionModel(
      amount: (data['amount'] is num) ? (data['amount'] as num).toInt() : 0,
      currency: (data['currency'] ?? 'usd').toString(),
      status: (data['status'] ?? 'not_due').toString(),
      payerUid: (data['payerUid'] ?? '').toString(),
      checkoutSessionId: data['checkoutSessionId']?.toString(),
      paymentIntentId: data['paymentIntentId']?.toString(),
      invoiceRef: data['invoiceRef']?.toString(),
      paidAt: toDate(data['paidAt']),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'not_due':
        return 'غير مستحقة';
      case 'due':
        return 'مستحقة';
      case 'checkout_open':
        return 'جلسة دفع مفتوحة';
      case 'paid':
        return 'مدفوعة';
      case 'failed':
        return 'فشل الدفع';
      case 'waived':
        return 'معفاة';
      default:
        return status;
    }
  }
}

class AuditEventModel {
  final String id;
  final String type;
  final String actorType;
  final String? actorUid;
  final DateTime? timestamp;

  AuditEventModel({
    required this.id,
    required this.type,
    required this.actorType,
    this.actorUid,
    this.timestamp,
  });

  factory AuditEventModel.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return AuditEventModel(
      id: doc.id,
      type: (data['type'] ?? '').toString(),
      actorType: (data['actorType'] ?? 'system').toString(),
      actorUid: data['actorUid']?.toString(),
      timestamp: toDate(data['timestamp']),
    );
  }
}

DateTime? toDate(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  return null;
}
