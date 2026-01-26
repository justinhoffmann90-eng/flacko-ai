'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface ApiError {
  id: string
  endpoint: string
  method: string
  status_code: number | null
  error_message: string
  created_at: string
}

export function ApiErrorLog() {
  const [errors, setErrors] = useState<ApiError[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total24h: 0, uniqueEndpoints: 0 })

  const fetchErrors = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Get recent errors
    const { data } = await supabase
      .from('api_error_log')
      .select('id, endpoint, method, status_code, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get 24h stats
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('api_error_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)

    const uniqueEndpoints = new Set(data?.map(e => e.endpoint) || []).size

    setErrors(data || [])
    setStats({ total24h: count || 0, uniqueEndpoints })
    setLoading(false)
  }

  useEffect(() => {
    fetchErrors()
  }, [])

  const getStatusBadge = (code: number | null) => {
    if (!code) return <Badge variant="outline">Unknown</Badge>
    if (code >= 500) return <Badge variant="destructive">{code}</Badge>
    if (code >= 400) return <Badge variant="secondary">{code}</Badge>
    return <Badge>{code}</Badge>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            API Errors
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Failed API requests (500s, timeouts, exceptions)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.total24h}</div>
            <div className="text-xs text-muted-foreground">last 24h</div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchErrors} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
            No errors recorded
          </div>
        ) : (
          <div className="space-y-3">
            {errors.map((error) => (
              <div key={error.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(error.status_code)}
                    <code className="text-sm font-mono">{error.method}</code>
                    <code className="text-sm font-mono truncate">{error.endpoint}</code>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{error.error_message}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
