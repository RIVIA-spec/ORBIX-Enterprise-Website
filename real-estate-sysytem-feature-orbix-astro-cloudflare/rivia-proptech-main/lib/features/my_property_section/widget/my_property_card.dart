import 'package:flutter/material.dart';
import 'package:real_estate_app/core/widgets/proprty_card.dart';

class MyPropertyCard extends StatelessWidget {
  final Map<String, dynamic> property;

  const MyPropertyCard({super.key, required this.property});

  @override
  Widget build(BuildContext context) {
    return PropertyCard(property: property);
  }
}
