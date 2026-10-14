import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: CustomAppBar(title: "سياسة الخصوصية"),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // العنوان الرئيسي
              Center(
                child: Text(
                  "سياسة الخصوصية لتطبيق ريفيا",
                  style: GoogleFonts.cairo(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue.shade700,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  "Orbix Privacy Policy",
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    color: Colors.grey[600],
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  "آخر تحديث: 25 نوفمبر 2024",
                  style: GoogleFonts.cairo(
                    fontSize: 12,
                    color: Colors.grey[500],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // المقدمة
              _buildSection(
                title: "المقدمة",
                content: "نشكرك على استخدامك لتطبيق أوربكس (Orbix).\n\nنحن ملتزمون بحماية خصوصيتك وضمان معالجة بياناتك بطريقة آمنة وقانونية.\n\nتهدف هذه السياسة إلى توضيح كيفية جمع واستخدام وحماية المعلومات الشخصية داخل التطبيق.",
              ),

              // القسم 1
              _buildSection(
                title: "1. المعلومات التي نقوم بجمعها",
                content: "نقوم بجمع نوعين من المعلومات:\n\n",
                children: [
                  _buildSubSection(
                    title: "A. معلومات يقدّمها المستخدم مباشرة",
                    content: "مثل:\n• الاسم الكامل\n• رقم الهاتف\n• البريد الإلكتروني (إن وُجد)\n• كلمة المرور\n• صورة الهوية (KYC)\n• صورة السيلفي للتأكد من الهوية\n• صور ومستندات العقار للتحقق\n• معلومات الفندق (إن كانت مقدّمة من قبل الإدارة)",
                  ),
                  const SizedBox(height: 12),
                  _buildSubSection(
                    title: "B. معلومات تُجمع تلقائيًا",
                    content: "من خلال استخدام التطبيق:\n• نوع الجهاز ونظام التشغيل\n• المعرف الإعلاني (إذا تم تفعيله)\n• سجلات الاستخدام (Log Data)\n• عنوان الـ IP\n• التقريب الجغرافي للموقع (Location) في حال وافقت على ذلك",
                  ),
                  const SizedBox(height: 12),
                  _buildSubSection(
                    title: "C. صور وأشرطة 360°",
                    content: "عند رفع صور أو جولات 360°، يقوم التطبيق بحفظ هذه الوسائط ضمن خادم آمن.",
                  ),
                ],
              ),

              // القسم 2
              _buildSection(
                title: "2. كيف نستخدم المعلومات؟",
                content: "نستخدم بياناتك للأغراض التالية:\n\n• إنشاء حساب المستخدم\n• التحقق من الهوية ومن العقار لضمان مصداقية الإعلانات\n• نشر العقارات والفنادق داخل المنصة\n• مراجعة المحتوى قبل النشر\n• التواصل مع المستخدم بخصوص الحساب أو التحقق\n• تحسين تجربة الاستخدام وتطوير خدمات التطبيق\n• منع النشاطات الاحتيالية والإبلاغ عنها\n\nنؤكد أنّ ريفيا لا تبيع بيانات المستخدم لأي طرف ثالث.",
              ),

              // القسم 3
              _buildSection(
                title: "3. من يمكنه الوصول للمعلومات؟",
                content: "يتم الوصول إلى معلوماتك من قبل:\n\n• فريق ريفيا المعتمد فقط (لمراجعة الهوية والعقار)\n• مزوّدي الخدمات التقنية (مثل خدمات التخزين السحابي)\n• الجهات القانونية في حال طلبت السلطات ذلك\n\nلا نشارك بياناتك مع المعلنين أو أي طرف تجاري خارجي.",
              ),

              // القسم 4
              _buildSection(
                title: "4. تخزين البيانات وحمايتها",
                content: "• نقوم بتخزين البيانات على خوادم آمنة.\n• نستخدم بروتوكولات تشفير لحماية المعلومات أثناء النقل.\n• نحتفظ بالبيانات فقط خلال الفترة اللازمة لتقديم الخدمة أو بحسب المتطلبات القانونية.",
              ),

              // القسم 5
              _buildSection(
                title: "5. حقوق المستخدم",
                content: "يحق لك:\n\n• طلب تحديث معلوماتك\n• طلب حذف حسابك بشكل كامل\n• سحب موافقتك على مشاركة البيانات (بما فيها الموقع)\n• طلب حذف مستندات التحقق من الهوية\n\nيمكن تنفيذ هذه الطلبات عبر:\n📧 info@riviaprop.com",
              ),

              // القسم 6
              _buildSection(
                title: "6. معلومات الموقع (Location Data)",
                content: "قد يستخدم ريفيا موقعك الجغرافي لتسهيل:\n\n• عرض العقارات القريبة\n• تحديد موقع العقار عند إضافته\n• تحسين نتائج البحث\n\nلن نقوم بجمع الموقع إلا إذا منحت التطبيق الإذن بذلك.",
              ),

              // القسم 7
              _buildSection(
                title: "7. محتوى العقارات والفنادق",
                content: "عند نشر عقار أو غرفة فندق، يتعهد المستخدم بأن:\n\n• المحتوى يعود له أو هو مخوّل بنشره\n• المعلومات المقدّمة صحيحة\n• الصور حقيقية وغير مضللة\n\nيحق لريفيا رفض أي عقار في حال عدم مطابقة المعايير أو وجود شبهة تلاعب.",
              ),

              // القسم 8
              _buildSection(
                title: "8. الأطفال",
                content: "لا تستهدف خدمات ريفيا الأطفال دون سن 13 عامًا.\n\nفي حال اكتشفنا أنّ مستخدمًا دون هذه السن قدم معلومات شخصية، سنقوم بحذفها فورًا.",
              ),

              // القسم 9
              _buildSection(
                title: "9. التعديلات على سياسة الخصوصية",
                content: "قد نقوم بتحديث هذه السياسة من وقت لآخر.\n\nعند إجراء أي تعديل، سيتم نشر النسخة المحدثة في التطبيق وعلى موقع ريفيا.",
              ),

              // القسم 10
              _buildSection(
                title: "10. التواصل",
                content: "للأسئلة أو طلبات الحذف أو التعديل، يمكن التواصل عبر:\n\n📧 info@riviaprop.com\n\nأو عبر صفحة التواصل داخل التطبيق.",
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required String content,
    List<Widget>? children,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.cairo(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade700,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style: GoogleFonts.cairo(
              fontSize: 14,
              height: 1.7,
              color: Colors.grey.shade800,
            ),
          ),
          if (children != null) ...children,
        ],
      ),
    );
  }

  Widget _buildSubSection({
    required String title,
    required String content,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.cairo(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.blue.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: GoogleFonts.cairo(
              fontSize: 13,
              height: 1.6,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }
}

