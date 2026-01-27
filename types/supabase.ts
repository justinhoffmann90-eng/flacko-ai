export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          x_handle: string
          discord_user_id: string | null
          discord_username: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          x_handle: string
          discord_user_id?: string | null
          discord_username?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          x_handle?: string
          discord_user_id?: string | null
          discord_username?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: string
          price_tier: number
          locked_price_cents: number
          current_period_start: string | null
          current_period_end: string | null
          trial_ends_at: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          price_tier: number
          locked_price_cents: number
          current_period_start?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          price_tier?: number
          locked_price_cents?: number
          current_period_start?: string | null
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          portfolio_size: string | null
          portfolio_size_exact: number | null
          daily_cap_pct: number | null
          per_trade_limit_pct: number | null
          risk_tolerance: string | null
          options_cap_pct: number | null
          preferred_vehicles: string[]
          current_tsla_position: number
          alerts_enabled: boolean
          email_new_reports: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_size?: string | null
          portfolio_size_exact?: number | null
          daily_cap_pct?: number | null
          per_trade_limit_pct?: number | null
          risk_tolerance?: string | null
          options_cap_pct?: number | null
          preferred_vehicles?: string[]
          current_tsla_position?: number
          alerts_enabled?: boolean
          email_new_reports?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_size?: string | null
          portfolio_size_exact?: number | null
          daily_cap_pct?: number | null
          per_trade_limit_pct?: number | null
          risk_tolerance?: string | null
          options_cap_pct?: number | null
          preferred_vehicles?: string[]
          current_tsla_position?: number
          alerts_enabled?: boolean
          email_new_reports?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          report_date: string
          raw_markdown: string
          parsed_data: Json
          extracted_data: Json
          parser_version: string
          parser_warnings: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_date: string
          raw_markdown: string
          parsed_data: Json
          extracted_data: Json
          parser_version: string
          parser_warnings?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_date?: string
          raw_markdown?: string
          parsed_data?: Json
          extracted_data?: Json
          parser_version?: string
          parser_warnings?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      report_alerts: {
        Row: {
          id: string
          report_id: string
          user_id: string
          price: number
          type: string
          level_name: string
          action: string
          reason: string | null
          triggered_at: string | null
          email_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          price: number
          type: string
          level_name: string
          action: string
          reason?: string | null
          triggered_at?: string | null
          email_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          price?: number
          type?: string
          level_name?: string
          action?: string
          reason?: string | null
          triggered_at?: string | null
          email_sent_at?: string | null
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          report_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string | null
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          created_at?: string
        }
      }
      chat_usage: {
        Row: {
          id: string
          user_id: string
          usage_date: string
          message_count: number
        }
        Insert: {
          id?: string
          user_id: string
          usage_date?: string
          message_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          usage_date?: string
          message_count?: number
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          metadata: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          metadata?: Json
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          metadata?: Json
          read?: boolean
          created_at?: string
        }
      }
      system_config: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
      }
      catalysts: {
        Row: {
          id: string
          event_date: string
          name: string
          status: string
          notes: string | null
          valuation_impact: string | null
          source_url: string | null
          notion_page_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_date: string
          name: string
          status?: string
          notes?: string | null
          valuation_impact?: string | null
          source_url?: string | null
          notion_page_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_date?: string
          name?: string
          status?: string
          notes?: string | null
          valuation_impact?: string | null
          source_url?: string | null
          notion_page_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
