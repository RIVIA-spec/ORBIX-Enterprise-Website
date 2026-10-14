// lib/features/property_details_scetion/widget/rating_widget.dart
import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/controller/user_controller.dart';
import 'package:real_estate_app/core/mappers/property_mapper.dart';
import 'package:real_estate_app/features/property_details_section/controller/rating_controller.dart';
import 'package:real_estate_app/features/property_details_section/widget/build_section.dart';

class RatingWidget extends StatelessWidget {
  final Map property;
  const RatingWidget({super.key, required this.property});

  @override
  Widget build(BuildContext context) {
    final userCtr = Get.find<UserController>();
    final ratingCtr = Get.find<RatingController>();

    final String propertyId = property['id']?.toString() ?? '';
    final String userId = userCtr.userId.value;

    // إذا لم يكن هناك propertyId → لا يمكن عرض شيء
    if (propertyId.isEmpty) {
      return BuildProDetailsSection(
        title: "التقييمات",
        child: Text("خطأ في تحميل العقار",
            style: GoogleFonts.cairo(color: Colors.red)),
      );
    }

    return BuildProDetailsSection(
      title: "التقييمات",
      child: Column(
        children: [
          // 1. متوسط التقييم (يُعرض للجميع)
          _buildAverageRating(propertyId),

          const SizedBox(height: 12),

          // 2. زر التقييم (للمسجلين فقط + من حجز)
          if (userCtr.isLoggedIn.value && userId.isNotEmpty)
            _buildRatingButton(userId, propertyId, userCtr, ratingCtr)
          else
            const SizedBox.shrink(),

          const SizedBox(height: 8),

          // 3. عرض التقييمات (للجميع)
          _buildRatingsList(propertyId, userId, ratingCtr),
        ],
      ),
    );
  }

  Widget _buildAverageRating(String propertyId) {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('properties')
          .doc(propertyId)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.amber.shade300),
            ),
            child:
                const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        }

        final rawData = snapshot.data!.data() as Map<String, dynamic>?;
        final data = rawData == null
            ? null
            : normalizePropertyMap(rawData, id: propertyId);
        final double avg = (data?['averageRating'] as num?)?.toDouble() ?? 0.0;
        final int count = (data?['ratingCount'] as num?)?.toInt() ?? 0;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.amber.shade50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.amber.shade300, width: 1.5),
          ),
          child: Row(
            children: [
              ...List.generate(
                  5,
                  (i) => Icon(
                        i < avg ? Icons.star : Icons.star_border,
                        color: Colors.amber.shade700,
                        size: 32,
                      )),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    avg > 0 ? avg.toStringAsFixed(1) : "—",
                    style: GoogleFonts.cairo(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.amber.shade900,
                    ),
                  ),
                  Text(
                    count > 0 ? "من $count تقييم" : "لا تقييمات بعد",
                    style: GoogleFonts.cairo(
                        fontSize: 12, color: Colors.grey[700]),
                  ),
                ],
              ),
              const Spacer(),
              Icon(Icons.rate_review, color: Colors.amber.shade700, size: 28),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRatingButton(String userId, String propertyId,
      UserController userCtr, RatingController ratingCtr) {
    return StreamBuilder<DocumentSnapshot>(
      stream: ratingCtr.getUserRatingStream(propertyId, userId),
      builder: (context, userRatingSnapshot) {
        final bool hasRated =
            userRatingSnapshot.hasData && userRatingSnapshot.data!.exists;
        final Map<String, dynamic>? userRatingData = hasRated
            ? userRatingSnapshot.data!.data() as Map<String, dynamic>
            : null;

        return FutureBuilder<bool>(
          future: ratingCtr.checkConfirmedBooking(userId, propertyId),
          builder: (context, bookingSnapshot) {
            final bool canRate = bookingSnapshot.data == true;

            log("can rate: $canRate");

            return Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: canRate
                    ? () {
                        ratingCtr.showRatingSheet(
                          propertyId: propertyId,
                          propertyTitle: property['title'],
                          userId: userId,
                          initialRating: hasRated && userRatingData != null
                              ? (userRatingData['rating'] as num?)?.toDouble()
                              : null,
                          initialReview: hasRated && userRatingData != null
                              ? (userRatingData['review'] as String?) ?? ''
                              : null,
                        );
                      }
                    : null,
                icon: Icon(
                  hasRated ? Icons.edit : Icons.star_border,
                  color: canRate ? Colors.amber.shade700 : Colors.grey,
                ),
                label: Text(
                  hasRated
                      ? "تعديل تقييمك"
                      : (canRate ? "قيّم تجربتك" : "غير متاح للتقييم"),
                  style: GoogleFonts.cairo(
                    color: canRate ? Colors.amber.shade700 : Colors.grey,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildRatingItem(Map<String, dynamic> data,
      {bool isCurrentUser = false}) {
    final double rating = (data['rating'] as num).toDouble();
    final String review = data['review'] ?? '';

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCurrentUser ? Colors.amber.shade100 : Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrentUser ? Colors.amber.shade600 : Colors.amber.shade200,
          width: isCurrentUser ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ...List.generate(
                  5,
                  (j) => Icon(
                        j < rating ? Icons.star : Icons.star_border,
                        size: 18,
                        color: Colors.amber,
                      )),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  data['userName'] ?? 'مجهول',
                  style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                ),
              ),
              if (isCurrentUser)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade700,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    "تقييمك",
                    style: GoogleFonts.cairo(fontSize: 10, color: Colors.white),
                  ),
                ),
            ],
          ),
          if (review.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(review, style: GoogleFonts.cairo(fontSize: 13, height: 1.5)),
          ],
        ],
      ),
    );
  }

  Widget _buildRatingsList(
      String propertyId, String currentUserId, RatingController ratingCtr) {
    return StreamBuilder<QuerySnapshot>(
      stream: ratingCtr.getRatingsStream(propertyId),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return Text(
            "لا توجد تقييمات بعد",
            style: GoogleFonts.cairo(color: Colors.grey),
            textAlign: TextAlign.center,
          );
        }

        final ratings = snapshot.data!.docs.toList();

        // إذا كان المستخدم مسجلًا → أظهر تقييمه أولًا
        if (currentUserId.isNotEmpty) {
          final userRatingIndex =
              ratings.indexWhere((doc) => doc.id == currentUserId);
          if (userRatingIndex != -1) {
            final userRating = ratings.removeAt(userRatingIndex);
            final userData = userRating.data() as Map<String, dynamic>;
            return Column(
              children: [
                _buildRatingItem(userData, isCurrentUser: true),
                const Divider(height: 20),
                _buildOtherRatings(ratings),
              ],
            );
          }
        }

        return _buildOtherRatings(ratings);
      },
    );
  }

  Widget _buildOtherRatings(List<QueryDocumentSnapshot> ratings) {
    if (ratings.isEmpty) return const SizedBox.shrink();

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: ratings.length,
      itemBuilder: (context, i) {
        final data = ratings[i].data() as Map<String, dynamic>;
        return _buildRatingItem(data);
      },
    );
  }
}
