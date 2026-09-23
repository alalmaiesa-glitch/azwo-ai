# ربط عَزْو بـ Supabase

## 1) إنشاء المشروع
أنشئ مشروع Supabase جديدًا.

## 2) تطبيق المخطط
نفّذ محتوى:
`supabase/schema.sql`
داخل SQL Editor أو Migration.

## 3) بيانات الاتصال
انسخ:
- Project URL
- Public anon key

ثم عدّل:
`site/config.js`

```js
window.AZWO_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY",
  demoMode: false
};
```

> لا تضع service_role key داخل المتصفح.

## 4) Authentication
فعّل Email/Password من Authentication Providers.

عند إنشاء المستخدم:
- Trigger ينشئ profile تلقائيًا.
- عند إنشاء organization، Trigger يضيف المنشئ كـ Owner.

## 5) المصادر
المصدر يمكن أن يكون:
- `is_public=true`: أصل معرفي وقفي عام.
- `is_public=false` + organization_id: مصدر خاص بمؤسسة.

## 6) التخزين
في المرحلة القادمة أنشئ Buckets:
- `verification-inputs` (خاص)
- `source-files` (خاص)
- `public-knowledge-assets` (وفق الحقوق والتراخيص)

## 7) قبل الإنتاج
- راجع RLS Policy Tests.
- فعّل MFA للحسابات الإدارية.
- لا تخزن أسرار LLM في الواجهة؛ تكون في Edge Functions / backend فقط.
- أضف rate limiting وaudit logging.
