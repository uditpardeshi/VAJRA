import React from 'react'
import type { ConfidenceBucket } from '@/types/api'

export interface ConfidenceDistributionProps {
  data: ConfidenceBucket[]
}

export function ConfidenceDistribution({ data }: ConfidenceDistributionProps) {
  return (
    <div className="p-3 space-y-2.5">
      {data.map((bucket) => (
        <div key={bucket.range} className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-[#EFF0D1]">
            <span>Range: {bucket.range}</span>
            <span className="font-mono text-[#77BA99]">{bucket.count} ({bucket.percentage}%)</span>
          </div>
          <div className="w-full bg-[#1d1e25] h-2 rounded-full overflow-hidden border border-[#3d3e4b]">
            <div
              className="bg-[#77BA99] h-full rounded-full transition-all duration-500"
              style={{ width: `${bucket.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
