# عَزْو — API v1 Contract

## POST /v1/verifications
ينشئ عملية تأصيل جديدة.

Request:
```json
{
  "organization_id": "uuid",
  "input_type": "text",
  "input_text": "....",
  "domain": "general",
  "language": "ar"
}
```

Response:
```json
{
  "id": "uuid",
  "status": "queued",
  "created_at": "ISO-8601"
}
```

## GET /v1/verifications/{id}
يرجع العملية وملخص حالتها.

## GET /v1/verifications/{id}/claims
يرجع الادعاءات المستخرجة وحالة كل ادعاء.

## GET /v1/claims/{id}/evidence
يرجع الأدلة والمصادر المرتبطة.

## POST /v1/claims/{id}/reviews
مخصص للمراجع البشري.

Request:
```json
{
  "decision": "supported|partial|unsupported|multiple|human_review",
  "comment": "...",
  "is_final": true
}
```

## GET /v1/sources
مصادر المؤسسة المعتمدة.

## POST /v1/sources
إضافة مصدر جديد — للأدوار المصرح لها فقط.

## مبادئ
- لا يعيد API حكمًا شرعيًا نهائيًا لمجرد عدم وجود دليل.
- كل Evidence يجب أن يحمل source_id قابلًا للتتبع.
- الحقول التي يولدها نموذج لغوي تحفظ معها model_metadata.
- كل تعديل بشري نهائي يسجل في audit_log.
