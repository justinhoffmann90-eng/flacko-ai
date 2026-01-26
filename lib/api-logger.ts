import { createClient } from '@/lib/supabase/server'

export async function logApiError({
  endpoint,
  method,
  statusCode,
  errorMessage,
  errorStack,
  userId,
  requestBody,
}: {
  endpoint: string
  method: string
  statusCode?: number
  errorMessage: string
  errorStack?: string
  userId?: string
  requestBody?: unknown
}) {
  try {
    const supabase = await createClient()
    await supabase.from('api_error_log').insert({
      endpoint,
      method,
      status_code: statusCode,
      error_message: errorMessage,
      error_stack: errorStack,
      user_id: userId,
      request_body: requestBody,
    })
  } catch (e) {
    // Don't let logging failures break the app
    console.error('Failed to log API error:', e)
  }
}

export async function logReportGeneration({
  reportDate,
  status,
  source,
  errorMessage,
  parseWarnings,
  fieldsParsed,
}: {
  reportDate: string
  status: 'success' | 'failed' | 'partial'
  source: 'manual' | 'parse' | 'api'
  errorMessage?: string
  parseWarnings?: string[]
  fieldsParsed?: number
}) {
  try {
    const supabase = await createClient()
    await supabase.from('report_generation_log').insert({
      report_date: reportDate,
      status,
      source,
      error_message: errorMessage,
      parse_warnings: parseWarnings,
      fields_parsed: fieldsParsed,
    })
  } catch (e) {
    console.error('Failed to log report generation:', e)
  }
}
