# الأدوار ومسار العمل

## الأدوار
- **Owner**: مالك مساحة المؤسسة.
- **Admin**: إدارة الأعضاء والسياسات والمصادر.
- **Reviewer**: مراجعة الادعاءات واعتماد القرار النهائي.
- **Editor**: رفع المحتوى وتشغيل عَزْو وإدارة المسودات.
- **Viewer**: قراءة النتائج والتقارير.

## رحلة المادة
1. Draft
2. Queued
3. Processing
4. Needs Review (عند الحاجة)
5. Completed
6. Published/Exported خارج عَزْو

## قاعدة حوكمة
أي Claim يحمل `requires_human_review=true` لا يدخل تقريرًا "معتمدًا" إلا بعد وجود Review نهائي من Reviewer أو Admin.
