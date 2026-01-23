# منصة عائلية متكاملة - Family Platform

منصة عائلية شاملة مبنية على Next.js Full-Stack مع دعم:
- شجرة عائلية مع دعم تعدد الزوجات
- نظام مالي متكامل مع توليد فواتير تلقائي
- إدارة الاجتماعات والتصويت
- نظام صلاحيات متقدم (RBAC)

## التقنيات المستخدمة

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Database**: MySQL/MariaDB مع Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Type Safety**: TypeScript

## الإعداد والتشغيل

### 1. تثبيت التبعيات

```bash
npm install
```

### 2. إعداد قاعدة البيانات

1. إنشاء قاعدة بيانات MySQL
2. نسخ `.env.example` إلى `.env` وتحديث `DATABASE_URL`
3. تشغيل migrations:

```bash
npm run db:generate
npm run db:push
```

### 3. تشغيل المشروع

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## البنية

```
/app
  /api              # API Routes
  /(auth)           # صفحات المصادقة
  /(dashboard)      # صفحات لوحة التحكم
/components         # مكونات React
/lib
  /services         # منطق الأعمال
  /middleware       # RBAC & Auth
  /utils            # أدوات مساعدة
/prisma             # Prisma Schema
/public
  /uploads          # الملفات المرفوعة
```

## الأدوار والصلاحيات

- **super_admin**: صلاحيات كاملة
- **secretary**: إدارة المستخدمين والشجرة والاجتماعات
- **treasurer**: إدارة المالية الكاملة
- **member**: عرض الشجرة ودفعاته ومحاضر الاجتماعات

## النشر على Hostinger

1. رفع الكود إلى الاستضافة
2. تثبيت التبعيات: `npm install --production`
3. بناء المشروع: `npm run build`
4. إعداد Environment Variables
5. تشغيل migrations
6. إعداد Cron Job لتوليد الفواتير التلقائي

## Cron Job

لإعداد توليد الفواتير التلقائي شهرياً:

```bash
# في crontab على Hostinger
0 10 1 * * curl -X POST "https://yourdomain.com/api/jobs/generate-invoices?token=CRON_SECRET"
```

## الترخيص

خاص - للاستخدام العائلي فقط
