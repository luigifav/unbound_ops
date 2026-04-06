interface Props {
  show: boolean
}

export default function MockDataBanner({ show }: Props) {
  if (!show) return null

  return (
    <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <span>⚠</span>
      <span>Exibindo dados de exemplo — API indisponível</span>
    </div>
  )
}
