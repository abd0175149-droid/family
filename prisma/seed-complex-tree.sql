-- بيانات افتراضية لشجرة عائلة معقدة
-- الجيل الأول: جد وجدة
-- الجيل الثاني: 4 أبناء كل منهم متزوج ولديه 3 أبناء
-- الجيل الثالث: بعض الأبناء متزوجين ولديهم أبناء
-- تاريخ: 2026-01-23

-- ============================================
-- 0. حذف البيانات القديمة (إن وجدت)
-- ============================================

-- حذف البيانات بترتيب عكسي للاعتماديات
DELETE FROM household_links;
DELETE FROM household_members;
DELETE FROM relationships;
DELETE FROM persons;
DELETE FROM households;

-- ============================================
-- 1. إضافة أشخاص (Persons)
-- ============================================

-- الجيل الأول (الأجداد)
INSERT INTO persons (id, full_name, gender, birth_date, created_at, updated_at) VALUES
('person_grandfather', 'أحمد بن محمد العلي', 'male', '1945-01-15', NOW(), NOW()),
('person_grandmother', 'فاطمة بنت علي الحسن', 'female', '1950-03-20', NOW(), NOW());

-- الجيل الثاني (الآباء - 4 أبناء)
INSERT INTO persons (id, full_name, gender, birth_date, father_id, mother_id, created_at, updated_at) VALUES
-- الابن الأول
('person_father_1', 'محمد بن أحمد', 'male', '1970-05-12', 'person_grandfather', 'person_grandmother', NOW(), NOW()),
('person_mother_1', 'عائشة بنت خالد', 'female', '1975-08-25', NULL, NULL, NOW(), NOW()),

-- الابن الثاني
('person_father_2', 'علي بن أحمد', 'male', '1972-02-18', 'person_grandfather', 'person_grandmother', NOW(), NOW()),
('person_mother_2', 'مريم بنت خالد', 'female', '1977-06-30', NULL, NULL, NOW(), NOW()),

-- الابن الثالث
('person_father_3', 'حسن بن أحمد', 'male', '1974-09-14', 'person_grandfather', 'person_grandmother', NOW(), NOW()),
('person_mother_3', 'نورا بنت خالد', 'female', '1979-12-08', NULL, NULL, NOW(), NOW()),

-- الابن الرابع
('person_father_4', 'خالد بن أحمد', 'male', '1976-11-22', 'person_grandfather', 'person_grandmother', NOW(), NOW()),
('person_mother_4', 'سارة بنت خالد', 'female', '1981-04-15', NULL, NULL, NOW(), NOW());

-- الجيل الثالث (أبناء الآباء - كل أب لديه 3 أبناء)
INSERT INTO persons (id, full_name, gender, birth_date, father_id, mother_id, created_at, updated_at) VALUES
-- أبناء محمد وعائشة (3 أبناء)
('person_child_1_1', 'أحمد بن محمد', 'male', '2000-04-10', 'person_father_1', 'person_mother_1', NOW(), NOW()),
('person_child_1_2', 'فاطمة بنت محمد', 'female', '2002-07-15', 'person_father_1', 'person_mother_1', NOW(), NOW()),
('person_child_1_3', 'خالد بن محمد', 'male', '2005-11-20', 'person_father_1', 'person_mother_1', NOW(), NOW()),

-- أبناء علي ومريم (3 أبناء)
('person_child_2_1', 'يوسف بن علي', 'male', '2001-03-22', 'person_father_2', 'person_mother_2', NOW(), NOW()),
('person_child_2_2', 'سارة بنت علي', 'female', '2003-09-05', 'person_father_2', 'person_mother_2', NOW(), NOW()),
('person_child_2_3', 'عمر بن علي', 'male', '2006-01-18', 'person_father_2', 'person_mother_2', NOW(), NOW()),

-- أبناء حسن ونورا (3 أبناء)
('person_child_3_1', 'ليلى بنت حسن', 'female', '2002-01-18', 'person_father_3', 'person_mother_3', NOW(), NOW()),
('person_child_3_2', 'عبدالله بن حسن', 'male', '2004-05-12', 'person_father_3', 'person_mother_3', NOW(), NOW()),
('person_child_3_3', 'زينب بنت حسن', 'female', '2007-08-30', 'person_father_3', 'person_mother_3', NOW(), NOW()),

-- أبناء خالد وسارة (3 أبناء)
('person_child_4_1', 'محمود بن خالد', 'male', '2003-06-14', 'person_father_4', 'person_mother_4', NOW(), NOW()),
('person_child_4_2', 'ريم بنت خالد', 'female', '2005-10-25', 'person_father_4', 'person_mother_4', NOW(), NOW()),
('person_child_4_3', 'طارق بن خالد', 'male', '2008-02-11', 'person_father_4', 'person_mother_4', NOW(), NOW());

-- الجيل الرابع (أحفاد - بعض أبناء الجيل الثالث متزوجين)
-- أبناء أحمد بن محمد (الابن الأول من الجيل الثالث)
INSERT INTO persons (id, full_name, gender, birth_date, father_id, mother_id, created_at, updated_at) VALUES
('person_wife_1_1', 'نورا بنت يوسف', 'female', '2002-08-20', NULL, NULL, NOW(), NOW()),
('person_grandchild_1_1', 'محمد بن أحمد الصغير', 'male', '2020-03-15', 'person_child_1_1', 'person_wife_1_1', NOW(), NOW()),
('person_grandchild_1_2', 'فاطمة بنت أحمد الصغير', 'female', '2022-07-10', 'person_child_1_1', 'person_wife_1_1', NOW(), NOW()),

-- أبناء فاطمة بنت محمد (الابنة الثانية من الجيل الثالث)
('person_husband_1_2', 'علي بن يوسف', 'male', '2000-05-10', NULL, NULL, NOW(), NOW()),
('person_grandchild_1_3', 'أحمد بن علي', 'male', '2021-11-20', 'person_husband_1_2', 'person_child_1_2', NOW(), NOW()),

-- أبناء يوسف بن علي (الابن الأول من الجيل الثالث - أسرة علي)
('person_wife_2_1', 'مريم بنت عبدالله', 'female', '2003-12-05', NULL, NULL, NOW(), NOW()),
('person_grandchild_2_1', 'علي بن يوسف الصغير', 'male', '2020-09-12', 'person_child_2_1', 'person_wife_2_1', NOW(), NOW()),
('person_grandchild_2_2', 'خديجة بنت يوسف', 'female', '2023-01-25', 'person_child_2_1', 'person_wife_2_1', NOW(), NOW()),

-- أبناء ليلى بنت حسن (الابنة الأولى من الجيل الثالث - أسرة حسن)
('person_husband_3_1', 'محمود بن طارق', 'male', '2001-04-18', NULL, NULL, NOW(), NOW()),
('person_grandchild_3_1', 'حسن بن محمود', 'male', '2021-06-30', 'person_husband_3_1', 'person_child_3_1', NOW(), NOW()),

-- أبناء محمود بن خالد (الابن الأول من الجيل الثالث - أسرة خالد)
('person_wife_4_1', 'سارة بنت أحمد', 'female', '2005-07-22', NULL, NULL, NOW(), NOW()),
('person_grandchild_4_1', 'خالد بن محمود الصغير', 'male', '2022-04-18', 'person_child_4_1', 'person_wife_4_1', NOW(), NOW());

-- ============================================
-- 2. إضافة أسر (Households)
-- ============================================

-- أسرة الجد والجدة
INSERT INTO households (id, title, created_at, updated_at) VALUES
('household_grandparents', 'أسرة الجد أحمد والجدة فاطمة', NOW(), NOW());

-- أسر الآباء (4 أسر)
INSERT INTO households (id, title, created_at, updated_at) VALUES
('household_family_1', 'أسرة محمد وعائشة', NOW(), NOW()),
('household_family_2', 'أسرة علي ومريم', NOW(), NOW()),
('household_family_3', 'أسرة حسن ونورا', NOW(), NOW()),
('household_family_4', 'أسرة خالد وسارة', NOW(), NOW());

-- أسر الأحفاد المتزوجين (5 أسر)
INSERT INTO households (id, title, created_at, updated_at) VALUES
('household_grandchild_1_1', 'أسرة أحمد بن محمد ونورا', NOW(), NOW()),
('household_grandchild_1_2', 'أسرة علي وفاطمة بنت محمد', NOW(), NOW()),
('household_grandchild_2_1', 'أسرة يوسف بن علي ومريم', NOW(), NOW()),
('household_grandchild_3_1', 'أسرة محمود وليلى بنت حسن', NOW(), NOW()),
('household_grandchild_4_1', 'أسرة محمود بن خالد وسارة', NOW(), NOW());

-- ============================================
-- 3. إضافة أعضاء الأسر (Household Members)
-- ============================================

-- أسرة الجد والجدة
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_grandfather', 'household_grandparents', 'person_grandfather', 'husband', false, NOW()),
('hm_grandmother', 'household_grandparents', 'person_grandmother', 'wife', true, NOW());

-- أسرة محمد وعائشة
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_father_1', 'household_family_1', 'person_father_1', 'husband', false, NOW()),
('hm_mother_1', 'household_family_1', 'person_mother_1', 'wife', true, NOW()),
('hm_child_1_1', 'household_family_1', 'person_child_1_1', 'child', false, NOW()),
('hm_child_1_2', 'household_family_1', 'person_child_1_2', 'child', false, NOW()),
('hm_child_1_3', 'household_family_1', 'person_child_1_3', 'child', false, NOW());

-- أسرة علي ومريم
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_father_2', 'household_family_2', 'person_father_2', 'husband', false, NOW()),
('hm_mother_2', 'household_family_2', 'person_mother_2', 'wife', true, NOW()),
('hm_child_2_1', 'household_family_2', 'person_child_2_1', 'child', false, NOW()),
('hm_child_2_2', 'household_family_2', 'person_child_2_2', 'child', false, NOW()),
('hm_child_2_3', 'household_family_2', 'person_child_2_3', 'child', false, NOW());

-- أسرة حسن ونورا
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_father_3', 'household_family_3', 'person_father_3', 'husband', false, NOW()),
('hm_mother_3', 'household_family_3', 'person_mother_3', 'wife', true, NOW()),
('hm_child_3_1', 'household_family_3', 'person_child_3_1', 'child', false, NOW()),
('hm_child_3_2', 'household_family_3', 'person_child_3_2', 'child', false, NOW()),
('hm_child_3_3', 'household_family_3', 'person_child_3_3', 'child', false, NOW());

-- أسرة خالد وسارة
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_father_4', 'household_family_4', 'person_father_4', 'husband', false, NOW()),
('hm_mother_4', 'household_family_4', 'person_mother_4', 'wife', true, NOW()),
('hm_child_4_1', 'household_family_4', 'person_child_4_1', 'child', false, NOW()),
('hm_child_4_2', 'household_family_4', 'person_child_4_2', 'child', false, NOW()),
('hm_child_4_3', 'household_family_4', 'person_child_4_3', 'child', false, NOW());

-- أسر الأحفاد المتزوجين
-- أسرة أحمد بن محمد ونورا
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_gc_1_1_husband', 'household_grandchild_1_1', 'person_child_1_1', 'husband', false, NOW()),
('hm_gc_1_1_wife', 'household_grandchild_1_1', 'person_wife_1_1', 'wife', true, NOW()),
('hm_gc_1_1_child_1', 'household_grandchild_1_1', 'person_grandchild_1_1', 'child', false, NOW()),
('hm_gc_1_1_child_2', 'household_grandchild_1_1', 'person_grandchild_1_2', 'child', false, NOW());

-- أسرة علي وفاطمة بنت محمد
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_gc_1_2_husband', 'household_grandchild_1_2', 'person_husband_1_2', 'husband', false, NOW()),
('hm_gc_1_2_wife', 'household_grandchild_1_2', 'person_child_1_2', 'wife', true, NOW()),
('hm_gc_1_2_child', 'household_grandchild_1_2', 'person_grandchild_1_3', 'child', false, NOW());

-- أسرة يوسف بن علي ومريم
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_gc_2_1_husband', 'household_grandchild_2_1', 'person_child_2_1', 'husband', false, NOW()),
('hm_gc_2_1_wife', 'household_grandchild_2_1', 'person_wife_2_1', 'wife', true, NOW()),
('hm_gc_2_1_child_1', 'household_grandchild_2_1', 'person_grandchild_2_1', 'child', false, NOW()),
('hm_gc_2_1_child_2', 'household_grandchild_2_1', 'person_grandchild_2_2', 'child', false, NOW());

-- أسرة محمود وليلى بنت حسن
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_gc_3_1_husband', 'household_grandchild_3_1', 'person_husband_3_1', 'husband', false, NOW()),
('hm_gc_3_1_wife', 'household_grandchild_3_1', 'person_child_3_1', 'wife', true, NOW()),
('hm_gc_3_1_child', 'household_grandchild_3_1', 'person_grandchild_3_1', 'child', false, NOW());

-- أسرة محمود بن خالد وسارة
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_gc_4_1_husband', 'household_grandchild_4_1', 'person_child_4_1', 'husband', false, NOW()),
('hm_gc_4_1_wife', 'household_grandchild_4_1', 'person_wife_4_1', 'wife', true, NOW()),
('hm_gc_4_1_child', 'household_grandchild_4_1', 'person_grandchild_4_1', 'child', false, NOW());

-- ============================================
-- 4. تحديث primary_family_id للأشخاص
-- ============================================

-- تحديث primary_family_id للأبناء (الجيل الثاني)
UPDATE persons SET primary_family_id = 'household_grandparents' WHERE id IN ('person_father_1', 'person_father_2', 'person_father_3', 'person_father_4');

-- تحديث primary_family_id لأبناء الجيل الثالث
UPDATE persons SET primary_family_id = 'household_family_1' WHERE id IN ('person_child_1_1', 'person_child_1_2', 'person_child_1_3');
UPDATE persons SET primary_family_id = 'household_family_2' WHERE id IN ('person_child_2_1', 'person_child_2_2', 'person_child_2_3');
UPDATE persons SET primary_family_id = 'household_family_3' WHERE id IN ('person_child_3_1', 'person_child_3_2', 'person_child_3_3');
UPDATE persons SET primary_family_id = 'household_family_4' WHERE id IN ('person_child_4_1', 'person_child_4_2', 'person_child_4_3');

-- تحديث primary_family_id للأحفاد (الجيل الرابع)
UPDATE persons SET primary_family_id = 'household_grandchild_1_1' WHERE id IN ('person_grandchild_1_1', 'person_grandchild_1_2');
UPDATE persons SET primary_family_id = 'household_grandchild_1_2' WHERE id = 'person_grandchild_1_3';
UPDATE persons SET primary_family_id = 'household_grandchild_2_1' WHERE id IN ('person_grandchild_2_1', 'person_grandchild_2_2');
UPDATE persons SET primary_family_id = 'household_grandchild_3_1' WHERE id = 'person_grandchild_3_1';
UPDATE persons SET primary_family_id = 'household_grandchild_4_1' WHERE id = 'person_grandchild_4_1';

-- ============================================
-- 5. ربط الأسر (Household Links)
-- ============================================

-- ربط أسر الآباء بأسرة الجد
INSERT INTO household_links (id, child_household_id, parent_household_id, link_via_person_id, via_side, created_at) VALUES
('link_1', 'household_family_1', 'household_grandparents', 'person_father_1', 'father_side', NOW()),
('link_2', 'household_family_2', 'household_grandparents', 'person_father_2', 'father_side', NOW()),
('link_3', 'household_family_3', 'household_grandparents', 'person_father_3', 'father_side', NOW()),
('link_4', 'household_family_4', 'household_grandparents', 'person_father_4', 'father_side', NOW());

-- ربط أسر الأحفاد بأسر آبائهم
INSERT INTO household_links (id, child_household_id, parent_household_id, link_via_person_id, via_side, created_at) VALUES
-- أسر أحفاد محمد وعائشة
('link_5', 'household_grandchild_1_1', 'household_family_1', 'person_child_1_1', 'father_side', NOW()),
('link_6', 'household_grandchild_1_2', 'household_family_1', 'person_child_1_2', 'father_side', NOW()),

-- أسر أحفاد علي ومريم
('link_7', 'household_grandchild_2_1', 'household_family_2', 'person_child_2_1', 'father_side', NOW()),

-- أسر أحفاد حسن ونورا
('link_8', 'household_grandchild_3_1', 'household_family_3', 'person_child_3_1', 'father_side', NOW()),

-- أسر أحفاد خالد وسارة
('link_9', 'household_grandchild_4_1', 'household_family_4', 'person_child_4_1', 'father_side', NOW());

-- ============================================
-- ملاحظات:
-- ============================================
-- 1. هذا الملف يحتوي على بيانات لشجرة عائلية من 4 أجيال:
--    - الجيل الأول: جد وجدة (أحمد وفاطمة)
--    - الجيل الثاني: 4 أبناء كل منهم متزوج ولديه 3 أبناء
--    - الجيل الثالث: 12 طفل (3 لكل أسرة)
--    - الجيل الرابع: 7 أحفاد (بعض أبناء الجيل الثالث متزوجين)
--
-- 2. الأسر المتزوجة من الجيل الثالث:
--    - أحمد بن محمد (متزوج من نورا - لديه طفلان)
--    - فاطمة بنت محمد (متزوجة من علي - لديها طفل واحد)
--    - يوسف بن علي (متزوج من مريم - لديه طفلان)
--    - ليلى بنت حسن (متزوجة من محمود - لديها طفل واحد)
--    - محمود بن خالد (متزوج من سارة - لديه طفل واحد)
--
-- 3. جميع العلاقات محددة:
--    - father_id و mother_id لكل شخص
--    - primary_family_id للأشخاص
--    - household_links لربط الأسر
--
-- لاستخدام هذا الملف:
-- 1. تأكد من تنفيذ prisma/migrations/add_parent_fields.sql أولاً
-- 2. افتح MySQL/MariaDB
-- 3. اختر قاعدة البيانات: u272058362_family2
-- 4. نفذ هذا الملف في phpMyAdmin أو أي أداة MySQL
--
-- تحذير: هذا الملف سيحذف البيانات الموجودة إذا كانت هناك تعارضات في IDs
-- يفضل استخدامه على قاعدة بيانات جديدة أو بعد حذف البيانات القديمة
