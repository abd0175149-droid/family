# حل مشاكل Hostinger - Cache و Server Crashes

## بعد كل Deploy (مهم)

1. **امسح كاش CDN** إن كنت تستخدم CDN في Hostinger.
2. **امسح كاش المتصفح** أو جرّب نافذة خاصة (`Ctrl+Shift+N`) للتحقق.
3. **تأكد من وجود مجلد `.next` كامل** بعد البناء وأن الـ Build Command هو `npm run build`.

---

## المشكلة 1: مشكلة الكاش (CSS لا يتم تحميله)

### الأعراض
- CSS لا يتم تحميله إلا عند فتح بدون كاش
- الملفات الثابتة تظهر قديمة بعد إعادة البناء

### الحلول المطبقة

1. **إضافة Cache Headers في `next.config.js`**:
   - ملفات ثابتة: `max-age=31536000, immutable`
   - API routes: `no-store, no-cache`
   - صفحات ديناميكية: `no-cache`

2. **إضافة Middleware**:
   - معالجة cache headers تلقائياً
   - منع الكاش للصفحات الديناميكية

3. **إضافة Meta Tags في Layout**:
   - منع الكاش على مستوى HTML

### خطوات إضافية

1. **في Hostinger**:
   - اذهب إلى File Manager
   - احذف مجلد `.next` القديم
   - أعد الـ deployment

2. **في المتصفح**:
   - اضغط `Ctrl + Shift + R` (Hard Refresh)
   - أو امسح الكاش يدوياً

---

## المشكلة 2: السيرفر خارج الخدمة (يحتاج Stop running processes)

### الأسباب المحتملة

1. **Prisma Query Engine يتعطل**:
   - اتصالات معلقة
   - timeout في الاستعلامات
   - memory leaks

2. **عمليات معلقة**:
   - طلبات API لا تنتهي
   - اتصالات قاعدة بيانات معلقة

### الحلول المطبقة

1. **تحسين Prisma Client**:
   - إضافة graceful shutdown
   - معالجة الأخطاء بشكل أفضل
   - إغلاق الاتصال عند الخروج

2. **إضافة Timeout للاتصالات**:
   - timeout 3 ثوانٍ للـ health check
   - منع الاتصالات المعلقة

3. **تحسين معالجة الأخطاء**:
   - لا نحاول إعادة الاتصال في health check
   - منع loops لا نهائية

### خطوات إضافية

1. **في Hostinger**:
   - اذهب إلى "Stop running processes"
   - أوامر إضافية:
     ```bash
     # في SSH (إن كان متاحاً)
     pkill -f node
     pkill -f next
     ```

2. **تحقق من Logs**:
   - افتح Application Logs في Hostinger
   - ابحث عن أخطاء Prisma أو Node.js

3. **إعادة تشغيل التطبيق**:
   - بعد Stop processes
   - انتظر 30 ثانية
   - أعد فتح الموقع

---

## إعدادات موصى بها في Hostinger

### Environment Variables
```
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
NODE_ENV=production
PORT=3000
```

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 22.x

### Runtime Settings
- **Start Command**: `npm start`
- **Auto Restart**: Enabled

---

## نصائح للصيانة

1. **مراقبة Logs بانتظام**:
   - تحقق من Application Logs أسبوعياً
   - ابحث عن patterns متكررة

2. **تنظيف دوري**:
   - احذف `.next` القديم قبل إعادة البناء
   - امسح logs القديمة

3. **اختبار بعد كل deployment**:
   - تحقق من `/api/health`
   - جرب تسجيل الدخول
   - تحقق من تحميل CSS

---

## إذا استمرت المشاكل

1. **تحقق من DATABASE_URL**:
   - تأكد من استخدام `localhost` وليس `srv1701.hstgr.io`
   - تأكد من ترميز `@` كـ `%40`

2. **تحقق من Node.js Version**:
   - يجب أن يكون 18+ أو 22.x
   - تحقق من إعدادات Hostinger

3. **اتصل بدعم Hostinger**:
   - إذا استمرت المشاكل
   - قد تكون مشكلة في البيئة
