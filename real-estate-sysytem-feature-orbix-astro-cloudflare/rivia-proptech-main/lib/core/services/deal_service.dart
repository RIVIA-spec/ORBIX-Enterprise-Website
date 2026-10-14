import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:real_estate_app/core/business/business_rules.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';

class DealService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<String> createDeal({
    required Map<String, dynamic> property,
    required String customerUserId,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    String? customerNote,
  }) async {
    final normalizedProperty = normalizePropertyMap(property);
    final listingType = getListingType(normalizedProperty);
    final dealType = getDealType(listingType);
    final commissionRate = getCommissionRate(listingType);
    final totalAmount = getTotalAmountFromProperty(normalizedProperty);
    final commissionAmount = getCommissionAmount(
      listingType: listingType,
      totalAmount: totalAmount,
    );

    final ownerUserId = (normalizedProperty['ownerId'] ?? '').toString();
    final propertyId = (normalizedProperty['id'] ?? '').toString();

    if (ownerUserId.isEmpty) {
      throw Exception('ownerId غير موجود في العقار');
    }

    if (propertyId.isEmpty) {
      throw Exception('id غير موجود في العقار');
    }

    final doc = await _firestore.collection('deals').add({
      'propertyId': propertyId,
      'listingType': listingType,
      'dealType': dealType,
      'ownerUserId': ownerUserId,
      'customerUserId': customerUserId,
      'customerName': customerName ?? '',
      'customerPhone': customerPhone ?? '',
      'customerEmail': customerEmail ?? '',
      'customerNote': customerNote ?? '',
      'totalAmount': totalAmount,
      'commissionType': commissionRate != null ? 'percentage' : 'fixed',
      'commissionRate': commissionRate,
      'commissionAmount': commissionAmount,
      'contractStatus': 'pending',
      'paymentStatus': 'pending',
      'status': 'pending',
      'propertyTitle': normalizedProperty['title'] ?? '',
      'propertyTypeRaw': normalizedProperty['property_type'] ?? '',
      'createdAt': FieldValue.serverTimestamp(),
    });

    return doc.id;
  }
}
