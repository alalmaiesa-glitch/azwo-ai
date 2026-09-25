# المعمارية المستهدفة لعَزْو

> هذه وثيقة تصميم فقط في baseline؛ المكونات الوظيفية أدناه غير منفذة قبل 4 أكتوبر.

```text
User text
  -> Claim Extractor (LLM structured output)
  -> Claim Classifier
  -> Retrieval Router
       -> Deterministic / approved evidence sources
            -> Quran deterministic source
            -> Hadith approved API/corpus
            -> Approved knowledge corpus
       -> Discovery-only sources
            -> Al-Makanez discovery connector
            -> other research indexes
       -> Source Resolver / Provenance Gate
            -> original or traceable source
            -> author / edition / publisher / location
            -> rights / license / terms check
  -> Evidence Reranker
  -> Verification Classifier
  -> Safety / Abstention Layer
  -> Evidence Cards + Audit Report
```

## المبادئ
1. النموذج اللغوي لا يُعامل كمصدر حقيقة.
2. كل مصدر يجب أن يحمل `source_id` وترخيصًا وحالة اعتماد.
3. لا تُنشأ إحالة من الذاكرة إذا غاب المصدر.
4. `UNSUPPORTED` تعني: لم نجد دعمًا كافيًا ضمن النطاق، ولا تعني بالضرورة أن الادعاء باطل.
5. المسائل المركبة/الخلافية تُوجّه إلى `MULTIPLE` أو `HUMAN_REVIEW`.
6. مطابقة القرآن تكون حتمية قدر الإمكان.
7. مصادر الاكتشاف `DISCOVERY_ONLY` لا يجوز أن تنتج Evidence نهائيًا مباشرة؛ يجب أن تمر عبر `Source Resolver / Provenance Gate`.
8. المادة المكتشفة عبر فهرس أو تجميع لا تُرقّى إلى دليل حتى يمكن تتبعها إلى أصل أو نسخة موثوقة مع بيانات ببليوغرافية وحقوق استخدام واضحة.
9. إذا تعذر الوصول إلى الأصل أو تعذر التحقق من بياناته، تبقى النتيجة `LEAD_ONLY` أو تتحول إلى `HUMAN_REVIEW`.

## العقد المتوقع للنتيجة
```json
{
  "claim_id": "C1",
  "claim_text": "...",
  "claim_type": "quran|hadith|knowledge|scholarly",
  "status": "SUPPORTED|PARTIAL|UNSUPPORTED|MULTIPLE|HUMAN_REVIEW",
  "evidence": [{"source_id":"...","location":"...","passage":"...","provenance_status":"VERIFIED_ORIGINAL"}],
  "discovery_leads": [{"source_id":"SRC-007","title":"...","url":"...","provenance_status":"LEAD_ONLY"}],
  "requires_human_review": false,
  "explanation": "..."
}
```
