import { TransactionStatus } from '@/types'

const colorMap: Record<string, string> = {
  [TransactionStatus.completed]: 'bg-green-100 text-green-700',
  [TransactionStatus.failed]: 'bg-red-100 text-red-700',
  [TransactionStatus.cancelled]: 'bg-red-100 text-red-700',
  [TransactionStatus.error]: 'bg-red-100 text-red-700',
  [TransactionStatus.processing]: 'bg-blue-100 text-blue-700',
  [TransactionStatus.awaiting_deposit]: 'bg-yellow-100 text-yellow-700',
  [TransactionStatus.refunded]: 'bg-gray-100 text-gray-600',
}

const labelMap: Record<string, string> = {
  [TransactionStatus.awaiting_deposit]: 'aguardando',
  [TransactionStatus.processing]: 'processando',
  [TransactionStatus.completed]: 'concluído',
  [TransactionStatus.failed]: 'falhou',
  [TransactionStatus.refunded]: 'reembolso',
  [TransactionStatus.cancelled]: 'cancelado',
  [TransactionStatus.error]: 'erro',
  approved: 'aprovado',
  pending: 'pendente',
  rejected: 'rejeitado',
}

interface Props {
  status: string
}

export default function StatusBadge({ status }: Props) {
  const color = colorMap[status] ?? 'bg-gray-100 text-gray-600'
  const label = labelMap[status] ?? status

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
