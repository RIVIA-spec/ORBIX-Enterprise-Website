type FirebaseLikeError = {
  code?: string;
  message?: string;
};

export function getFirebaseErrorMessage(error: unknown, fallback = 'حدث خطأ غير متوقع. حاول مرة أخرى.'): string {
  const candidate = error as FirebaseLikeError;
  const code = candidate?.code || '';

  switch (code) {
    case 'permission-denied':
      return 'ليس لديك صلاحية لتنفيذ هذه العملية من هذا الحساب.';
    case 'unauthenticated':
      return 'يجب تسجيل الدخول أولاً لتنفيذ هذه العملية.';
    case 'unavailable':
      return 'الخدمة غير متاحة حالياً. تحقق من الاتصال وحاول مرة أخرى.';
    case 'not-found':
      return 'لم يتم العثور على البيانات المطلوبة.';
    case 'storage/unauthorized':
      return 'ليس لديك صلاحية لرفع أو قراءة هذا الملف من Storage.';
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مستخدم بالفعل.';
    case 'auth/invalid-credential':
      return 'بيانات الدخول غير صحيحة.';
    case 'auth/email-not-verified':
      return 'يجب تأكيد البريد الإلكتروني قبل المتابعة.';
    default:
      return candidate?.message || fallback;
  }
}
