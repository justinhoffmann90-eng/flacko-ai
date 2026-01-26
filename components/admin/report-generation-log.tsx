'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'

interface ReportLog {
  id: string
  report_date: string
  status: 'success' | 'failed' | 'partial'
  source: string
  error_message: string | null
  parse_warnings: string[] | null
  fields_parsed: number | null
  created_at: string
}

export function ReportGenerationLog() {
  const [logs, setLogs] = useState<ReportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ success: 0, failed: 0, partial: 0 })

  const fetchLogs = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Get recent logs
    const { data } = await supabase
      .from('report_generation_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate stats from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: statsData } = await supabase
      .from('report_generation_log')
      .select('status')
      .gte('created_at', sevenDaysAgo)

    const counts = { success: 0, failed: 0, partial: 0 }
    statsData?.forEach(r => {
      if (r.status in counts) counts[r.status as keyof typeof counts]++
    })

    setLogs(data || [])
    setStats(counts)
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Success</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Partial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Generation
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Daily report creation history and parse results
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-sm">
            <span className="text-green-500">{stats.success} ✓</span>
            <span className="text-yellow-500">{stats.partial} ⚠</span>
            <span className="text-red-500">{stats.failed} ✗</span>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No report generation logs yet
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-medium">
                      {format(new Date(log.report_date), 'MMM d, yyyy')}
                    </span>
                    {getStatusBadge(log.status)}
                    <Badge variant="outline" className="text-xs">{log.source}</Badge>
                  </div>
                  {log.error_message && (
                    <p className="text-sm text-red-400 truncate">{log.error_message}</p>
                  )}
                  {log.parse_warnings && log.parse_warnings.length > 0 && (
                    <p className="text-sm text-yellow-400 truncate">
                      {log.parse_warnings.length} warning(s): {log.parse_warnings[0]}
                    </p>
                  )}
                  {log.fields_parsed && (
                    <p className="text-xs text-muted-foreground">{log.fields_parsed} fields parsed</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
