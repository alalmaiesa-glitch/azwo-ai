# عَزْو | AZWO — Pre-Challenge Baseline

**الشعار:** من الادعاء إلى مصدره.

هذا المستودع هو نسخة البداية الموثقة قبل أيام تحدي الذكاء الاصطناعي في خدمة المحتوى الإسلامي (4–6 أكتوبر 2026).

## ما الذي يعمل الآن؟
- واجهة RTL تفاعلية نهائية مبدئيًا.
- عرض Demo يعتمد على fixtures اصطناعية فقط.
- 120 حالة اختبار معرفة سلفًا.
- سجل مصادر وتراخيص وحالة كل مصدر.
- وثائق المعمارية، السلامة، وخطة التنفيذ.

## ما الذي **لا** يعمل الآن؟
- لا يوجد Claim Extractor حقيقي.
- لا يوجد Retrieval أو RAG حقيقي.
- لا يوجد Quran Validator متصل بالمصدر.
- لا يوجد Hadith retrieval فعلي.
- لا يوجد Verification Engine أو LLM judging فعلي.
- أي نتائج في `prototype/` هي بيانات تجريبية صريحة.

هذه الحدود مقصودة لتوثيق حالة المشروع السابقة لبداية فترة الإنجاز التنافسي.

## تشغيل النموذج
```bash
python3 scripts/serve.py
```
ثم افتح `http://localhost:4173`.

## التحقق من baseline
```bash
python3 scripts/validate_baseline.py
```

## هيكل المشروع
- `prototype/`: الواجهة التفاعلية ببيانات fixture.
- `data/test_cases.csv`: 120 حالة اختبار.
- `docs/SOURCES_AND_LICENSES.csv`: سجل المصادر والحقوق.
- `docs/ARCHITECTURE.md`: المعمارية المستهدفة التي ستُنفّذ خلال أيام التحدي.
- `BASELINE.md`: بيان حالة البداية.
- `CHANGELOG_CHALLENGE.md`: يسجل ما يتم فقط خلال 4–6 أكتوبر.
