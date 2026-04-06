'use client'

import { useCallback, useEffect, useState } from 'react'
import { Transaction, TransactionStatus, TransactionType } from '@/types'
import TransactionTable from '@/components/TransactionTable'
import StatusBadge from '@/components/StatusBadge'
import MockDataBanner from '@/components/MockDataBanner'

const PAGE_SIZE = 50

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: TransactionStatus.completed, label: 'Concluído' },
  { value: TransactionStatus.processing, label: 'Processando' },
  { value: TransactionStatus.awaiting_deposit, label: 'Aguardando depósito' },
  { value: TransactionStatus.failed, label: 'Falhou' },
  { value: TransactionStatus.cancelled, label: 'Cancelado' },
  { value: TransactionStatus.refunded, label: 'Reembolso' },
  { value: TransactionStatus.error, label: 'Erro' },
]

const RAIL_OPTIONS = [
  { value: '', label: 'Todos os rails' },
  { value: 'SWIFT', label: 'SWIFT' },
  { value: 'SEPA', label: 'SEPA' },
  { value: 'ACH', label: 'ACH' },
  { value: 'PIX', label: 'PIX' },
  { value: 'WIRE', label: 'WIRE' },
  { value: 'FASTER_PAYMENTS', label: 'Faster Payments' },
  { value: 'CHAPS', label: 'CHAPS' },
  { value: 'SPEI', label: 'SPEI' },
]

function TypeBadge({ type }: { type: TransactionType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        type === TransactionType.on_ramp
          ? 'bg-purple-100 text-purple-700'
          : 'bg-indigo-100 text-indigo-700'
      }`}
    >
      {type === TransactionType.on_ramp ? 'payin' : 'payout'}
    </span>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [mock, setMock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [railFilter, setRailFilter] = useState('')
  const [idSearch, setIdSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '500' })
      if (statusFilter) params.set('status', statusFilter)
      if (railFilter) params.set('rail', railFilter)

      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      setTransactions(data.transactions ?? [])
      setTotal(data.total ?? 0)
      setMock(data.mock ?? false)
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, railFilter])

  useEffect(() => {
    setPage(1)
    fetchTransactions()
  }, [fetchTransactions])

  // Client-side ID filter
  const filtered = idSearch
    ? transactions.filter((t) => t.id.toLowerCase().includes(idSearch.toLowerCase()))
    : transactions

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Transações</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {total > 0 ? `${filtered.length} transações encontradas` : 'Carregando...'}
        </p>
      </div>

      <MockDataBanner show={mock} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={railFilter}
          onChange={(e) => setRailFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {RAIL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={idSearch}
          onChange={(e) => setIdSearch(e.target.value)}
          placeholder="Buscar por ID..."
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-48"
        />
      </div>

      {/* Full table with extra columns */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Carregando transações...
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Rail</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Agência</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {tx.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={tx.type} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: tx.sender.currency,
                      minimumFractionDigits: 2,
                    }).format(tx.sender.amount)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {tx.sender.payment_rail}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {tx.sender.name ?? tx.customer_id?.slice(0, 12) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
