# دليل النشر على Hostinger

## المتطلبات الأساسية

1. **Node.js 18+** على Hostinger
2. **MySQL/MariaDB** database
3. **SSL Certificate** (موصى به)
4. **Domain** مُعد بشكل صحيح

## خطوات النشر

### 1. إعداد قاعدة البيانات

1. إنشاء قاعدة بيانات MySQL جديدة من لوحة تحكم Hostinger
2. تسجيل بيانات الاتصال:
   - Host
   - Port (عادة 3306)
   - Database Name
   - Username
   - Password

### 2. إعداد Environment Variables

أنشئ ملف `.env` في جذر المشروع:

```env
DATABASE_URL="mysql://username:password@host:port/database_name"
AUTH_SECRET="your-very-secure-secret-key-here"
CRON_SECRET="your-cron-secret-token-here"
UPLOAD_DIR="./public/uploads"
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
```

**مهم**: استخدم `openssl rand -base64 32` لتوليد مفاتيح آمنة.

### 3. رفع الملفات

#### الطريقة 1: Git (موصى به)

```bash
# على الخادم
git clone your-repo-url
cd family-platform
npm install --production
```

#### الطريقة 2: FTP

ارفع جميع الملفات إلى مجلد الاستضافة (عادة `public_html` أو `htdocs`).

### 4. تثبيت التبعيات

```bash
npm install --production
```

### 5. بناء المشروع

```bash
npm run build
```

### 6. إعداد قاعدة البيانات

```bash
# توليد Prisma Client
npm run db:generate

# تطبيق Migrations
npm run db:push

# أو استخدام Migrations
npm run db:migrate
```

### 7. إنشاء مجلد الرفع

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### 8. تشغيل التطبيق

#### باستخدام PM2 (موصى به)

```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start npm --name "family-platform" -- start

# حفظ الإعدادات
pm2 save
pm2 startup
```

#### أو باستخدام Node.js مباشرة

```bash
npm start
```

### 9. إعداد Cron Job

في لوحة تحكم Hostinger، أضف Cron Job:

```bash
# يوم 1 من كل شهر الساعة 00:10
10 0 1 * * curl -X POST "https://yourdomain.com/api/jobs/generate-invoices?token=YOUR_CRON_SECRET"
```

أو باستخدام wget:

```bash
10 0 1 * * wget -q -O - "https://yourdomain.com/api/jobs/generate-invoices?token=YOUR_CRON_SECRET" > /dev/null 2>&1
```

### 10. إعداد Nginx/Apache (إذا لزم الأمر)

#### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache (.htaccess)

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## اختبار النشر

1. **اختبار تسجيل الدخول**: `/login`
2. **اختبار الشجرة**: `/tree`
3. **اختبار المالية**: `/finance` (لأمين الصندوق)
4. **اختبار الاجتماعات**: `/meetings`
5. **اختبار Cron Job**: استدعاء يدوي للـ endpoint

## استكشاف الأخطاء

### المشكلة: خطأ في الاتصال بقاعدة البيانات

- تحقق من `DATABASE_URL` في `.env`
- تأكد من أن قاعدة البيانات موجودة والمستخدم لديه الصلاحيات
- تحقق من إعدادات Firewall

### المشكلة: الملفات المرفوعة لا تعمل

- تحقق من صلاحيات مجلد `public/uploads`
- تأكد من أن المسار صحيح في `UPLOAD_DIR`

### المشكلة: Cron Job لا يعمل

- تحقق من `CRON_SECRET` في `.env` و Cron Job
- راجع سجلات Cron في Hostinger
- اختبر الـ endpoint يدوياً

### المشكلة: التطبيق لا يعمل بعد إعادة التشغيل

- استخدم PM2 للحفاظ على التطبيق قيد التشغيل
- أضف `pm2 startup` لبدء التطبيق تلقائياً

## الصيانة

### تحديث التطبيق

```bash
git pull
npm install --production
npm run build
pm2 restart family-platform
```

### نسخ احتياطي لقاعدة البيانات

```bash
mysqldump -u username -p database_name > backup.sql
```

### مراقبة الأداء

```bash
pm2 monit
pm2 logs family-platform
```

## الأمان

1. **تغيير جميع المفاتيح الافتراضية** في `.env`
2. **استخدام HTTPS** دائماً
3. **تحديث التبعيات** بانتظام
4. **نسخ احتياطي** يومي لقاعدة البيانات
5. **مراقبة سجلات Audit** بانتظام

## الدعم

في حالة وجود مشاكل، راجع:
- سجلات التطبيق: `pm2 logs`
- سجلات قاعدة البيانات
- سجلات الخادم في Hostinger
