import React from 'react'
import type { ConfidenceBucket } from '@/types/api'

export interface ConfidenceDistributionProps {
  data: ConfidenceBucket[]
}

export function ConfidenceDistribution({ data }: ConfidenceDistributionProps) {
  return (
    <div className="p-4 space-y-3">
      {data.map((bucket) => (
        <div key={bucket.range} className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Range: {bucket.range}</span>
            <span>{bucket.count} ({bucket.percentage}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${bucket.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
