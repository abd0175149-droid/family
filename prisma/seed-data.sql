-- بيانات افتراضية لشجرة عائلية
-- استخدم هذا الملف لملء قاعدة البيانات ببيانات تجريبية

-- ============================================
-- 1. إضافة أشخاص (Persons)
-- ============================================

-- الجيل الأول (الأجداد)
INSERT INTO persons (id, full_name, gender, birth_date, created_at, updated_at) VALUES
('person_grandfather_1', 'أحمد بن محمد', 'male', '1950-01-15', NOW(), NOW()),
('person_grandmother_1', 'فاطمة بنت علي', 'female', '1955-03-20', NOW(), NOW()),
('person_grandfather_2', 'خالد بن إبراهيم', 'male', '1948-07-10', NOW(), NOW()),
('person_grandmother_2', 'سارة بنت حسن', 'female', '1952-11-05', NOW(), NOW());

-- الجيل الثاني (الآباء)
INSERT INTO persons (id, full_name, gender, birth_date, created_at, updated_at) VALUES
('person_father_1', 'محمد بن أحمد', 'male', '1975-05-12', NOW(), NOW()),
('person_mother_1', 'عائشة بنت خالد', 'female', '1980-08-25', NOW(), NOW()),
('person_father_2', 'علي بن أحمد', 'male', '1978-02-18', NOW(), NOW()),
('person_mother_2', 'مريم بنت خالد', 'female', '1982-06-30', NOW(), NOW()),
('person_father_3', 'حسن بن أحمد', 'male', '1981-09-14', NOW(), NOW()),
('person_mother_3', 'نورا بنت خالد', 'female', '1985-12-08', NOW(), NOW());

-- الجيل الثالث (الأبناء)
INSERT INTO persons (id, full_name, gender, birth_date, created_at, updated_at) VALUES
-- أبناء محمد وعائشة
('person_child_1', 'أحمد بن محمد', 'male', '2005-04-10', NOW(), NOW()),
('person_child_2', 'فاطمة بنت محمد', 'female', '2007-07-15', NOW(), NOW()),
('person_child_3', 'خالد بن محمد', 'male', '2010-11-20', NOW(), NOW()),

-- أبناء علي ومريم
('person_child_4', 'سارة بنت علي', 'female', '2006-03-22', NOW(), NOW()),
('person_child_5', 'يوسف بن علي', 'male', '2009-09-05', NOW(), NOW()),

-- أبناء حسن ونورا
('person_child_6', 'ليلى بنت حسن', 'female', '2008-01-18', NOW(), NOW()),
('person_child_7', 'عمر بن حسن', 'male', '2012-05-12', NOW(), NOW());

-- ============================================
-- 2. إضافة أسر (Households)
-- ============================================

-- أسرة الجد الأول
INSERT INTO households (id, title, created_at, updated_at) VALUES
('household_grandfather_1', 'أسرة الجد أحمد', NOW(), NOW());

-- أسر الآباء
INSERT INTO households (id, title, created_at, updated_at) VALUES
('household_family_1', 'أسرة محمد وعائشة', NOW(), NOW()),
('household_family_2', 'أسرة علي ومريم', NOW(), NOW()),
('household_family_3', 'أسرة حسن ونورا', NOW(), NOW());

-- ============================================
-- 3. إضافة أعضاء الأسر (Household Members)
-- ============================================

-- أسرة الجد
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_grandfather_1', 'household_grandfather_1', 'person_grandfather_1', 'husband', false, NOW()),
('hm_grandmother_1', 'household_grandfather_1', 'person_grandmother_1', 'wife', true, NOW());

-- أسرة محمد وعائشة
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_father_1', 'household_family_1', 'person_father_1', 'husband', false, NOW()),
('hm_mother_1', 'household_family_1', 'person_mother_1', 'wife', true, NOW()),
('hm_child_1', 'household_family_1', 'person_child_1', 'child', false, NOW()),
('hm_child_2', 'household_family_1', 'person_child_2', 'child', false, NOW()),
('hm_child_3', 'household_family_1', 'person_child_3', 'child', false, NOW());

-- أسرة علي ومريم
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_father_2', 'household_family_2', 'person_father_2', 'husband', false, NOW()),
('hm_mother_2', 'household_family_2', 'person_mother_2', 'wife', true, NOW()),
('hm_child_4', 'household_family_2', 'person_child_4', 'child', false, NOW()),
('hm_child_5', 'household_family_2', 'person_child_5', 'child', false, NOW());

-- أسرة حسن ونورا
INSERT INTO household_members (id, household_id, person_id, role, is_primary_spouse, created_at) VALUES
('hm_father_3', 'household_family_3', 'person_father_3', 'husband', false, NOW()),
('hm_mother_3', 'household_family_3', 'person_mother_3', 'wife', true, NOW()),
('hm_child_6', 'household_family_3', 'person_child_6', 'child', false, NOW()),
('hm_child_7', 'household_family_3', 'person_child_7', 'child', false, NOW());

-- ============================================
-- 4. إضافة العلاقات (Relationships)
-- ============================================

-- علاقات الأب/الأم
INSERT INTO relationships (id, person_id_1, person_id_2, relation_type, start_date, created_at) VALUES
-- أحمد هو والد محمد
('rel_1', 'person_grandfather_1', 'person_father_1', 'father', '1975-05-12', NOW()),
-- فاطمة هي والدة محمد
('rel_2', 'person_grandmother_1', 'person_father_1', 'mother', '1975-05-12', NOW()),

-- أحمد هو والد علي
('rel_3', 'person_grandfather_1', 'person_father_2', 'father', '1978-02-18', NOW()),
-- فاطمة هي والدة علي
('rel_4', 'person_grandmother_1', 'person_father_2', 'mother', '1978-02-18', NOW()),

-- أحمد هو والد حسن
('rel_5', 'person_grandfather_1', 'person_father_3', 'father', '1981-09-14', NOW()),
-- فاطمة هي والدة حسن
('rel_6', 'person_grandmother_1', 'person_father_3', 'mother', '1981-09-14', NOW()),

-- خالد هو والد عائشة
('rel_7', 'person_grandfather_2', 'person_mother_1', 'father', '1980-08-25', NOW()),
-- سارة هي والدة عائشة
('rel_8', 'person_grandmother_2', 'person_mother_1', 'mother', '1980-08-25', NOW()),

-- خالد هو والد مريم
('rel_9', 'person_grandfather_2', 'person_mother_2', 'father', '1982-06-30', NOW()),
-- سارة هي والدة مريم
('rel_10', 'person_grandmother_2', 'person_mother_2', 'mother', '1982-06-30', NOW()),

-- خالد هو والد نورا
('rel_11', 'person_grandfather_2', 'person_mother_3', 'father', '1985-12-08', NOW()),
-- سارة هي والدة نورا
('rel_12', 'person_grandmother_2', 'person_mother_3', 'mother', '1985-12-08', NOW()),

-- علاقات الأبناء
-- محمد هو والد أحمد (الابن)
('rel_13', 'person_father_1', 'person_child_1', 'father', '2005-04-10', NOW()),
-- عائشة هي والدة أحمد (الابن)
('rel_14', 'person_mother_1', 'person_child_1', 'mother', '2005-04-10', NOW()),

-- محمد هو والد فاطمة (الابنة)
('rel_15', 'person_father_1', 'person_child_2', 'father', '2007-07-15', NOW()),
-- عائشة هي والدة فاطمة (الابنة)
('rel_16', 'person_mother_1', 'person_child_2', 'mother', '2007-07-15', NOW()),

-- محمد هو والد خالد (الابن)
('rel_17', 'person_father_1', 'person_child_3', 'father', '2010-11-20', NOW()),
-- عائشة هي والدة خالد (الابن)
('rel_18', 'person_mother_1', 'person_child_3', 'mother', '2010-11-20', NOW()),

-- علي هو والد سارة (الابنة)
('rel_19', 'person_father_2', 'person_child_4', 'father', '2006-03-22', NOW()),
-- مريم هي والدة سارة (الابنة)
('rel_20', 'person_mother_2', 'person_child_4', 'mother', '2006-03-22', NOW()),

-- علي هو والد يوسف (الابن)
('rel_21', 'person_father_2', 'person_child_5', 'father', '2009-09-05', NOW()),
-- مريم هي والدة يوسف (الابن)
('rel_22', 'person_mother_2', 'person_child_5', 'mother', '2009-09-05', NOW()),

-- حسن هو والد ليلى (الابنة)
('rel_23', 'person_father_3', 'person_child_6', 'father', '2008-01-18', NOW()),
-- نورا هي والدة ليلى (الابنة)
('rel_24', 'person_mother_3', 'person_child_6', 'mother', '2008-01-18', NOW()),

-- حسن هو والد عمر (الابن)
('rel_25', 'person_father_3', 'person_child_7', 'father', '2012-05-12', NOW()),
-- نورا هي والدة عمر (الابن)
('rel_26', 'person_mother_3', 'person_child_7', 'mother', '2012-05-12', NOW());

-- علاقات الزوجية
INSERT INTO relationships (id, person_id_1, person_id_2, relation_type, start_date, created_at) VALUES
('rel_spouse_1', 'person_grandfather_1', 'person_grandmother_1', 'spouse', '1970-01-01', NOW()),
('rel_spouse_2', 'person_grandfather_2', 'person_grandmother_2', 'spouse', '1972-06-15', NOW()),
('rel_spouse_3', 'person_father_1', 'person_mother_1', 'spouse', '2000-05-20', NOW()),
('rel_spouse_4', 'person_father_2', 'person_mother_2', 'spouse', '2003-08-10', NOW()),
('rel_spouse_5', 'person_father_3', 'person_mother_3', 'spouse', '2006-11-25', NOW());

-- ============================================
-- 5. ربط الأسر (Household Links)
-- ============================================

-- ربط أسر الآباء بأسرة الجد
INSERT INTO household_links (id, child_household_id, parent_household_id, link_via_person_id, via_side, created_at) VALUES
('link_1', 'household_family_1', 'household_grandfather_1', 'person_father_1', 'father_side', NOW()),
('link_2', 'household_family_2', 'household_grandfather_1', 'person_father_2', 'father_side', NOW()),
('link_3', 'household_family_3', 'household_grandfather_1', 'person_father_3', 'father_side', NOW());

-- ============================================
-- ملاحظات:
-- ============================================
-- 1. هذا الملف يحتوي على بيانات تجريبية لشجرة عائلية من 3 أجيال
-- 2. الجيل الأول: الجد والجدة (أحمد وفاطمة) + (خالد وسارة)
-- 3. الجيل الثاني: 3 أسر (محمد وعائشة، علي ومريم، حسن ونورا)
-- 4. الجيل الثالث: 7 أطفال
-- 5. جميع العلاقات (أب/أم/زوج) محددة
-- 6. جميع الأسر مربوطة بأسرة الجد
-- 
-- لاستخدام هذا الملف:
-- 1. افتح MySQL/MariaDB
-- 2. اختر قاعدة البيانات: u272058362_family2
-- 3. نفذ هذا الملف أو انسخه وألصقه في phpMyAdmin
-- 
-- تحذير: هذا الملف سيحذف البيانات الموجودة إذا كانت هناك تعارضات في IDs
-- يفضل استخدامه على قاعدة بيانات جديدة أو بعد حذف البيانات القديمة
