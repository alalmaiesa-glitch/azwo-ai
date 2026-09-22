# المعمارية المستهدفة لعَزْو

> هذه وثيقة تصميم فقط في baseline؛ المكونات الوظيفية أدناه غير منفذة قبل 4 أكتوبر.

```text
User text
  -> Claim Extractor (LLM structured output)
  -> Claim Classifier
  -> Retrieval Router
       -> Quran deterministic source
       -> Hadith approved API/corpus
       -> Approved knowledge corpus
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

## العقد المتوقع للنتيجة
```json
{
  "claim_id": "C1",
  "claim_text": "...",
  "claim_type": "quran|hadith|knowledge|scholarly",
  "status": "SUPPORTED|PARTIAL|UNSUPPORTED|MULTIPLE|HUMAN_REVIEW",
  "evidence": [{"source_id":"...","location":"...","passage":"..."}],
  "requires_human_review": false,
  "explanation": "..."
}
```
