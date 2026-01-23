# حل مشكلة 404 لملفات CSS

## المشكلة
```
GET https://myfamily.grade.sbs/_next/static/css/298d4aa518d38ca0.css net::ERR_ABORTED 404 (Not Found)
```

## الأسباب المحتملة

1. **ملفات `.next` لم يتم رفعها بشكل صحيح**
2. **Next.js لم يولد الملفات بشكل صحيح**
3. **مشكلة في مسار الملفات الثابتة**

## الحلول

### الحل 1: التأكد من رفع مجلد `.next` بالكامل

عند رفع الملفات إلى Hostinger، تأكد من رفع:
- ✅ `.next/` (المجلد الكامل)
- ✅ `public/` (المجلد الكامل)
- ✅ `node_modules/` (المجلد الكامل)
- ✅ جميع ملفات التكوين

### الحل 2: إعادة البناء محلياً

```bash
# 1. حذف مجلد .next القديم
rm -rf .next

# 2. إعادة البناء
npm run build

# 3. التحقق من وجود ملفات CSS
ls -la .next/static/css/
```

### الحل 3: التحقق من إعدادات Hostinger

في Hostinger Deployment Settings:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 22.x

### الحل 4: استخدام Next.js Standalone (إذا استمرت المشكلة)

عدّل `next.config.js`:
```javascript
const nextConfig = {
  output: 'standalone',
  // ... باقي الإعدادات
}
```

ثم استخدم `server.js` المخصص بدلاً من `next start`.

### الحل 5: التحقق من Base Path

إذا كان الموقع في subdirectory، أضف:
```javascript
const nextConfig = {
  basePath: '', // أو '/subdirectory' إذا لزم الأمر
  // ...
}
```

## خطوات التحقق

1. **تحقق من وجود الملفات محلياً**:
   ```bash
   ls -la .next/static/css/
   ```

2. **تحقق من محتوى `.next/BUILD_ID`**:
   ```bash
   cat .next/BUILD_ID
   ```

3. **تحقق من أن الملفات موجودة على السيرفر**:
   - افتح File Manager في Hostinger
   - اذهب إلى `public_html/.next/static/css/`
   - تأكد من وجود ملفات CSS

## إذا استمرت المشكلة

1. **امسح الكاش**:
   - في المتصفح: Ctrl+Shift+R (Hard Refresh)
   - في Hostinger: امسح CDN cache إن وجد

2. **تحقق من Logs**:
   - افتح Application Logs في Hostinger
   - ابحث عن أخطاء متعلقة بـ static files

3. **جرب إعادة الـ Deployment**:
   - احذف مجلد `.next` من السيرفر
   - أعد الـ deployment من GitHub
