import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { TrendPoint } from '@/types/api'

export interface TicketsTrendChartProps {
  data: TrendPoint[]
}

export function TicketsTrendChart({ data }: TicketsTrendChartProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <h4 className="font-bold text-xs uppercase tracking-wider text-[#EFF0D1] mb-2">Weekly Inspection Volume</h4>
      <div className="flex-1 w-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#77BA99" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#77BA99" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3e4b" />
            <XAxis dataKey="date" stroke="#D7C0D0" fontSize={11} />
            <YAxis stroke="#D7C0D0" fontSize={11} />
            <Tooltip contentStyle={{ background: '#262730', color: '#EFF0D1', borderRadius: '8px', border: '1px solid #3d3e4b', fontSize: '11px' }} />
            <Area type="monotone" dataKey="value" stroke="#77BA99" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
