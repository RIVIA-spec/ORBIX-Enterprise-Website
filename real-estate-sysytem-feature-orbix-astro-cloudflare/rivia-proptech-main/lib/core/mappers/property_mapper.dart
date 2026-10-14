import 'package:flutter/material.dart';

const String kSalePropertyType = '\u0628\u064a\u0639';
const String kRentPropertyType = '\u0625\u064a\u062c\u0627\u0631';
const String kAvailableStatus = '\u0645\u062a\u0627\u062d';
const String kSoldStatus = '\u062a\u0645 \u0627\u0644\u0628\u064a\u0639';

enum PropertyFlowKind { sale, rent, offPlan, unknown }

Map<String, dynamic> normalizePropertyMap(
  Map<String, dynamic> source, {
  String? id,
}) {
  final data = Map<String, dynamic>.from(source);
  if (id != null && id.isNotEmpty) data['id'] = id;

  final location = _mapValue(data['location']);
  final pricing = _mapValue(data['pricing']);
  final flow = detectPropertyFlowKind(data);

  final title = _firstText([
    data['title'],
    data['titleAr'],
    data['name'],
  ]);
  if (title != null) data['title'] = title;

  final city = _firstText([data['city'], location?['city']]);
  final country = _firstText([data['country'], location?['country']]);
  final address = _firstText([
    data['address'],
    location?['address'],
    city,
  ]);
  if (city != null) data['city'] = city;
  if (country != null) data['country'] = country;
  if (address != null) data['address'] = address;

  final latitude = _firstValue([
    data['latitude'],
    data['lat'],
    location?['latitude'],
    location?['lat'],
  ]);
  final longitude = _firstValue([
    data['longitude'],
    data['lng'],
    location?['longitude'],
    location?['lng'],
  ]);
  if (latitude != null) {
    data['latitude'] = latitude.toString();
    data['lat'] ??= latitude;
  }
  if (longitude != null) {
    data['longitude'] = longitude.toString();
    data['lng'] ??= longitude;
  }

  final images = _stringList(data['images']);
  if (images.isNotEmpty) data['images'] = images;
  final mainImage = _firstText([
    data['mainImage'],
    data['imageUrl'],
    data['image'],
    images.isNotEmpty ? images.first : null,
  ]);
  if (mainImage != null) data['mainImage'] = mainImage;

  final currency = _firstText([
    data['currency'],
    data['priceCurrency'],
    pricing?['currency'],
    data['selling_price_currency'],
    data['daily_price_currency'],
    data['nightly_currency'],
  ]);
  if (currency != null) {
    data['currency'] = currency;
    data['priceCurrency'] ??= currency;
  }

  final salePrice = _firstValue([
    pricing?['salePrice'],
    data['salePrice'],
    data['sellingPrice'],
    data['selling_price'],
    flow == PropertyFlowKind.sale ? data['price'] : null,
  ]);
  final rentPrice = _firstValue([
    pricing?['rentPrice'],
    pricing?['dailyPrice'],
    pricing?['monthlyPrice'],
    pricing?['yearlyPrice'],
    data['rentPrice'],
    data['daily_price'],
    data['dailyPrice'],
    data['monthly_price'],
    data['monthlyPrice'],
    data['yearly_price'],
    data['yearlyPrice'],
    data['nightly_price'],
    data['nightlyPrice'],
    flow == PropertyFlowKind.rent ? data['price'] : null,
  ]);
  final startingPrice = _firstValue([
    pricing?['startingPrice'],
    data['startingPrice'],
    data['starting_price'],
    flow == PropertyFlowKind.offPlan ? data['price'] : null,
  ]);
  final price = _firstValue([
    flow == PropertyFlowKind.rent ? rentPrice : null,
    flow == PropertyFlowKind.offPlan ? startingPrice : null,
    flow == PropertyFlowKind.sale ? salePrice : null,
    data['price'],
    salePrice,
    rentPrice,
    startingPrice,
  ]);

  if (price != null) data['price'] = price;
  if (salePrice != null || flow == PropertyFlowKind.sale) {
    final value = salePrice ?? price;
    if (value != null) {
      data['salePrice'] = value;
      data['sellingPrice'] ??= value;
      data['selling_price'] ??= value;
      if (currency != null) data['selling_price_currency'] ??= currency;
    }
  }
  if (rentPrice != null || flow == PropertyFlowKind.rent) {
    final value = rentPrice ?? price;
    if (value != null) {
      data['rentPrice'] = value;
      data['daily_price'] ??= value;
      data['dailyPrice'] ??= value;
      if (currency != null) data['daily_price_currency'] ??= currency;
    }
  }
  if (startingPrice != null || flow == PropertyFlowKind.offPlan) {
    final value = startingPrice ?? price;
    if (value != null) {
      data['startingPrice'] = value;
      data['starting_price'] ??= value;
    }
  }

  final listingType = _firstText([
    data['listingType'],
    data['listing_type'],
    data['purpose'],
    data['transactionType'],
    data['offerType'],
    data['offer_type'],
  ]);
  if (listingType != null) {
    data['listingType'] = listingType;
    data['listing_type'] ??= listingType;
  }

  if (flow == PropertyFlowKind.sale) {
    data['property_type'] = kSalePropertyType;
    data['listingType'] ??= 'sale';
    data['listing_type'] ??= 'Sale';
  } else if (flow == PropertyFlowKind.rent) {
    data['property_type'] = kRentPropertyType;
    data['listingType'] ??= 'rent';
    data['listing_type'] ??= 'Rent';
  }

  final status = _firstText([data['status'], data['availability']]);
  if (status != null) {
    data['status'] = status;
    data['availability'] ??= status;
    if (_normalizeText(status).contains('sold') ||
        _normalizeText(status).contains(_normalizeText(kSoldStatus))) {
      data['isSold'] ??= true;
    }
  }

  final rating = _mapValue(data['rating']);
  data['averageRating'] ??= rating?['average'];
  data['ratingCount'] ??= rating?['count'];

  return data;
}

PropertyFlowKind detectPropertyFlowKind(Map<String, dynamic> property) {
  final pricing = _mapValue(property['pricing']);
  final candidates = [
    property['listingType'],
    property['listing_type'],
    property['purpose'],
    property['transactionType'],
    property['offerType'],
    property['offer_type'],
    property['dealType'],
    property['property_type'],
    property['propertyType'],
    property['type'],
  ];

  if (candidates.any(_isOffPlanText)) return PropertyFlowKind.offPlan;
  if (candidates.any(_isSaleText)) return PropertyFlowKind.sale;
  if (candidates.any(_isRentText)) return PropertyFlowKind.rent;

  if (_firstValue([
        pricing?['startingPrice'],
        property['startingPrice'],
        property['starting_price']
      ]) !=
      null) {
    return PropertyFlowKind.offPlan;
  }
  if (_firstValue([
        pricing?['salePrice'],
        property['salePrice'],
        property['sellingPrice'],
        property['selling_price']
      ]) !=
      null) {
    return PropertyFlowKind.sale;
  }
  if (_firstValue([
        pricing?['rentPrice'],
        pricing?['dailyPrice'],
        pricing?['monthlyPrice'],
        property['rentPrice'],
        property['daily_price'],
        property['monthly_price'],
        property['nightly_price'],
      ]) !=
      null) {
    return PropertyFlowKind.rent;
  }

  return PropertyFlowKind.unknown;
}

String normalizePropertyTypeValue(dynamic rawType) {
  if (_isSaleText(rawType)) return kSalePropertyType;
  if (_isRentText(rawType)) return kRentPropertyType;
  return (rawType ?? '').toString().trim();
}

bool isSaleMap(Map<String, dynamic> property) {
  return detectPropertyFlowKind(property) == PropertyFlowKind.sale;
}

bool isRentMap(Map<String, dynamic> property) {
  return detectPropertyFlowKind(property) == PropertyFlowKind.rent;
}

Map<String, dynamic> analyzePropertyAvailability(Map<String, dynamic> source) {
  final data = normalizePropertyMap(source);
  if (isSaleMap(data)) {
    final isSold = data['isSold'] == true ||
        _normalizeText(data['status']).contains(_normalizeText(kSoldStatus));
    data['book_status'] = isSold ? kSoldStatus : kAvailableStatus;
    data['statusColor'] = isSold ? Colors.red : Colors.green;
  } else {
    data['book_status'] ??= kAvailableStatus;
    data['statusColor'] ??= Colors.green;
  }
  return data;
}

Map<String, dynamic> canonicalPropertyWriteMap(Map<String, dynamic> source) {
  final data = normalizePropertyMap(source);
  final flow = detectPropertyFlowKind(data);
  final images = _stringList(data['images']);
  final currency = normalizedPropertyCurrency(data) ?? '';
  final pricing = <String, dynamic>{
    'currency': currency,
  };

  if (flow == PropertyFlowKind.sale) {
    pricing['salePrice'] = normalizedPropertyPrice(data) ?? '';
  } else if (flow == PropertyFlowKind.rent) {
    pricing['rentalPeriod'] = data['rentalPeriod'] ?? 'daily';
    pricing['rentPrice'] = normalizedPropertyPrice(data) ?? '';
  } else if (flow == PropertyFlowKind.offPlan) {
    pricing['startingPrice'] =
        data['startingPrice'] ?? data['starting_price'] ?? data['price'] ?? '';
  }

  final rating = _mapValue(data['rating']);

  return {
    if (data['request_id'] != null) 'request_id': data['request_id'],
    if (data['request_type'] != null) 'request_type': data['request_type'],
    if (data['originalPropertyId'] != null)
      'originalPropertyId': data['originalPropertyId'],
    'title': data['title'] ?? '',
    'description': data['description'] ?? '',
    'listingType': flow == PropertyFlowKind.unknown ? 'unknown' : flow.name,
    'propertyType': data['propertyType'] ??
        data['property_category_title'] ??
        data['category'] ??
        data['property_type'] ??
        '',
    'categoryId': data['categoryId'] ?? data['property_category_id'] ?? '',
    'categoryTitle':
        data['categoryTitle'] ?? data['property_category_title'] ?? '',
    'status': data['status'] ?? 'pending',
    'availability': data['availability'] ?? data['status'] ?? 'available',
    'isVisible': data['isVisible'] ?? true,
    'ownerId': data['ownerId'] ?? '',
    'features': _stringList(data['features']),
    'pricing': pricing,
    'location': {
      'country': data['country'] ?? '',
      'countryCode': data['countryCode'] ?? '',
      'city': data['city'] ?? '',
      'address': data['address'] ?? '',
      'latitude': data['latitude'] ?? data['lat'] ?? '',
      'longitude': data['longitude'] ?? data['lng'] ?? '',
    },
    'specs': {
      'area': data['area'] ?? '',
      'areaUnit': data['area_unit'] ?? data['areaUnit'] ?? '',
      'bathrooms': data['bathrooms'] ?? '',
      'bedrooms': data['bedrooms'] ?? '',
    },
    'contact': {
      'name': data['contact_name'] ?? data['ownerName'] ?? '',
      'phone': data['contact_number'] ?? data['phone'] ?? '',
      'phoneCountryCode':
          data['phoneCountryCode'] ?? data['country_code'] ?? '',
    },
    'media': {
      'mainImage': data['mainImage'] ?? (images.isNotEmpty ? images.first : ''),
      'images': images,
    },
    'rating': {
      'average': data['averageRating'] ?? rating?['average'] ?? 0.0,
      'count': data['ratingCount'] ?? rating?['count'] ?? 0,
    },
    'rules': data['rules'] ?? '',
    if (data['projectInfo'] != null) 'projectInfo': data['projectInfo'],
    if (data['panorama_tour'] != null) 'panorama_tour': data['panorama_tour'],
    if (data['createdAt'] != null) 'createdAt': data['createdAt'],
    if (data['created_at'] != null) 'createdAt': data['created_at'],
    if (data['updatedAt'] != null) 'updatedAt': data['updatedAt'],
    if (data['approvedAt'] != null) 'approvedAt': data['approvedAt'],
    if (data['approvedBy'] != null) 'approvedBy': data['approvedBy'],
    if (data['isFeatured'] != null) 'isFeatured': data['isFeatured'],
    if (data['featured'] != null) 'featured': data['featured'],
    if (data['isDistinct'] != null) 'isFeatured': data['isDistinct'],
  };
}

dynamic normalizedPropertyPrice(Map<String, dynamic> property) {
  final data = normalizePropertyMap(property);
  if (isSaleMap(data)) {
    return data['selling_price'] ?? data['salePrice'] ?? data['price'];
  }
  if (isRentMap(data)) {
    return data['daily_price'] ?? data['rentPrice'] ?? data['price'];
  }
  return data['price'] ?? data['startingPrice'];
}

String? normalizedPropertyCurrency(Map<String, dynamic> property) {
  final data = normalizePropertyMap(property);
  return _firstText([
    data['currency'],
    data['priceCurrency'],
    isSaleMap(data) ? data['selling_price_currency'] : null,
    isRentMap(data) ? data['daily_price_currency'] : null,
  ]);
}

Map<String, dynamic>? _mapValue(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

dynamic _firstValue(List<dynamic> values) {
  for (final value in values) {
    if (value == null) continue;
    if (value is String && value.trim().isEmpty) continue;
    return value;
  }
  return null;
}

String? _firstText(List<dynamic> values) {
  final value = _firstValue(values);
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

List<String> _stringList(dynamic value) {
  if (value is! List) return const [];
  return value
      .map((item) => item.toString().trim())
      .where((item) => item.isNotEmpty)
      .toList();
}

bool _isSaleText(dynamic value) {
  final normalized = _normalizeText(value);
  return normalized == 'sale' ||
      normalized == 'sell' ||
      normalized == 'purchase' ||
      normalized == 'for sale' ||
      normalized == _normalizeText(kSalePropertyType) ||
      normalized == _normalizeText('\u0644\u0644\u0628\u064a\u0639');
}

bool _isRentText(dynamic value) {
  final normalized = _normalizeText(value);
  return normalized == 'rent' ||
      normalized == 'rental' ||
      normalized == 'lease' ||
      normalized == 'for rent' ||
      normalized == 'daily' ||
      normalized == 'nightly' ||
      normalized == _normalizeText(kRentPropertyType) ||
      normalized == _normalizeText('\u0627\u064a\u062c\u0627\u0631') ||
      normalized ==
          _normalizeText('\u0644\u0644\u0625\u064a\u062c\u0627\u0631') ||
      normalized ==
          _normalizeText('\u0644\u0644\u0627\u064a\u062c\u0627\u0631');
}

bool _isOffPlanText(dynamic value) {
  final normalized = _normalizeText(value).replaceAll(RegExp(r'[\s_]+'), '-');
  return normalized == 'offplan' ||
      normalized == 'off-plan' ||
      normalized == 'newproject' ||
      normalized == 'new-project' ||
      normalized ==
          _normalizeText(
                  '\u0639\u0644\u0649 \u0627\u0644\u0645\u062e\u0637\u0637')
              .replaceAll(' ', '-') ||
      normalized ==
          _normalizeText(
                  '\u0645\u0634\u0631\u0648\u0639 \u062c\u062f\u064a\u062f')
              .replaceAll(' ', '-');
}

String _normalizeText(dynamic value) {
  return (value ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[\u064b-\u065f\u0670]'), '')
      .replaceAll(RegExp('[\u0623\u0625\u0622]'), '\u0627')
      .replaceAll('\u0649', '\u064a')
      .replaceAll('\u0629', '\u0647')
      .replaceAll(RegExp(r'\s+'), ' ');
}
