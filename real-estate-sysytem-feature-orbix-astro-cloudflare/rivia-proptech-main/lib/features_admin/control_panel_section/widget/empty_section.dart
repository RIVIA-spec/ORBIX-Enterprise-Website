import 'package:flutter/material.dart';

class EmptySection extends StatelessWidget {
  final String title;
  const EmptySection({required this.title});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Center(child: Text(title, style: const TextStyle(color: Colors.grey))),
      ),
    );
  }
}