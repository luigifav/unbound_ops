'use client'

import dynamic from 'next/dynamic'

const TpvChart = dynamic(() => import('./TpvChart'), { ssr: false })

interface Props {
  data: { date: string; amount: number }[]
}

export default function TpvChartWrapper({ data }: Props) {
  return <TpvChart data={data} />
}
