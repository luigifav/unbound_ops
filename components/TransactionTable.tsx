import { Transaction, TransactionType } from '@/types'
import StatusBadge from './StatusBadge'

interface Props {
  transactions: Transaction[]
  limit?: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function TransactionTable({ transactions, limit }: Props) {
  const rows = limit ? transactions.slice(0, limit) : transactions

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
        Nenhuma transação encontrada.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              ID
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
              Valor
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Rail
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Data
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {tx.id.slice(0, 8)}...
              </td>
              <td className="hidden sm:table-cell px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    tx.type === TransactionType.on_ramp
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {tx.type === TransactionType.on_ramp ? 'payin' : 'payout'}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={tx.status} />
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                {formatAmount(tx.sender.amount, tx.sender.currency)}
              </td>
              <td className="hidden sm:table-cell px-4 py-3 text-xs text-gray-500 font-mono">
                {tx.sender.payment_rail}
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {formatDate(tx.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
