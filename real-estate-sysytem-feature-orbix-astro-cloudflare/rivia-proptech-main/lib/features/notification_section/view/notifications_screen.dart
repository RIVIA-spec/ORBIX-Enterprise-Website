import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:real_estate_app/core/widgets/loading_widgets.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  Color _getAccentColor(String type) {
    switch (type) {
      case 'accept':
        return Colors.green;
      case 'reject':
        return Colors.red;
      case 'warning':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'accept':
        return Icons.check_circle;
      case 'reject':
        return Icons.cancel;
      case 'warning':
        return Icons.warning_rounded;
      default:
        return Icons.notifications;
    }
  }

  Future<void> _refreshNotifications() async {
    await Future.delayed(const Duration(milliseconds: 500));
  }

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser!.uid;

    return Scaffold(
      appBar: const CustomAppBar(title: "الإشعارات"),
      body: RefreshIndicator(
        onRefresh: _refreshNotifications,
        child: StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(userId)
              .collection('notifications')
              .orderBy('created_at', descending: true)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingDiscreteCircular();
            }

            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error, color: Colors.red, size: 48),
                    const SizedBox(height: 16),
                    Text("فشل في تحميل الإشعارات", style: TextStyle(color: Colors.grey[600])),
                  ],
                ),
              );
            }

            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.notifications_off, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text("لا توجد إشعارات", style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                  ],
                ),
              );
            }

            final notifs = snapshot.data!.docs;

            return ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: notifs.length,
              itemBuilder: (context, i) {
                final notif = notifs[i];
                final data = notif.data() as Map<String, dynamic>;
                final isRead = data['read'] == true;
                final type = data['type'] ?? 'general';
                final accentColor = _getAccentColor(type);
                final iconData = _getIcon(type);
                Color readIconColor = type == "accept" ? Colors.green.shade300 : Colors.red.shade300;

                return GestureDetector(
                  onTap: () async {
                    if (!isRead) {
                      try {
                        await notif.reference.update({'read': true});
                      } catch (e) {
                        debugPrint('فشل تحديث read: $e');
                      }
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: isRead ? Colors.white : Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 12),
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: accentColor.withOpacity(0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(iconData, color: accentColor, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                data['title'] ?? '',
                                style: TextStyle(
                                  fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                                  fontSize: 16,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                data['message'] ?? '',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 50,
                          height: 80,
                          alignment: Alignment.center,
                          child: Icon(
                            isRead ? Icons.mark_email_read_rounded : Icons.mark_email_unread_rounded,
                            color: isRead ? Colors.grey.shade300 : readIconColor,
                            size: 28,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
