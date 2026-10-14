import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:real_estate_app/core/functions/arabic_to_english_numbers.dart';
import 'package:real_estate_app/core/functions/number_input_formatter.dart';
import 'package:real_estate_app/core/widgets/custom_Input_field.dart';
import 'package:real_estate_app/core/widgets/custom_dropdown.dart';
import 'package:real_estate_app/core/widgets/section_container.dart';
import 'package:real_estate_app/features/add_property_section/controller/add_proprety_controller.dart';

class BasicPropertyDetails extends StatelessWidget {
  const BasicPropertyDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final AddPropretyController addPropertyCtr = Get.find<AddPropretyController>();
    final Color primaryBlue = const Color(0xFF3C83F6);

    return SectionContainer(
      title: "تفاصيل العقار الأساسية",
      subtitle: "عدل اسم العقار , وصفه أو سعره اليومي",
      color: primaryBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          /// ===== عنوان العقار =====
          CustomTextFormField(
            label: "عنوان العقار",
            hint: "شقة فاخرة مطلة على البحر",
            prefixIcon: const Icon(Icons.title, color: Colors.blueAccent),
            controller: addPropertyCtr.titleController,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),

          /// فاصل جمالي
          const SizedBox(height: 5),
          Divider(color: Colors.grey.shade300, height: 20),

          /// ===== وصف العقار =====
          CustomTextFormField(
            label: "وصف العقار",
            hint: "أدخل وصفاً واضحاً",
            prefixIcon: const Icon(Icons.description_outlined, color: Colors.blueAccent),
            controller: addPropertyCtr.descriptionController,
            maxLines: 3,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return "هذا الحقل مطلوب";
              }
              return null;
            },
          ),

          const SizedBox(height: 5),
          Divider(color: Colors.grey.shade300, height: 20),

          /// ===== نوع العقار =====
          Obx(() {
            if (addPropertyCtr.isLoadingCategories.value) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: CircularProgressIndicator(),
                ),
              );
            }

            if (addPropertyCtr.propertyCategories.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(12.0),
                child: Text(
                  "لا توجد أنواع عقارات متاحة",
                  style: TextStyle(color: Colors.red, fontSize: 15),
                  textAlign: TextAlign.center,
                ),
              );
            }

            // استخراج العنوان المختار (أو "اختر نوع العقار" إذا ما في اختيار)
            final selectedCategory = addPropertyCtr.propertyCategories.firstWhereOrNull(
              (cat) => cat['id'] == addPropertyCtr.selectedCategoryId.value,
            );
            final selectedTitle = selectedCategory?['title'] ?? "اختر نوع العقار";

            return CustomDropdown<String>(
              label: "نوع العقار",
              value: addPropertyCtr.selectedCategoryId.value, // نخزن الـ id
              // prefixIcon: Icons.category_outlined,
              // prefixIconColor: Colors.blueAccent,
              hint: "اختر نوع العقار",
              items: addPropertyCtr.propertyCategories.map((cat) {
                return DropdownOption(
                  value: cat['id'] as String,
                  title: cat['title'] as String,
                );
              }).toList(),
              onChanged: (newId) {
                if (newId != null) {
                  addPropertyCtr.selectedCategoryId.value = newId;
                  // تحديث النص المعروض تلقائيًا بفضل Obx + ValueKey
                  final newTitle = addPropertyCtr.propertyCategories
                      .firstWhere((cat) => cat['id'] == newId)['title'];
                  addPropertyCtr.propertyCategoryCtr.text = newTitle; // للحفظ أو العرض إذا احتجت
                }
              },
            );
          }),

          const SizedBox(height: 10),

          /// ===== إيجار / بيع =====
          Obx(
            () => CustomDropdown<String>(
              hint: "إيجار / بيع",
              value: addPropertyCtr.selectedPropertyType.value,
              icon: Icons.swap_horiz,
              iconColor: Colors.blueAccent,
              items: const [
                DropdownOption(value: "إيجار", title: "إيجار"),
                DropdownOption(value: "بيع", title: "بيع"),
              ],
              onChanged: (value) {
                if (value != null) {
                  addPropertyCtr.selectedPropertyType.value = value!;
                }
              },
            ),
          ),

          const SizedBox(height: 20),
          Divider(color: Colors.grey.shade300, height: 20),

          /// ===== المساحة =====
          Row(
            children: [
              SizedBox(
                width: Get.width * 0.5,
                child: CustomTextFormField(
                  label: "المساحة",
                  hint: "100",
                  prefixIcon: const Icon(Icons.square_foot, color: Colors.blueAccent),
                  controller: addPropertyCtr.areaController,
                  validator: (value) {
                    if (value == null || value.isEmpty) return "الحقل مطلوب";

                    if (double.tryParse(value.trim()) == null) {
                      if (double.tryParse(arabicToEnglish(value.trim())) != null) {
                        addPropertyCtr.areaController.text = arabicToEnglish(value.trim());
                        return null;
                      }
                      return "المساحة يجب أن تكون رقماً";
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Obx(
                  () => CustomDropdown<String>(
                    label: "الواحدة",
                    value: addPropertyCtr.selectedAreaUnit.value,
                    iconColor: Colors.blueAccent,
                    fontSize: 12,
                    items: const [
                      DropdownOption(value: "متر مربع", title: "متر مربع"),
                      DropdownOption(value: "دونم", title: "دونم"),
                      DropdownOption(value: "هكتار", title: "هكتار"),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        addPropertyCtr.selectedAreaUnit.value = value!;
                      }
                    },
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          Divider(color: Colors.grey.shade300, height: 25),

          /// ===== قسم السعر =====
          Obx(() {
            final isSale = addPropertyCtr.selectedPropertyType.value == "بيع";

            if (isSale) {
              return Row(
                children: [
                  SizedBox(
                    width: Get.width * 0.5,
                    child: CustomTextFormField(
                      label: "سعر البيع",
                      hint: "1000000",
                      prefixIcon: const Icon(Icons.attach_money, color: Colors.blueAccent),
                      controller: addPropertyCtr.sellingPriceController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        NumberWithCommasFormatter(),
                      ],
                      validator: (value) {
                        if (value == null || value.isEmpty) return "الحقل مطلوب";
                        final clean = value.replaceAll(',', '');
                        if (int.tryParse(clean) == null) {
                          if (int.tryParse(arabicToEnglish(clean)) != null) {
                            addPropertyCtr.sellingPriceController.text =
                                arabicToEnglish(clean);
                            return null;
                          }
                          return "السعر يجب أن يكون رقم";
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Obx(
                      () => CustomDropdown<String>(
                        label: "العملة",
                        value: addPropertyCtr.sellingSelectedCurrency.value,
                        iconColor: Colors.blueAccent,
                        fontSize: 12,
                        items: const [
                          DropdownOption(value: "دولار", title: "دولار"),
                          DropdownOption(value: "ليرة سورية", title: "ليرة سورية"),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            addPropertyCtr.sellingSelectedCurrency.value = value;
                          }
                        },
                      ),
                    ),
                  ),
                ],
              );
            }

            /// ===== أسعار الإيجار =====
            return Column(
              children: [

                /// السعر اليومي
                Row(
                  children: [
                    SizedBox(
                      width: Get.width * 0.5,
                      child: CustomTextFormField(
                        label: "السعر اليومي",
                        hint: "500",
                        keyboardType: TextInputType.number,
                        prefixIcon: const Icon(Icons.sunny, color: Colors.blueAccent),
                        controller: addPropertyCtr.dailyPriceController,
                        validator: (value) {
                          if (value == null || value.isEmpty) return "الحقل مطلوب";
                          if (int.tryParse(value.trim()) == null) {
                            if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                              addPropertyCtr.dailyPriceController.text =
                                  arabicToEnglish(value.trim());
                              return null;
                            }
                            return "السعر يجب أن يكون رقم";
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Obx(
                        () => CustomDropdown<String>(
                          label: "العملة",
                          value: addPropertyCtr.daileySelectedCurrency.value,
                          iconColor: Colors.blueAccent,
                          fontSize: 12,
                          items: const [
                            DropdownOption(value: "دولار", title: "دولار"),
                            DropdownOption(value: "ليرة سورية", title: "ليرة سورية"),
                          ],
                          onChanged: (value) {
                            if (value != null) {
                              addPropertyCtr.daileySelectedCurrency.value = value!;
                            }
                          },
                        ),
                      ),
                    ),
                    // Expanded(
                    //   child: DropdownButtonFormField<String>(
                    //     decoration: InputDecoration(
                    //       labelText: "العملة",
                    //       border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    //       filled: true,
                    //       fillColor: Colors.grey.shade50,
                    //       prefixIcon: const Icon(Icons.monetization_on_outlined, color: Colors.orange),
                    //     ),
                    //     value: addPropertyCtr.daileySelectedCurrency.value,
                    //     items: const [
                    //       DropdownMenuItem(value: "دولار", child: Text("دولار")),
                    //       DropdownMenuItem(value: "ليرة سورية", child: Text("ليرة سورية")),
                    //     ],
                    //     onChanged: (value) {
                    //       addPropertyCtr.daileySelectedCurrency.value = value!;
                    //     },
                    //   ),
                    // ),
                  ],
                ),

                const SizedBox(height: 18),

                /// السعر الليلي
                Row(
                  children: [
                    SizedBox(
                      width: Get.width * 0.5,
                      child: CustomTextFormField(
                        label: "السعر الليلي",
                        hint: "500",
                        keyboardType: TextInputType.number,
                        prefixIcon: const Icon(Icons.nightlight_round, color: Colors.blueAccent),
                        controller: addPropertyCtr.nightlyPriceController,
                        validator: (value) {
                          if (value == null || value.isEmpty) return "الحقل مطلوب";
                          if (int.tryParse(value.trim()) == null) {
                            if (int.tryParse(arabicToEnglish(value.trim())) != null) {
                              addPropertyCtr.nightlyPriceController.text =
                                  arabicToEnglish(value.trim());
                              return null;
                            }
                            return "السعر يجب أن يكون رقم";
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Obx(
                        () => CustomDropdown<String>(
                          label: "العملة",
                          value: addPropertyCtr.nightlySelectedCurrency.value,
                          iconColor: Colors.blueAccent,
                          fontSize: 12,
                          items: const [
                            DropdownOption(value: "دولار", title: "دولار"),
                            DropdownOption(value: "ليرة سورية", title: "ليرة سورية"),
                          ],
                          onChanged: (value) {
                            if (value != null) {
                              addPropertyCtr.nightlySelectedCurrency.value = value!;
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}