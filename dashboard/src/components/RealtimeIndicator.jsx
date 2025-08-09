import React from 'react'
import { Wifi, WifiOff, Activity } from 'lucide-react'
import { Badge } from './ui/badge'

export function RealtimeIndicator({ status, lastUpdated }) {
  if (status !== 'connected') return null

  return (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      {lastUpdated && (
        <span className="text-xs text-gray-500">
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}