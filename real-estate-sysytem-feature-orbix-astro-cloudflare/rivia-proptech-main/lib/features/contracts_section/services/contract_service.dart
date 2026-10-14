import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:real_estate_app/features/contracts_section/model/contract_model.dart';

class ContractService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Stream<List<TransactionModel>> watchMyTransactions() {
    final uid = _auth.currentUser?.uid;
    if (uid == null || uid.isEmpty) return Stream.value(const []);
    return _firestore
        .collection('transactions')
        .where('partyUserIds', arrayContains: uid)
        .snapshots()
        .map((snapshot) {
      final items = snapshot.docs.map((doc) => TransactionModel.fromSnapshot(doc)).toList();
      items.sort((a, b) {
        final aDate = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bDate = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bDate.compareTo(aDate);
      });
      return items;
    });
  }

  Stream<TransactionModel?> watchTransaction(String transactionId) {
    return _firestore
        .collection('transactions')
        .doc(transactionId)
        .snapshots()
        .map((doc) => doc.exists ? TransactionModel.fromSnapshot(doc) : null);
  }

  Stream<List<ContractModel>> watchMyContracts() {
    final uid = _auth.currentUser?.uid;
    if (uid == null || uid.isEmpty) return Stream.value(const []);
    return _firestore
        .collection('contracts')
        .where('partyUserIds', arrayContains: uid)
        .snapshots()
        .map((snapshot) {
      final items = snapshot.docs.map((doc) => ContractModel.fromSnapshot(doc)).toList();
      items.sort((a, b) {
        final aDate = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bDate = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bDate.compareTo(aDate);
      });
      return items;
    });
  }

  Stream<ContractModel?> watchContract(String contractId) {
    return _firestore
        .collection('contracts')
        .doc(contractId)
        .snapshots()
        .map((doc) => doc.exists ? ContractModel.fromSnapshot(doc) : null);
  }

  Stream<List<AuditEventModel>> watchTransactionAudit(String transactionId) {
    return _firestore
        .collection('transactions')
        .doc(transactionId)
        .collection('auditEvents')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => AuditEventModel.fromSnapshot(doc)).toList());
  }

  Stream<List<AuditEventModel>> watchContractAudit(String contractId) {
    return _firestore
        .collection('contracts')
        .doc(contractId)
        .collection('auditEvents')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => AuditEventModel.fromSnapshot(doc)).toList());
  }

  Future<CreateContractResult> createDirectPartyContract({
    String? transactionId,
    String? dealId,
    String? bookingId,
  }) async {
    final callable = _functions.httpsCallable('createDirectPartyContract');
    final result = await callable.call({
      if (transactionId != null) 'transactionId': transactionId,
      if (dealId != null) 'dealId': dealId,
      if (bookingId != null) 'bookingId': bookingId,
    });
    return CreateContractResult.fromMap(Map<String, dynamic>.from(result.data as Map));
  }

  Future<SigningSession> getSigningSession(String contractId) async {
    final callable = _functions.httpsCallable('getContractSigningSession');
    final result = await callable.call({'contractId': contractId});
    return SigningSession.fromMap(Map<String, dynamic>.from(result.data as Map));
  }

  Future<void> confirmTransactionCompletion(String transactionId) async {
    final callable = _functions.httpsCallable('confirmTransactionCompletion');
    await callable.call({'transactionId': transactionId});
  }

  Future<void> reviewTransactionCompletion({
    required String transactionId,
    required String decision,
  }) async {
    final callable = _functions.httpsCallable('reviewTransactionCompletion');
    await callable.call({'transactionId': transactionId, 'decision': decision});
  }

  Future<String> createCommissionCheckout(String transactionId) async {
    final callable = _functions.httpsCallable('createCommissionCheckout');
    final result = await callable.call({'transactionId': transactionId});
    final data = Map<String, dynamic>.from(result.data as Map);
    return (data['checkoutUrl'] ?? '').toString();
  }
}

class CreateContractResult {
  final String transactionId;
  final String contractId;
  final String status;
  final String signingUrl;
  final String signingParty;

  CreateContractResult({
    required this.transactionId,
    required this.contractId,
    required this.status,
    required this.signingUrl,
    required this.signingParty,
  });

  factory CreateContractResult.fromMap(Map<String, dynamic> data) {
    return CreateContractResult(
      transactionId: (data['transactionId'] ?? '').toString(),
      contractId: (data['contractId'] ?? '').toString(),
      status: (data['status'] ?? '').toString(),
      signingUrl: (data['signingUrl'] ?? '').toString(),
      signingParty: (data['signingParty'] ?? '').toString(),
    );
  }
}

class SigningSession {
  final String contractId;
  final String signingUrl;
  final String signingParty;
  final String status;

  SigningSession({
    required this.contractId,
    required this.signingUrl,
    required this.signingParty,
    required this.status,
  });

  factory SigningSession.fromMap(Map<String, dynamic> data) {
    return SigningSession(
      contractId: (data['contractId'] ?? '').toString(),
      signingUrl: (data['signingUrl'] ?? '').toString(),
      signingParty: (data['signingParty'] ?? '').toString(),
      status: (data['status'] ?? '').toString(),
    );
  }
}
