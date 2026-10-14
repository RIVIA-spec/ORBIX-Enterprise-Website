// lib/core/widgets/contact_owner_button.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:real_estate_app/core/functions/show_snack_bar.dart';
import 'package:real_estate_app/core/functions/safe_back.dart';

class ContactOwnerButtonPending extends StatelessWidget {
  final String contactNumber;

  const ContactOwnerButtonPending({super.key, required this.contactNumber});


  Future<void> _makeCall() async {
    final url = Uri(scheme: 'tel', path: contactNumber);
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      showSnackBar("خطأ", "لا يمكن فتح تطبيق الهاتف");
    }
  }

  Future<void> _openWhatsApp() async {
    final url = Uri.parse("https://wa.me/$contactNumber");
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      try{ 
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } catch (e) {
        showSnackBar("خطأ", "تطبيق واتساب غير مثبت");
      }
      
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Center(
        child: SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {
              Get.dialog(
                AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  title: Text(
                    "تواصل مع المالك",
                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ListTile(
                        leading: Icon(Icons.phone, color: Colors.green.shade600),
                        title: Text("اتصال هاتفي", style: GoogleFonts.cairo()),
                        onTap: () {
                          safeBack();
                          _makeCall();
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(Icons.message, color: Colors.green.shade600),
                        title: Text("واتساب", style: GoogleFonts.cairo()),
                        onTap: () {
                          safeBack();
                          _openWhatsApp();
                        },
                      ),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => safeBack(),
                      child: Text("إلغاء", style: GoogleFonts.cairo(color: Colors.grey)),
                    ),
                  ],
                ),
              );
            },
            icon: const Icon(Icons.contact_phone, size: 18),
            label: Text(
              "تواصل مع المالك",
              style: GoogleFonts.cairo(fontWeight: FontWeight.w600, fontSize: 13),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.green.shade700,
              side: BorderSide(color: Colors.green.shade400, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              backgroundColor: Colors.green.shade50.withOpacity(0.3),
            ),
          ),
        ),
      ),
    );
  }
}