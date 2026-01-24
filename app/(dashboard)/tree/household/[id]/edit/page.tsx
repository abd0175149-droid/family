'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { HouseholdMemberRole } from '@prisma/client'

interface Person {
  id: string
  fullName: string
  gender: string
}

interface Member {
  id: string
  personId: string
  role: string
  isPrimarySpouse: boolean | null
  person: { id: string; fullName: string; gender: string }
}

interface Household {
  id: string
  title: string | null
  members: Member[]
}

export default function EditHouseholdPage() {
  const params = useParams()
  const id = params?.id as string
  const [household, setHousehold] = useState<Household | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPersons, setLoadingPersons] = useState(false)
  const [personsLoadError, setPersonsLoadError] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [title, setTitle] = useState('')
  const [addPersonId, setAddPersonId] = useState('')
  const [addRole, setAddRole] = useState<HouseholdMemberRole>('child')
  const [addIsPrimarySpouse, setAddIsPrimarySpouse] = useState(false)

  const loadHousehold = () => {
    if (!id) return
    setLoading(true)
    fetch(`/api/tree/household/${id}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) setError('الأسرة غير موجودة')
          else setError('تعذر جلب بيانات الأسرة')
          return null
        }
        return res.json()
      })
      .then((data) => {
        setLoading(false)
        if (data) {
          setHousehold(data)
          setTitle(data.title ?? '')
        }
      })
      .catch(() => {
        setLoading(false)
        setError('تعذر جلب بيانات الأسرة')
      })
  }

  const loadPersons = () => {
    setPersonsLoadError(null)
    setLoadingPersons(true)
    fetch('/api/tree/search?q=', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          setLoadingPersons(false)
          setPersonsLoadError('تعذر تحميل قائمة الأشخاص')
          return null
        }
        return res.json()
      })
      .then((data) => {
        setLoadingPersons(false)
        if (data != null && Array.isArray(data)) setPersons(data)
        else setPersonsLoadError('تعذر تحميل قائمة الأشخاص')
      })
      .catch(() => {
        setLoadingPersons(false)
        setPersonsLoadError('تعذر تحميل قائمة الأشخاص')
      })
  }

  useEffect(() => {
    loadHousehold()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSaveTitle = async () => {
    if (!id) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/tree/household/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || undefined }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل التحديث')
      setHousehold(data)
      setError('')
      setSuccessMsg('تم حفظ العنوان.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!id || !addPersonId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/tree/household/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: addPersonId,
          role: addRole,
          isPrimarySpouse: addRole === 'wife' ? addIsPrimarySpouse : false,
        }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إضافة العضو')
      setHousehold(data)
      setAddPersonId('')
      setAddIsPrimarySpouse(false)
      setError('')
      setSuccessMsg('تمت إضافة العضو.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء إضافة العضو')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (personId: string) => {
    if (!id) return
    if (!confirm('هل تريد إزالة هذا العضو من الأسرة؟')) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/tree/household/${id}/members/${personId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إزالة العضو')
      setHousehold(data)
      setError('')
      setSuccessMsg('تمت إزالة العضو.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء إزالة العضو')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel: Record<string, string> = {
    husband: 'زوج',
    wife: 'زوجة',
    child: 'طفل',
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error && !household) {
    return (
      <DashboardLayout>
        <div className="glass-effect rounded-2xl p-6 text-center border border-gray-200/50 dark:border-gray-800/50">
          <p className="text-burgundy-600 dark:text-burgundy-400 font-medium mb-4">{error}</p>
          <Link
            href="/tree"
            className="inline-flex items-center gap-2 gradient-primary text-white px-4 py-2 rounded-xl font-medium"
          >
            العودة للشجرة
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">
              تعديل الأسرة
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              تعديل العنوان، إضافة أعضاء أو إزالتهم
            </p>
          </div>
          <Link
            href="/tree"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            ← العودة للشجرة
          </Link>
        </div>

        <div className="glass-effect rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800/50 space-y-6">
          {error && (
            <div className="bg-burgundy-50 dark:bg-burgundy-900/20 border border-burgundy-200 dark:border-burgundy-800 text-burgundy-700 dark:text-burgundy-400 px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="text-sm font-medium">✓ {successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              عنوان الأسرة (اختياري)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-primary-500"
                placeholder="مثال: أسرة محمد وعائشة"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                disabled={saving}
                className="px-4 py-2.5 gradient-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-4">الأعضاء الحاليون</h2>
            {household?.members.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm py-4">لا يوجد أعضاء بعد.</p>
            ) : (
              <ul className="space-y-3">
                {household?.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50/80 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{m.person.fullName}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm mr-2">
                        — {roleLabel[m.role] ?? m.role}
                        {m.role === 'wife' && m.isPrimarySpouse && ' (زوجة أساسية)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.personId)}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm font-medium text-burgundy-600 dark:text-burgundy-400 hover:bg-burgundy-50 dark:hover:bg-burgundy-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      إزالة
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-4">إضافة عضو</h2>
            {!persons.length && !loadingPersons && !personsLoadError && (
              <button
                type="button"
                onClick={loadPersons}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                تحميل قائمة الأشخاص
              </button>
            )}
            {loadingPersons && <p className="text-gray-600 dark:text-gray-400 text-sm py-2">جاري التحميل...</p>}
            {personsLoadError && (
              <p className="text-burgundy-600 dark:text-burgundy-400 text-sm py-2">{personsLoadError}</p>
            )}
            {persons.length > 0 && (
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">الشخص</label>
                  <select
                    value={addPersonId}
                    onChange={(e) => setAddPersonId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-50"
                  >
                    <option value="">اختر شخصاً...</option>
                    {persons
                      .filter((p) => !household?.members.some((m) => m.personId === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.gender === 'male' ? 'ذكر' : 'أنثى'})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">الدور</label>
                  <select
                    value={addRole}
                    onChange={(e) => {
                      const v = e.target.value as HouseholdMemberRole
                      setAddRole(v)
                      if (v !== 'wife') setAddIsPrimarySpouse(false)
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-50"
                  >
                    <option value="husband">زوج</option>
                    <option value="wife">زوجة</option>
                    <option value="child">طفل</option>
                  </select>
                </div>
                {addRole === 'wife' && (
                  <label className="flex items-center gap-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={addIsPrimarySpouse}
                      onChange={(e) => setAddIsPrimarySpouse(e.target.checked)}
                      className="w-4 h-4 text-gray-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">زوجة أساسية</span>
                  </label>
                )}
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={saving || !addPersonId}
                  className="px-4 py-2.5 gradient-primary text-white rounded-xl font-medium disabled:opacity-50"
                >
                  إضافة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
