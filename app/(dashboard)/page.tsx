import { getCustomers, getTransactions } from '@/lib/unblockpay'
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from '@/lib/mock-data'
import { Transaction, TransactionStatus } from '@/types'
import StatCard from '@/components/StatCard'
import TpvChartWrapper from '@/components/TpvChartWrapper'
import TransactionTable from '@/components/TransactionTable'
import MockDataBanner from '@/components/MockDataBanner'

export const dynamic = 'force-dynamic'

async function fetchData() {
  try {
    const customersRes = await getCustomers()
    if (!customersRes.success || !customersRes.data) {
      return { transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, mock: true }
    }

    const customers = customersRes.data
    const allTxs: Transaction[] = []

    await Promise.all(
      customers.map(async (customer) => {
        const txRes = await getTransactions(customer.id)
        if (txRes.success && txRes.data) {
          allTxs.push(...txRes.data.map((t) => ({ ...t, customer_id: customer.id })))
        }
      })
    )

    if (allTxs.length === 0) {
      return { transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, mock: true }
    }

    return { transactions: allTxs, customers, mock: false }
  } catch {
    return { transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, mock: true }
  }
}

function buildMetrics(transactions: Transaction[]) {
  const completed = transactions.filter((t) => t.status === TransactionStatus.completed)
  const tpv_total = completed.reduce((sum, t) => sum + t.sender.amount, 0)
  const avg_ticket = completed.length > 0 ? tpv_total / completed.length : 0
  const success_rate =
    transactions.length > 0 ? (completed.length / transactions.length) * 100 : 0

  const now = new Date()
  const tpv_by_day: { date: string; amount: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const amount = completed
      .filter((t) => t.finished_at && t.finished_at.startsWith(dateStr))
      .reduce((sum, t) => sum + t.sender.amount, 0)
    tpv_by_day.push({ date: dateStr, amount })
  }

  return { tpv_total, tx_count: transactions.length, avg_ticket, success_rate, tpv_by_day }
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function OverviewPage() {
  const { transactions, mock } = await fetchData()
  const { tpv_total, tx_count, avg_ticket, success_rate, tpv_by_day } =
    buildMetrics(transactions)

  const recent = [...transactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="mt-0.5 text-sm text-gray-500">Visão geral das operações</p>
      </div>

      <MockDataBanner show={mock} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="TPV Total" value={formatUSD(tpv_total)} />
        <StatCard label="Total de Transações" value={tx_count} />
        <StatCard label="Taxa de Sucesso" value={success_rate.toFixed(1)} suffix="%" />
        <StatCard label="Ticket Médio" value={formatUSD(avg_ticket)} />
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          TPV — últimos 14 dias
        </h2>
        <TpvChartWrapper data={tpv_by_day} />
      </div>

      {/* Recent transactions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Transações recentes
        </h2>
        <TransactionTable transactions={recent} />
      </div>
    </div>
  )
}
