import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { TrendPoint } from '@/types/api'

export interface MTTRChartProps {
  data: TrendPoint[]
}

export function MTTRChart({ data }: MTTRChartProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <h4 className="font-bold text-xs uppercase tracking-wider text-[#EFF0D1] mb-2">Mean Time to Resolve (Hours)</h4>
      <div className="flex-1 w-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3e4b" />
            <XAxis dataKey="date" stroke="#D7C0D0" fontSize={11} />
            <YAxis stroke="#D7C0D0" fontSize={11} />
            <Tooltip contentStyle={{ background: '#262730', color: '#EFF0D1', borderRadius: '8px', border: '1px solid #3d3e4b', fontSize: '11px' }} />
            <Line type="monotone" dataKey="value" stroke="#D33F49" strokeWidth={2} dot={{ r: 3, fill: '#D33F49' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
