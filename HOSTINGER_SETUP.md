# دليل الإعداد على Hostinger Shared Hosting

## ⚠️ مهم: Shared Hosting لا يدعم Node.js على السيرفر

لذلك يجب:
1. بناء المشروع محلياً
2. رفع الملفات المبنية
3. تنفيذ migrations محلياً (تصل لقاعدة البيانات على Hostinger)

---

## الخطوة 1: إعداد المشروع محلياً

### 1.1 تثبيت التبعيات
```bash
npm install
```

### 1.2 إعداد ملف `.env` محلياً
أنشئ ملف `.env` في جذر المشروع:

```env
DATABASE_URL="mysql://u272058362_family2:how%40Platform20241212@localhost:3306/u272058362_family2"
AUTH_SECRET="temporary-secret-key-change-later-12345"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="cron-secret-token-change-later-12345"
UPLOAD_DIR="./public/uploads"
NODE_ENV="development"
```

**ملاحظة**: استبدل `localhost` في `DATABASE_URL` بـ host قاعدة البيانات من Hostinger (عادة يكون مثل `localhost` أو IP محدد)

### 1.3 توليد Prisma Client
```bash
npm run db:generate
```

### 1.4 إنشاء الجداول في قاعدة البيانات
```bash
npm run db:push
```

**ما يحدث**: سيتم إنشاء جميع الجداول في قاعدة البيانات على Hostinger

### 1.5 (اختياري) إضافة بيانات تجريبية
```bash
npm run db:seed
```

سيُنشئ:
- مدير: `admin@family.com` / `admin123`
- أمين صندوق: `treasurer@family.com` / `treasurer123`
- أمين سر: `secretary@family.com` / `secretary123`
- عضو: `member@family.com` / `member123`

---

## الخطوة 2: بناء المشروع للإنتاج

### 2.1 تحديث `.env` للإنتاج
```env
DATABASE_URL="mysql://u272058362_family2:how%40Platform20241212@localhost:3306/u272058362_family2"
AUTH_SECRET="temporary-secret-key-change-later-12345"
NEXTAUTH_URL="https://myfamily.grade.sbs"
CRON_SECRET="cron-secret-token-change-later-12345"
UPLOAD_DIR="./public/uploads"
NODE_ENV="production"
```

### 2.2 بناء المشروع
```bash
npm run build
```

**ما يحدث**:
- يتم إنشاء مجلد `.next` مع الملفات المبنية
- يتم تحسين الكود للإنتاج

---

## الخطوة 3: رفع الملفات إلى Hostinger

### 3.1 الملفات المطلوب رفعها:

✅ **ارفع هذه الملفات/المجلدات**:
- `.next/` (المجلد الكامل)
- `public/` (المجلد الكامل)
- `node_modules/` (المجلد الكامل) - **مهم جداً**
- `package.json`
- `package-lock.json`
- `next.config.js`
- `tsconfig.json`
- `jsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `prisma/` (المجلد الكامل)
- `app/` (المجلد الكامل)
- `components/` (المجلد الكامل)
- `lib/` (المجلد الكامل)

❌ **لا ترفع**:
- `.env` (سيتم إضافته في Environment Variables)
- `.git/`
- `node_modules/.cache/`

### 3.2 طريقة الرفع:

#### الطريقة 1: FTP/SFTP
1. استخدم FileZilla أو أي FTP client
2. اتصل بـ Hostinger
3. ارفع الملفات إلى `public_html/`

#### الطريقة 2: File Manager في Hostinger
1. افتح File Manager من لوحة التحكم
2. ارفع الملفات عبر المتصفح

---

## الخطوة 4: إعداد Environment Variables في Hostinger

في لوحة تحكم Hostinger، أضف:

```
DATABASE_URL = mysql://u272058362_family2:how%40Platform20241212@localhost:3306/u272058362_family2
AUTH_SECRET = temporary-secret-key-change-later-12345
NEXTAUTH_URL = https://myfamily.grade.sbs
CRON_SECRET = cron-secret-token-change-later-12345
UPLOAD_DIR = ./public/uploads
NODE_ENV = production
```

---

## الخطوة 5: إعداد Node.js في Hostinger

### 5.1 في لوحة التحكم:
1. ابحث عن "Node.js" أو "Node.js Selector"
2. اختر الدومين: `myfamily.grade.sbs`
3. فعّل Node.js (اختر إصدار 18 أو 20)
4. **Start Command**: `npm start`
5. **Application Root**: `public_html` (أو المسار الصحيح)

---

## الخطوة 6: إنشاء مجلد الرفع

عبر File Manager في Hostinger:
1. أنشئ مجلد: `public/uploads`
2. اضبط الصلاحيات: `755`

---

## الخطوة 7: اختبار الموقع

1. افتح: `https://myfamily.grade.sbs`
2. جرّب تسجيل الدخول
3. إذا نجح: الإعداد مكتمل ✅

---

## استكشاف الأخطاء

### المشكلة: الموقع لا يعمل
- تحقق من أن Node.js مفعّل
- تحقق من Start Command: `npm start`
- راجع سجلات الأخطاء في Hostinger

### المشكلة: خطأ في قاعدة البيانات
- تحقق من `DATABASE_URL` في Environment Variables
- تأكد من أن الجداول موجودة (نفذ `db:push` محلياً)

### المشكلة: الصور/الملفات لا تعمل
- تحقق من صلاحيات `public/uploads`
- تأكد من وجود المجلد

---

## ملاحظات مهمة

1. **بعد كل تحديث**: أعد بناء المشروع محلياً (`npm run build`) ثم ارفع `.next/`
2. **تغييرات قاعدة البيانات**: نفذ `db:push` محلياً (يصل لقاعدة البيانات على Hostinger)
3. **الأمان**: غيّر `AUTH_SECRET` و `CRON_SECRET` بعد الإعداد الأولي

---

## التحديثات المستقبلية

عند تحديث الكود:
1. `git pull` (سحب التحديثات)
2. `npm install` (تثبيت تبعيات جديدة)
3. `npm run build` (بناء المشروع)
4. رفع `.next/` و `node_modules/` الجديدة
5. إعادة تشغيل التطبيق في Hostinger
