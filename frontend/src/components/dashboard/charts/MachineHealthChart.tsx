import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { MachineHealth } from '@/types/api'

export interface MachineHealthChartProps {
  data: MachineHealth[]
}

export function MachineHealthChart({ data }: MachineHealthChartProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <h4 className="font-bold text-xs uppercase tracking-wider text-[#EFF0D1] mb-2">Machine Health Index (%)</h4>
      <div className="flex-1 w-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3e4b" />
            <XAxis dataKey="machine_id" stroke="#D7C0D0" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#D7C0D0" fontSize={11} />
            <Tooltip contentStyle={{ background: '#262730', color: '#EFF0D1', borderRadius: '8px', border: '1px solid #3d3e4b', fontSize: '11px' }} />
            <Bar dataKey="health_score" fill="#77BA99" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
