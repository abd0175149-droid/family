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
    return <div className="p-8 text-center">جاري التحميل...</div>
  }

  if (!data) {
    return <div className="p-8 text-center text-red-600">حدث خطأ أثناء جلب البيانات</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">ملخص مالي</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">ملخص الصندوق العام</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>إجمالي الدخل:</span>
              <span className="font-bold">{data.fundSummary.totalIn.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span>إجمالي المصروف:</span>
              <span className="font-bold">{data.fundSummary.totalOut.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>الرصيد:</span>
              <span className="font-bold">{data.fundSummary.balance.toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">ملخص دفعاتي</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>إجمالي المطلوب:</span>
              <span className="font-bold">{data.summary.totalDue.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span>إجمالي المدفوع:</span>
              <span className="font-bold text-green-600">{data.summary.totalPaid.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span>المتبقي:</span>
              <span className="font-bold text-red-600">{data.summary.totalRemaining.toLocaleString()} ر.س</span>
            </div>
            {data.summary.overdueCount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>متأخرات ({data.summary.overdueCount}):</span>
                <span className="font-bold">{data.summary.overdueAmount.toLocaleString()} ر.س</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">تفاصيل الفواتير</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">الشهر</th>
                <th className="text-right p-2">المطلوب</th>
                <th className="text-right p-2">المدفوع</th>
                <th className="text-right p-2">المتبقي</th>
                <th className="text-right p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((invoice) => {
                const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
                const remaining = Number(invoice.dueAmount) - paid
                return (
                  <tr key={invoice.id} className="border-b">
                    <td className="p-2">
                      {invoice.year}/{invoice.month}
                    </td>
                    <td className="p-2">{invoice.dueAmount.toLocaleString()} ر.س</td>
                    <td className="p-2">{paid.toLocaleString()} ر.س</td>
                    <td className="p-2">{remaining.toLocaleString()} ر.س</td>
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
