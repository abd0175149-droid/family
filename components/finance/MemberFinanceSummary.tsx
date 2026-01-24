'use client'

import { useEffect, useState } from 'react'

interface MemberFinanceSummary {
  invoices: Array<{
    id: string
    year: number
    month: number
    dueAmount: number
    status: string
    payments: Array<{
      amountPaid: number
      paidAt: string
    }>
  }>
  summary: {
    totalDue: number
    totalPaid: number
    totalRemaining: number
    overdueCount: number
    overdueAmount: number
  }
  fundSummary: {
    totalIn: number
    totalOut: number
    balance: number
  }
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

export default function MemberFinanceSummary() {
  const [data, setData] = useState<MemberFinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me/finance/summary')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching summary:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">جاري التحميل...</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-600 to-burgundy-500 bg-clip-text text-transparent mb-2">
          ملخص مالي
        </h1>
        <p className="text-gray-600 dark:text-gray-400">عرض تفاصيل دفعاتك وملخص الصندوق</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Fund Summary */}
        <div className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-gray-200/50 dark:border-gray-800/50">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">💰</span>
            ملخص الصندوق العام
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <span className="text-gray-700 dark:text-gray-300 font-medium">إجمالي الدخل</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {data.fundSummary.totalIn.toLocaleString()} <span className="text-sm text-gray-600">ر.س</span>
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <span className="text-gray-700 dark:text-gray-300 font-medium">إجمالي المصروف</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">
                {data.fundSummary.totalOut.toLocaleString()} <span className="text-sm text-gray-600">ر.س</span>
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl text-white shadow-glow">
              <span className="font-medium text-white/90">الرصيد الحالي</span>
              <span className="text-xl font-bold">
                {data.fundSummary.balance.toLocaleString()} <span className="text-sm text-white/80">ر.س</span>
              </span>
            </div>
          </div>
        </div>

        {/* My Payments Summary */}
        <div className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-gray-200/50 dark:border-gray-800/50">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            ملخص دفعاتي
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50/80 dark:bg-gray-900/30 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300 font-medium">إجمالي المطلوب</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {data.summary.totalDue.toLocaleString()} <span className="text-sm text-gray-600">ر.س</span>
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300 font-medium">إجمالي المدفوع</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {data.summary.totalPaid.toLocaleString()} <span className="text-sm text-gray-500">ر.س</span>
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300 font-medium">المتبقي</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {data.summary.totalRemaining.toLocaleString()} <span className="text-sm text-gray-500">ر.س</span>
              </span>
            </div>
            {data.summary.overdueCount > 0 && (
              <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <span className="text-red-700 dark:text-red-400 font-medium">
                  متأخرات ({data.summary.overdueCount})
                </span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  {data.summary.overdueAmount.toLocaleString()} <span className="text-sm text-gray-500">ر.س</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-soft border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            تفاصيل الفواتير
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">الشهر</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">المطلوب</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">المدفوع</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">المتبقي</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {data.invoices.map((invoice) => {
                const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
                const remaining = Number(invoice.dueAmount) - paid
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                      {monthNames[invoice.month - 1]} {invoice.year}
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                      {invoice.dueAmount.toLocaleString()} <span className="text-gray-500">ر.س</span>
                    </td>
                    <td className="p-4 font-semibold text-green-600 dark:text-green-400">
                      {paid.toLocaleString()} <span className="text-gray-500">ر.س</span>
                    </td>
                    <td className="p-4 font-semibold text-amber-600 dark:text-amber-400">
                      {remaining.toLocaleString()} <span className="text-gray-500">ر.س</span>
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
