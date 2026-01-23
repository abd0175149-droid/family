import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface SetMemberDuesData {
  userId: string
  monthlyAmount: number
  effectiveFrom: Date
  effectiveTo?: Date
}

export interface CreatePaymentData {
  userId: string
  invoiceId: string
  amountPaid: number
  paidAt: Date
  receiptFileId?: string
}

export interface CreateWithdrawalData {
  amount: number
  reason: string
  beneficiaryName?: string
  receiptFileId?: string
  withdrawnAt: Date
}

export class FinanceService {
  static async generateMonthlyInvoices(year: number, month: number) {
    // Get all active members
    const activeUsers = await prisma.user.findMany({
      where: {
        status: 'active',
        role: {
          in: ['member', 'treasurer', 'secretary', 'super_admin'],
        },
      },
    })

    const invoices = []

    for (const user of activeUsers) {
      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findUnique({
        where: {
          userId_year_month: {
            userId: user.id,
            year,
            month,
          },
        },
      })

      if (existingInvoice) {
        continue
      }

      // Get active dues for this month
      const activeDues = await prisma.memberDues.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          effectiveFrom: {
            lte: new Date(year, month - 1, 1),
          },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date(year, month - 1, 1) } },
          ],
        },
        orderBy: {
          effectiveFrom: 'desc',
        },
      })

      if (!activeDues) {
        continue
      }

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          userId: user.id,
          year,
          month,
          dueAmount: activeDues.monthlyAmount,
          status: 'unpaid',
        },
      })

      invoices.push(invoice)
    }

    return invoices
  }

  static async getMemberDues(userId: string) {
    return prisma.memberDues.findMany({
      where: { userId },
      orderBy: {
        effectiveFrom: 'desc',
      },
    })
  }

  static async setMemberDues(data: SetMemberDuesData, createdBy: string) {
    // Deactivate old dues if needed
    if (data.effectiveTo) {
      await prisma.memberDues.updateMany({
        where: {
          userId: data.userId,
          isActive: true,
        },
        data: {
          isActive: false,
          effectiveTo: data.effectiveFrom,
        },
      })
    }

    return prisma.memberDues.create({
      data: {
        userId: data.userId,
        monthlyAmount: data.monthlyAmount,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        isActive: true,
        createdBy,
      },
    })
  }

  static async createPayment(data: CreatePaymentData, createdBy: string) {
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        invoiceId: data.invoiceId,
        amountPaid: data.amountPaid,
        paidAt: data.paidAt,
        receiptFileId: data.receiptFileId,
        createdBy,
      },
      include: {
        invoice: true,
      },
    })

    // Update invoice status
    await this.updateInvoiceStatus(data.invoiceId)

    return payment
  }

  static async createWithdrawal(data: CreateWithdrawalData, createdBy: string) {
    return prisma.withdrawal.create({
      data: {
        amount: data.amount,
        reason: data.reason,
        beneficiaryName: data.beneficiaryName,
        receiptFileId: data.receiptFileId,
        withdrawnAt: data.withdrawnAt,
        createdBy,
      },
    })
  }

  static async updateInvoiceStatus(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return
    }

    const totalPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amountPaid),
      0
    )
    const dueAmount = Number(invoice.dueAmount)
    const remaining = dueAmount - totalPaid

    let status: InvoiceStatus = 'unpaid'
    if (remaining <= 0) {
      status = 'paid'
    } else if (totalPaid > 0) {
      status = 'partial'
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
    })
  }

  static async getFinanceDashboard(year?: number, month?: number) {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || now.getMonth() + 1

    // Get all invoices for the month
    const invoices = await prisma.invoice.findMany({
      where: {
        year: targetYear,
        month: targetMonth,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payments: true,
      },
    })

    // Calculate totals
    const totalDue = invoices.reduce(
      (sum, inv) => sum + Number(inv.dueAmount),
      0
    )
    const totalPaid = invoices.reduce(
      (sum, inv) =>
        sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amountPaid), 0),
      0
    )
    const totalRemaining = totalDue - totalPaid

    // Get withdrawals for the month
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        withdrawnAt: {
          gte: new Date(targetYear, targetMonth - 1, 1),
          lt: new Date(targetYear, targetMonth, 1),
        },
      },
    })

    const totalWithdrawals = withdrawals.reduce(
      (sum, w) => sum + Number(w.amount),
      0
    )

    // Get all-time totals
    const allPayments = await prisma.payment.findMany()
    const allWithdrawals = await prisma.withdrawal.findMany()

    const totalIn = allPayments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0
    )
    const totalOut = allWithdrawals.reduce(
      (sum, w) => sum + Number(w.amount),
      0
    )
    const balance = totalIn - totalOut

    return {
      month: {
        year: targetYear,
        month: targetMonth,
        invoices,
        totalDue,
        totalPaid,
        totalRemaining,
        totalWithdrawals,
        paidCount: invoices.filter((inv) => inv.status === 'paid').length,
        unpaidCount: invoices.filter((inv) => inv.status === 'unpaid').length,
        partialCount: invoices.filter((inv) => inv.status === 'partial').length,
      },
      overall: {
        totalIn,
        totalOut,
        balance,
      },
    }
  }

  static async getMemberFinanceSummary(userId: string) {
    // Get all invoices for the user
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        payments: {
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })

    // Calculate summary
    const totalDue = invoices.reduce(
      (sum, inv) => sum + Number(inv.dueAmount),
      0
    )
    const totalPaid = invoices.reduce(
      (sum, inv) =>
        sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amountPaid), 0),
      0
    )
    const totalRemaining = totalDue - totalPaid

    // Get overdue invoices (unpaid from previous months)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const overdueInvoices = invoices.filter((inv) => {
      if (inv.status === 'paid') return false
      const invoiceDate = new Date(inv.year, inv.month - 1, 1)
      const currentDate = new Date(currentYear, currentMonth - 1, 1)
      return invoiceDate < currentDate
    })

    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => {
        const paid = inv.payments.reduce(
          (pSum, p) => pSum + Number(p.amountPaid),
          0
        )
        return sum + (Number(inv.dueAmount) - paid)
      },
      0
    )

    // Get overall fund summary (without details)
    const allPayments = await prisma.payment.findMany()
    const allWithdrawals = await prisma.withdrawal.findMany()

    const fundTotalIn = allPayments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0
    )
    const fundTotalOut = allWithdrawals.reduce(
      (sum, w) => sum + Number(w.amount),
      0
    )
    const fundBalance = fundTotalIn - fundTotalOut

    return {
      invoices,
      summary: {
        totalDue,
        totalPaid,
        totalRemaining,
        overdueCount: overdueInvoices.length,
        overdueAmount,
      },
      fundSummary: {
        totalIn: fundTotalIn,
        totalOut: fundTotalOut,
        balance: fundBalance,
      },
    }
  }

  static async exportFinanceReport(
    type: 'pdf' | 'excel',
    year?: number,
    month?: number
  ) {
    // This is a placeholder - actual implementation would use libraries like
    // pdfkit for PDF or exceljs for Excel
    const dashboard = await this.getFinanceDashboard(year, month)

    return {
      type,
      data: dashboard,
      message: 'Export functionality will be implemented',
    }
  }
}
