export const dynamic = 'force-dynamic'

import { getLiveCustomers, getLiveTransactions } from '@/lib/data'
import { Customer, Transaction, TransactionStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import MockDataBanner from '@/components/MockDataBanner'

async function fetchClientes() {
  const [{ data: customers, mock: mockC }, { data: transactions, mock: mockT }] =
    await Promise.all([getLiveCustomers(), getLiveTransactions()])

  const mock = mockC || mockT

  const txMap: Record<string, Transaction[]> = {}
  for (const t of transactions) {
    if (t.customer_id) {
      txMap[t.customer_id] = txMap[t.customer_id] ?? []
      txMap[t.customer_id].push(t)
    }
  }

  const list = customers.map((c: Customer) => {
    const txs = txMap[c.id] ?? []
    const completed = txs.filter((t) => t.status === TransactionStatus.completed)
    const tpv = completed.reduce((sum, t) => sum + t.sender.amount, 0)
    const sorted = [...txs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const last_tx_at = sorted[0]?.created_at ?? null
    const name =
      c.business_legal_name ?? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()

    return { id: c.id, name, email: c.email, status: c.status, tx_count: txs.length, tpv, last_tx_at }
  })

  list.sort((a, b) => b.tpv - a.tpv)
  return { list, mock }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function AgenciesPage() {
  const { list, mock } = await fetchClientes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {list.length} cliente{list.length !== 1 ? 's' : ''} cadastrado{list.length !== 1 ? 's' : ''}
        </p>
      </div>

      <MockDataBanner show={mock} />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 sm:px-6 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Cliente
              </th>
              <th className="px-4 py-3 sm:px-6 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 sm:px-6 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                TPV Total
              </th>
              <th className="hidden sm:table-cell px-4 py-3 sm:px-6 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Transações
              </th>
              <th className="hidden md:table-cell px-4 py-3 sm:px-6 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Última TX
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="text-sm font-medium text-gray-900">{cliente.name}</div>
                  <div className="text-xs text-gray-400">{cliente.email}</div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <StatusBadge status={cliente.status} />
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right text-sm font-semibold text-gray-800">
                  {formatUSD(cliente.tpv)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 sm:px-6 sm:py-4 text-right text-sm text-gray-600">
                  {cliente.tx_count}
                </td>
                <td className="hidden md:table-cell px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-400">
                  {formatDate(cliente.last_tx_at)}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
