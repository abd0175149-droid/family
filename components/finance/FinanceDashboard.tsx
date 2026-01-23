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

export default function FinanceDashboard() {
  const [data, setData] = useState<FinanceDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
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
    return <div className="p-8 text-center">جاري التحميل...</div>
  }

  if (!data) {
    return <div className="p-8 text-center text-red-600">حدث خطأ أثناء جلب البيانات</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">لوحة المالية</h1>

      <div className="mb-6 flex gap-4">
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المطلوب</div>
          <div className="text-2xl font-bold">{data.month.totalDue.toLocaleString()} ر.س</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المدفوع</div>
          <div className="text-2xl font-bold text-green-600">{data.month.totalPaid.toLocaleString()} ر.س</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">المتبقي</div>
          <div className="text-2xl font-bold text-red-600">{data.month.totalRemaining.toLocaleString()} ر.س</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">السحوبات</div>
          <div className="text-2xl font-bold">{data.month.totalWithdrawals.toLocaleString()} ر.س</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">ملخص الصندوق العام</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي الدخل</div>
            <div className="text-xl font-bold">{data.overall.totalIn.toLocaleString()} ر.س</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المصروف</div>
            <div className="text-xl font-bold">{data.overall.totalOut.toLocaleString()} ر.س</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">الرصيد</div>
            <div className="text-xl font-bold">{data.overall.balance.toLocaleString()} ر.س</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">الفواتير</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">العضو</th>
                <th className="text-right p-2">المبلغ</th>
                <th className="text-right p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.month.invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="p-2">{invoice.user.fullName}</td>
                  <td className="p-2">{invoice.dueAmount.toLocaleString()} ر.س</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.status === 'paid'
                        ? 'مدفوع'
                        : invoice.status === 'partial'
                        ? 'جزئي'
                        : 'غير مدفوع'}
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
