'use client'

import { useEffect, useState } from 'react'

interface FinanceDashboardData {
  month: {
    year: number
    month: number
    totalDue: number
    totalPaid: number
    totalRemaining: number
    totalWithdrawals: number
    paidCount: number
    unpaidCount: number
    partialCount: number
    invoices: Array<{
      id: string
      user: {
        fullName: string
        email: string
      }
      dueAmount: number
      status: string
    }>
  }
  overall: {
    totalIn: number
    totalOut: number
    balance: number
  }
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

export default function FinanceDashboard() {
  const [data, setData] = useState<FinanceDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/finance/dashboard?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching dashboard:', error)
        setLoading(false)
      })
  }, [year, month])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">حدث خطأ أثناء جلب البيانات</p>
      </div>
    )
  }

  const stats = [
    {
      label: 'إجمالي المطلوب',
      value: data.month.totalDue,
      icon: '📊',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'إجمالي المدفوع',
      value: data.month.totalPaid,
      icon: '✅',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'المتبقي',
      value: data.month.totalRemaining,
      icon: '⏳',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'السحوبات',
      value: data.month.totalWithdrawals,
      icon: '💸',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            لوحة المالية
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">إدارة وإحصائيات الصندوق العائلي</p>
        </div>

        {/* Date Selectors */}
        <div className="flex gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 font-medium transition-all"
          >
            {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 font-medium transition-all"
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-soft border border-slate-200/50 dark:border-slate-800/50 hover:shadow-glow transition-all duration-300 animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stat.value.toLocaleString()} <span className="text-lg text-slate-500">ر.س</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Summary */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 lg:p-8 shadow-soft border border-slate-200/50 dark:border-slate-800/50">
        <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          ملخص الصندوق العام
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">إجمالي الدخل</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.overall.totalIn.toLocaleString()} <span className="text-lg text-slate-500">ر.س</span>
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">إجمالي المصروف</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.overall.totalOut.toLocaleString()} <span className="text-lg text-slate-500">ر.س</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl p-5 text-white shadow-glow">
            <p className="text-sm font-medium text-white/90 mb-2">الرصيد الحالي</p>
            <p className="text-2xl font-bold">
              {data.overall.balance.toLocaleString()} <span className="text-lg text-white/80">ر.س</span>
            </p>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-soft border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            فواتير {monthNames[month - 1]} {year}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {data.month.paidCount} مدفوع • {data.month.partialCount} جزئي • {data.month.unpaidCount} غير مدفوع
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">العضو</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">البريد الإلكتروني</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">المبلغ</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {data.month.invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{invoice.user.fullName}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{invoice.user.email}</td>
                  <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                    {invoice.dueAmount.toLocaleString()} <span className="text-slate-500">ر.س</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : invoice.status === 'partial'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {invoice.status === 'paid'
                        ? '✅ مدفوع'
                        : invoice.status === 'partial'
                        ? '⏳ جزئي'
                        : '❌ غير مدفوع'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
