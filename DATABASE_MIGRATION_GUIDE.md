# دليل تعديل قاعدة البيانات

## التعديلات المطلوبة

تم إضافة حقول جديدة لجدول `persons` لدعم النموذج الجديد لشجرة العائلة:

### الحقول الجديدة:
1. `father_id` - يشير إلى الأب (Person)
2. `mother_id` - يشير إلى الأم (Person)  
3. `primary_family_id` - يشير إلى الأسرة الأساسية التي نشأ فيها الشخص (Household)

## ملف SQL للتعديل

تم إنشاء ملف `prisma/migrations/add_parent_fields.sql` يحتوي على جميع التعديلات المطلوبة.

### خطوات التنفيذ:

1. **نسخ محتوى الملف**:
   ```sql
   -- Migration: إضافة حقول الأب والأم والأسرة الأساسية لجدول الأشخاص
   -- تاريخ: 2026-01-23

   -- إضافة الحقول الجديدة
   ALTER TABLE persons 
   ADD COLUMN father_id VARCHAR(191) NULL,
   ADD COLUMN mother_id VARCHAR(191) NULL,
   ADD COLUMN primary_family_id VARCHAR(191) NULL;

   -- إضافة Foreign Keys
   ALTER TABLE persons 
   ADD CONSTRAINT fk_person_father 
   FOREIGN KEY (father_id) REFERENCES persons(id) ON DELETE SET NULL;

   ALTER TABLE persons 
   ADD CONSTRAINT fk_person_mother 
   FOREIGN KEY (mother_id) REFERENCES persons(id) ON DELETE SET NULL;

   ALTER TABLE persons 
   ADD CONSTRAINT fk_person_primary_family 
   FOREIGN KEY (primary_family_id) REFERENCES households(id) ON DELETE SET NULL;

   -- إضافة Indexes لتحسين الأداء
   CREATE INDEX idx_person_father ON persons(father_id);
   CREATE INDEX idx_person_mother ON persons(mother_id);
   CREATE INDEX idx_person_primary_family ON persons(primary_family_id);
   ```

2. **تنفيذ SQL في قاعدة البيانات**:
   - افتح phpMyAdmin أو أي أداة إدارة MySQL
   - اختر قاعدة البيانات `u272058362_family2`
   - انسخ والصق محتوى الملف
   - اضغط "Go" أو "Execute"

3. **بعد التنفيذ**:
   - تأكد من أن الحقول تم إضافتها بنجاح
   - تحقق من أن Foreign Keys تم إنشاؤها
   - تحقق من أن Indexes تم إنشاؤها

## ملاحظات مهمة

- جميع الحقول الجديدة هي `NULL` (اختيارية) لتوافق مع البيانات الموجودة
- Foreign Keys تستخدم `ON DELETE SET NULL` لحماية البيانات
- يمكن ملء هذه الحقول تدريجياً عند إضافة بيانات جديدة

## بعد التعديل

بعد تنفيذ SQL، قم بـ:
1. تشغيل `npx prisma generate` لتحديث Prisma Client
2. إعادة بناء التطبيق
3. اختبار شجرة العائلة الجديدة
