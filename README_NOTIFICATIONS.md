# دليل إعداد الإشعارات — ملعبنا v2

## الملفات المضافة / المحدّثة

| الملف | التغيير |
|-------|---------|
| `src/services/notificationsService.js` | **جديد** — منطق الإشعارات كاملاً |
| `App.js` | **محدَّث** — bootstrap للإشعارات عند الإقلاع |
| `package.json` | **محدَّث** — أُضيف expo-notifications + expo-device |
| `app.json` | **محدَّث** — صلاحيات Android + إعدادات الإشعارات |

---

## خطوات الإعداد (مرة واحدة فقط)

### 1. تثبيت الحزم
```bash
npm install
```

### 2. ملف google-services.json
- افتح Firebase Console → مشروع `note-6a6b0`
- Project Settings → Your apps → Android app
- حمّل `google-services.json`
- ضعه في جذر المشروع: `malabna/google-services.json`

### 3. EAS Project ID
- شغّل: `eas build:configure`
- انسخ الـ `projectId` من `eas.json` → ضعه في `app.json` → `extra.eas.projectId`

### 4. Supabase Secret (إن لم تفعل بعد)
```
Dashboard → Project FOOT → Edge Functions → send-push → Secrets
Name:  FIREBASE_SERVICE_ACCOUNT
Value: [محتوى ملف service account JSON]
```

---

## كيف يعمل النظام

```
التطبيق يفتح
    ↓
App.js يتحقق من جلسة المستخدم (Supabase Auth)
    ↓
initPushNotifications(userId)
    ├── يطلب صلاحية الإشعارات من نظام التشغيل
    ├── يجلب Expo Push Token
    └── يحفظه في جدول user_fcm_tokens (Supabase)
         user_id | fcm_token | device_type | updated_at
    
إرسال إشعار (من السيرفر أو من التطبيق):
    sendPushNotification({ token, title, body })
        ↓
    Edge Function: send-push
        ↓
    Google OAuth2 → Access Token
        ↓
    FCM v1 API → الجهاز
```

---

## استخدام sendPushNotification في الكود

```js
import { sendPushNotification } from "../services/notificationsService";

// مثال: إرسال إشعار لمباراة جديدة
await sendPushNotification({
  token: recipientFcmToken,  // من جدول user_fcm_tokens
  title: "🏟️ مباراة جديدة",
  body: "ريال مدريد vs برشلونة — يبدأ البث الآن!",
});
```

---

## الـ Deep Link عند الضغط على الإشعار

يمكنك إرسال `data` مع الإشعار لتوجيه المستخدم لشاشة معينة:

```js
// في Edge Function send-push — أضف data للـ payload:
{
  message: {
    token,
    notification: { title, body },
    data: {
      screen: "FullPlayer",
      params: JSON.stringify({ streamUrl: "...", title: "..." })
    }
  }
}
```

ثم في `App.js` الـ `onResponse` handler يلتقط `data.screen` ويتنقل تلقائياً.

---

## بناء APK
```bash
eas build --platform android --profile preview
```
