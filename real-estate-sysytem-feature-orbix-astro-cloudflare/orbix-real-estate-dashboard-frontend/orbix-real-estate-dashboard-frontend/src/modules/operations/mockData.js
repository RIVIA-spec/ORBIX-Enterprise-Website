const NOW = Date.now();
const D = d => NOW - d * 864e5;
const H = h => NOW - h * 36e5;

export const EVENTS0 = [
  { id:"ev1", type:"Viewing", title:"Al-Malki apartment second viewing", titleAr:"المعاينة الثانية لشقة المالكي", propertyId:"p2", clientId:"c1", agentId:"m4", branchId:"br2", transactionId:null, startsAt:H(-4), endsAt:H(-3), status:"Scheduled", notes:"Customer requested evening slot." },
  { id:"ev2", type:"Follow-up", title:"Follow up with Yazan on documents", titleAr:"متابعة يزن بخصوص الوثائق", propertyId:"p11", clientId:"c2", agentId:"m4", branchId:"br2", transactionId:"tx2", startsAt:H(-22), endsAt:H(-21), status:"Scheduled", notes:"Ownership authorization documents pending." },
  { id:"ev3", type:"Contract Deadline", title:"Reservation agreement signature deadline", titleAr:"موعد توقيع اتفاقية الحجز", propertyId:"p3", clientId:"c6", agentId:"m2", branchId:"br3", transactionId:"tx1", startsAt:D(-2), endsAt:D(-2) + 36e5, status:"Due", notes:"Contract CT-2207 awaiting signature." },
  { id:"ev4", type:"Photography", title:"Shop frontage photo session", titleAr:"جلسة تصوير واجهة المحل", propertyId:"p6", clientId:"c8", agentId:"m5", branchId:"br1", transactionId:"tx3", startsAt:H(-30), endsAt:H(-28), status:"Scheduled", notes:"Marketing requested updated frontage photos." },
  { id:"ev5", type:"Virtual Tour", title:"Kafr Sousa building tour capture", titleAr:"تصوير جولة بناء كفرسوسة", propertyId:"p11", clientId:"c2", agentId:"m5", branchId:"br2", transactionId:"tx2", startsAt:D(-4), endsAt:D(-4) + 72e5, status:"Scheduled", notes:"Capture lobby, parking, roof, and offices." },
  { id:"ev6", type:"Meeting", title:"Owner pricing review", titleAr:"اجتماع مراجعة تسعير المالك", propertyId:"p1", clientId:"c3", agentId:"m3", branchId:"br1", transactionId:"tx4", startsAt:D(1), endsAt:D(1) + 36e5, status:"Completed", notes:"Final sale terms confirmed." },
  { id:"ev7", type:"Task", title:"Upload Tartous customer ID document", titleAr:"رفع وثيقة هوية عميل طرطوس", propertyId:"p3", clientId:"c6", agentId:"m6", branchId:"br3", transactionId:"tx1", startsAt:H(8), endsAt:H(7), status:"Pending", notes:"Required before contract review." },
];

export const MESSAGES0 = [
  { id:"conv1", category:"Customer Conversations", clientId:"c6", propertyId:"p3", agentId:"m2", transactionId:"tx1", subject:"Tartous Sea View Apartment", subjectAr:"شقة مطلة على البحر في طرطوس", unread:2, messages:[
    { id:"msg1", by:"customer", text:"Can we review the reservation agreement today?", textAr:"هل يمكننا مراجعة اتفاقية الحجز اليوم؟", ts:H(6), internal:false },
    { id:"msg2", by:"agent", text:"Yes, I will send the latest draft and confirm the remaining document.", textAr:"نعم، سأرسل النسخة الأخيرة وأؤكد الوثيقة المتبقية.", ts:H(5), internal:false },
    { id:"msg3", by:"agent", text:"Internal note: confirm fixtures included before signature.", textAr:"ملاحظة داخلية: تأكيد التجهيزات المشمولة قبل التوقيع.", ts:H(4), internal:true },
  ]},
  { id:"conv2", category:"Transaction Conversations", clientId:"c2", propertyId:"p11", agentId:"m4", transactionId:"tx2", subject:"Kafr Sousa building verification", subjectAr:"تحقق بناء كفرسوسة", unread:1, messages:[
    { id:"msg4", by:"customer", text:"I uploaded the initial authorization document.", textAr:"رفعت وثيقة التفويض الأولية.", ts:H(12), internal:false },
    { id:"msg5", by:"orbix", text:"Document review is pending in the demo workflow.", textAr:"مراجعة الوثيقة بانتظار المعالجة ضمن العرض التجريبي.", ts:H(11), internal:false },
  ]},
  { id:"conv3", category:"Team Conversations", clientId:null, propertyId:"p6", agentId:"m3", transactionId:"tx3", subject:"Homs shop negotiation", subjectAr:"تفاوض محل حمص", unread:0, messages:[
    { id:"msg6", by:"manager", text:"Please prepare a counter-offer summary for the owner.", textAr:"يرجى تجهيز ملخص العرض المقابل للمالك.", ts:D(1), internal:true },
    { id:"msg7", by:"agent", text:"Done. I added quarterly payment notes to the offer.", textAr:"تم. أضفت ملاحظات الدفع الربع سنوي للعرض.", ts:H(20), internal:true },
  ]},
];

export const NOTIFICATIONS_CENTER0 = [
  { id:"pn1", category:"Leads", title:"New lead received", titleAr:"تم استلام عميل محتمل جديد", body:"Fadi Rahal asked about Apartment in Al-Waer.", bodyAr:"فادي رحال استفسر عن شقة في حي الوعر.", entityType:"lead", entityId:"l4", branchId:"br1", read:false, ts:H(5) },
  { id:"pn2", category:"Viewings", title:"Viewing confirmed", titleAr:"تم تأكيد المعاينة", body:"Al-Malki viewing is confirmed for today.", bodyAr:"تم تأكيد معاينة المالكي لهذا اليوم.", entityType:"viewing", entityId:"ev1", branchId:"br2", read:false, ts:H(4) },
  { id:"pn3", category:"Offers", title:"Customer submitted an offer", titleAr:"قدّم العميل عرضاً", body:"George Hanna submitted terms for Commercial Shop in Homs.", bodyAr:"جورج حنا قدّم شروطاً لمحل تجاري في حمص.", entityType:"offer", entityId:"of3", branchId:"br1", read:false, ts:H(3) },
  { id:"pn4", category:"Transactions", title:"Verification requires action", titleAr:"التحقق يتطلب إجراء", body:"TRX-RE-1002 needs authorization documents.", bodyAr:"TRX-RE-1002 يحتاج وثائق التفويض.", entityType:"transaction", entityId:"tx2", branchId:"br2", read:false, ts:H(2) },
  { id:"pn5", category:"Contracts", title:"Contract ready for review", titleAr:"العقد جاهز للمراجعة", body:"Reservation agreement CT-2207 is ready.", bodyAr:"اتفاقية الحجز CT-2207 جاهزة.", entityType:"contract", entityId:"CT-2207", branchId:"br3", read:true, ts:H(10) },
  { id:"pn6", category:"Properties", title:"Property requires update", titleAr:"العقار يحتاج تحديثاً", body:"Kafr Sousa building needs new tour photos.", bodyAr:"بناء كفرسوسة يحتاج صور جولة جديدة.", entityType:"property", entityId:"p11", branchId:"br2", read:true, ts:D(1) },
  { id:"pn7", category:"Team", title:"Task completed", titleAr:"تم إنجاز مهمة", body:"Samer uploaded the Homs villa photo pack.", bodyAr:"سامر رفع حزمة صور فيلا حمص.", entityType:"media", entityId:"md1", branchId:"br1", read:true, ts:D(2) },
  { id:"pn8", category:"System", title:"Weekly digest ready", titleAr:"الملخص الأسبوعي جاهز", body:"Agency performance digest is ready.", bodyAr:"ملخص أداء المكتب جاهز.", entityType:"report", entityId:"weekly", branchId:"br1", read:true, ts:D(3) },
];

export const AGREEMENTS0 = [
  { id:"agr1", agreementId:"AGR-RE-2026-001", organizationId:"org-demo", organization:"Atlas Real Estate", organizationAr:"أطلس العقارية", industry:"Real Estate Agency", agreementType:"Transaction Based", effectiveDate:"2026-01-01", expirationDate:"2026-12-31", status:"Active", saleFee:"0.5% demo", rentalFee:"2% of agency commission demo", otherFee:"Custom review", notes:"Mock agreement for Syrian real estate transactions.", updatedAt:H(8), documents:["Commercial terms draft.pdf","Agency onboarding memo.pdf"], activity:["Agreement activated","Sale fee example updated","Rental commission note reviewed"] },
  { id:"agr2", agreementId:"AGR-HT-2026-004", organizationId:"org-hotel", organization:"Grand Horizon Hotel", organizationAr:"فندق غراند هورايزن", industry:"Hotel", agreementType:"Custom", effectiveDate:"2026-06-01", expirationDate:"2027-05-31", status:"Draft", saleFee:"N/A", rentalFee:"N/A", otherFee:"Future booking fee", notes:"Future hotel booking agreement placeholder.", updatedAt:D(2), documents:["Hotel onboarding terms.pdf"], activity:["Draft created"] },
  { id:"agr3", agreementId:"AGR-RS-2026-009", organizationId:"org-restaurant", organization:"Noura Restaurant Group", organizationAr:"مجموعة نورة للمطاعم", industry:"Restaurant", agreementType:"Per Transaction", effectiveDate:"2026-03-15", expirationDate:"2027-03-14", status:"Active", saleFee:"N/A", rentalFee:"N/A", otherFee:"Future order fee", notes:"Future restaurant transaction agreement placeholder.", updatedAt:D(5), documents:["Restaurant commercial memo.pdf"], activity:["Agreement reviewed"] },
];

export const COMMISSIONS0 = [
  { id:"fee1", transactionId:"tx1", organizationId:"org-demo", propertyId:"p3", transactionType:"sale", transactionValue:96000, currency:"USD", agencyCommission:1920, orbixFee:480, feeStatus:"Due", completionDate:null },
  { id:"fee2", transactionId:"tx2", organizationId:"org-demo", propertyId:"p11", transactionType:"sale", transactionValue:500000, currency:"USD", agencyCommission:10000, orbixFee:2500, feeStatus:"Calculated", completionDate:null },
  { id:"fee3", transactionId:"tx3", organizationId:"org-demo", propertyId:"p6", transactionType:"rent", transactionValue:6500, currency:"USD", agencyCommission:325, orbixFee:90, feeStatus:"Pending", completionDate:null },
  { id:"fee4", transactionId:"tx4", organizationId:"org-demo", propertyId:"p1", transactionType:"sale", transactionValue:185000, currency:"USD", agencyCommission:3700, orbixFee:925, feeStatus:"Paid", completionDate:D(3) },
];

export const MEDIA0 = [
  { id:"md1", propertyId:"p1", type:"Property Images", name:"Homs villa exterior set", nameAr:"مجموعة صور خارجية لفيلا حمص", agentId:"m5", branchId:"br1", size:"210 MB", createdAt:D(29), url:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1f985d236-c3e0-4790-8c25-600869571e87.png" },
  { id:"md2", propertyId:"p3", type:"Panoramas", name:"Tartous sea view panorama", nameAr:"بانوراما إطلالة بحر طرطوس", agentId:"m5", branchId:"br3", size:"84 MB", createdAt:D(8), url:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1c1f56cee-166e-4b7e-8d32-a85f5314cc1c.png" },
  { id:"md3", propertyId:"p11", type:"Floor Plans", name:"Kafr Sousa building floor plans", nameAr:"مخططات بناء كفرسوسة", agentId:"m4", branchId:"br2", size:"12 MB", createdAt:D(5), url:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/12e3d2500-f734-4a71-a6ec-8d0c19bfb4f4.png" },
  { id:"md4", propertyId:"p2", type:"Videos", name:"Al-Malki apartment social video", nameAr:"فيديو شقة المالكي", agentId:"m2", branchId:"br2", size:"48 MB", createdAt:D(12), url:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1226cbf4f-75a0-4e4b-9f3d-ccc73b88c20f.png" },
  { id:"md5", propertyId:"p7", type:"3D Models", name:"Al-Ghouta villa 3D model", nameAr:"نموذج ثلاثي الأبعاد لفيلا الغوطة", agentId:"m5", branchId:"br2", size:"320 MB", createdAt:D(2), url:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/16158a1bd-122d-4251-9802-b402130128f7.png" },
  { id:"md6", propertyId:"p5", type:"Documents", name:"Abu Rummaneh office brochure", nameAr:"كتيب مكتب أبو رمانة", agentId:"m2", branchId:"br2", size:"7 MB", createdAt:D(18), url:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1a7cee194-6ec7-4cb4-a797-70697cb9dd88.png" },
];
