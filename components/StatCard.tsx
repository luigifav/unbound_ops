interface Props {
  label: string
  value: string | number
  prefix?: string
  suffix?: string
}

export default function StatCard({ label, value, prefix, suffix }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: '#7C3AED' }}>
        {prefix && <span>{prefix}</span>}
        {value}
        {suffix && <span className="text-xl font-semibold text-gray-400 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}
