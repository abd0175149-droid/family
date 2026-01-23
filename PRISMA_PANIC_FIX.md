# حل مشكلة Prisma PANIC: timer has gone away

## المشكلة
Prisma Query Engine يتعطل مع خطأ `PANIC: timer has gone away` في Hostinger.

## الأسباب المحتملة
1. **Multiple Prisma Client Instances**: إنشاء Prisma Client عدة مرات
2. **Connection Pool Issues**: مشاكل في إدارة connection pool
3. **Query Engine Crashes**: Query Engine يتعطل بسبب مشاكل في البيئة
4. **Race Conditions**: محاولات متعددة لاستخدام Prisma قبل أن يبدأ الـ engine

## الحلول المطبقة

### 1. إصلاح Prisma Client Singleton
- حفظ Prisma Client في `global` حتى في production
- منع إنشاء multiple instances
- إضافة connection pooling parameters

### 2. إضافة Retry Logic
- `lib/utils/prisma-retry.ts`: Utility functions للـ retry
- Retry مع exponential backoff
- Timeout للعمليات

### 3. تحسين UserService
- استخدام retry logic في `getUserByEmail`
- إعادة الاتصال عند PANIC errors
- معالجة أفضل للأخطاء

### 4. تحسين Health Check
- استخدام retry logic
- منع loops لا نهائية

## الملفات المعدلة

1. **`lib/prisma.ts`**:
   - حفظ Prisma Client في global في كل البيئات
   - إضافة connection pool parameters
   - تحسين graceful shutdown

2. **`lib/utils/prisma-retry.ts`** (جديد):
   - `withRetry()`: Retry logic مع exponential backoff
   - `withTimeout()`: Timeout للعمليات
   - `withRetryAndTimeout()`: دمج الاثنين

3. **`lib/services/UserService.ts`**:
   - استخدام retry logic في `getUserByEmail`
   - إعادة الاتصال عند PANIC errors
   - تحسين `verifyPassword`

4. **`app/api/health/route.ts`**:
   - استخدام retry logic

## خطوات إضافية إذا استمرت المشكلة

### 1. تحقق من DATABASE_URL
```bash
# يجب أن يكون بهذا الشكل:
mysql://user:password@localhost:3306/database?connection_limit=5&pool_timeout=20
```

### 2. تحقق من Prisma Version
```bash
npm list @prisma/client prisma
# يجب أن تكون نفس الإصدار
```

### 3. إعادة Generate Prisma Client
```bash
npx prisma generate
```

### 4. تحقق من Logs
- Application Logs في Hostinger
- ابحث عن أخطاء Prisma أو Node.js

### 5. استخدام Binary Engine (إذا لزم الأمر)
في `schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x"]
}
```

ثم:
```bash
npx prisma generate
```

## اختبار الحل

1. **Health Check**:
   ```bash
   curl https://myfamily.grade.sbs/api/health
   ```

2. **Login Test**:
   - جرب تسجيل الدخول عدة مرات
   - تحقق من عدم وجود PANIC errors

3. **Monitor Logs**:
   - راقب Application Logs
   - تأكد من عدم وجود أخطاء متكررة

## ملاحظات

- Retry logic يضيف delay صغير (500ms-2000ms)
- Timeout للعمليات هو 5 ثوانٍ
- Connection pool limit: 5 connections
- Pool timeout: 20 ثانية

إذا استمرت المشكلة بعد هذه الحلول، قد تكون المشكلة في:
- إعدادات Hostinger
- إصدار Node.js
- إصدار Prisma
- مشاكل في قاعدة البيانات نفسها
