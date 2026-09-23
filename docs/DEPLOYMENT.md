# نشر موقع عَزْو

## الحالة الحالية
الموقع Static Frontend داخل `site/`، مع طبقة بيانات تستطيع العمل محليًا أو الاتصال بـ Supabase.

## بيئة تجريبية
```bash
python3 -m http.server 4173 --directory site
```

## بيئة الإنتاج المقترحة
### Frontend
Vercel أو Cloudflare Pages.

### Backend
Supabase:
- PostgreSQL
- Auth
- Storage
- Edge Functions

### الذكاء الاصطناعي
خدمة مستقلة خلف Edge Function أو API Server.
لا توضع API keys في المتصفح.

## متغيرات البيئة الفعلية
يفضل عند الانتقال إلى Framework build step نقل config إلى env:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- AI_PROVIDER_KEY (backend only)
- EMBEDDING_PROVIDER_KEY (backend only)

## النطاقات المقترحة للبنية
- `www.<domain>`: الموقع العام
- `app.<domain>`: مساحة العمل
- `api.<domain>`: API
- `docs.<domain>`: توثيق المطورين

## قبل الإطلاق العام
- سياسة الخصوصية.
- شروط الاستخدام.
- سياسة المصادر والتصحيح العلمي.
- صفحة حدود النظام.
- نسخ احتياطي.
- مراقبة أخطاء.
- اختبارات أمنية.
- مراجعة تراخيص كل Corpus.
