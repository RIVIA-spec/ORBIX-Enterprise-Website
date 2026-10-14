import 'package:real_estate_app/core/mappers/property_mapper.dart';

String normalizePropertyType(dynamic rawType) {
  return normalizePropertyTypeValue(rawType);
}

bool isSaleProperty(Map<String, dynamic> property) {
  return isSaleMap(property);
}

bool isRentProperty(Map<String, dynamic> property) {
  return isRentMap(property);
}

String getListingType(Map<String, dynamic> property) {
  final normalized = normalizePropertyMap(property);
  final propertyType = normalizePropertyType(normalized['property_type']);

  if (propertyType == kSalePropertyType) return 'sale';
  if (propertyType == kRentPropertyType) return 'long_rent';

  throw Exception('Unsupported property type: $propertyType');
}

String getDealType(String listingType) {
  switch (listingType) {
    case 'sale':
      return 'purchase';
    case 'long_rent':
      return 'lease';
    case 'short_rent':
      return 'booking';
    default:
      throw Exception('Unsupported listingType: $listingType');
  }
}

double? getCommissionRate(String listingType) {
  switch (listingType) {
    case 'sale':
      return 0.01;
    case 'short_rent':
      return 0.10;
    default:
      return null;
  }
}

double getCommissionAmount({
  required String listingType,
  required double totalAmount,
}) {
  switch (listingType) {
    case 'sale':
      return totalAmount * 0.01;
    case 'short_rent':
      return totalAmount * 0.10;
    case 'long_rent':
      return 25.0;
    default:
      throw Exception('Unsupported listingType: $listingType');
  }
}

double getTotalAmountFromProperty(Map<String, dynamic> property) {
  final normalized = normalizePropertyMap(property);
  final raw = (normalizedPropertyPrice(normalized) ?? '0')
      .toString()
      .replaceAll(',', '');
  return double.tryParse(raw) ?? 0;
}
