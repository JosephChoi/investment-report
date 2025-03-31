export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string
          contract_date: string | null
          created_at: string
          id: string
          portfolio_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          contract_date?: string | null
          created_at?: string
          id?: string
          portfolio_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          contract_date?: string | null
          created_at?: string
          id?: string
          portfolio_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_portfolio_type_id_fkey"
            columns: ["portfolio_type_id"]
            isOneToOne: false
            referencedRelation: "portfolio_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_attachments: {
        Row: {
          announcement_id: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_attachments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          importance_level: number
          target_portfolios: string[] | null
          target_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          importance_level?: number
          target_portfolios?: string[] | null
          target_type?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          importance_level?: number
          target_portfolios?: string[] | null
          target_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      auth_debug_logs: {
        Row: {
          description: string | null
          id: number
          message: string | null
          timestamp: string | null
          user_info: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          message?: string | null
          timestamp?: string | null
          user_info?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          message?: string | null
          timestamp?: string | null
          user_info?: string | null
        }
        Relationships: []
      }
      balance_records: {
        Row: {
          account_id: string
          balance: number
          created_at: string
          id: string
          record_date: string
          updated_at: string
          year_month: string | null
        }
        Insert: {
          account_id: string
          balance: number
          created_at?: string
          id?: string
          record_date: string
          updated_at?: string
          year_month?: string | null
        }
        Update: {
          account_id?: string
          balance?: number
          created_at?: string
          id?: string
          record_date?: string
          updated_at?: string
          year_month?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_records_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_attachments: {
        Row: {
          consultation_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          consultation_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          consultation_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_attachments_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          consultation_date: string
          content: string
          created_at: string | null
          id: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consultation_date: string
          content: string
          created_at?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consultation_date?: string
          content?: string
          created_at?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_comments: {
        Row: {
          comment_date: string
          content: string
          created_at: string
          id: string
          updated_at: string
          year_month: string | null
        }
        Insert: {
          comment_date: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          year_month?: string | null
        }
        Update: {
          comment_date?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          year_month?: string | null
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          year_month: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          year_month: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          year_month?: string
        }
        Relationships: []
      }
      overdue_payment_notices: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      overdue_payments: {
        Row: {
          account_name: string | null
          account_number: string | null
          advisory_fee_total: number | null
          batch_id: string
          contact_number: string | null
          contract_date: string | null
          created_at: string | null
          id: string
          manager: string | null
          mp_name: string | null
          overdue_status: string | null
          paid_amount: number | null
          previous_day_balance: number | null
          unpaid_amount: number | null
          updated_at: string | null
          withdrawal_account: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          advisory_fee_total?: number | null
          batch_id: string
          contact_number?: string | null
          contract_date?: string | null
          created_at?: string | null
          id?: string
          manager?: string | null
          mp_name?: string | null
          overdue_status?: string | null
          paid_amount?: number | null
          previous_day_balance?: number | null
          unpaid_amount?: number | null
          updated_at?: string | null
          withdrawal_account?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          advisory_fee_total?: number | null
          batch_id?: string
          contact_number?: string | null
          contract_date?: string | null
          created_at?: string | null
          id?: string
          manager?: string | null
          mp_name?: string | null
          overdue_status?: string | null
          paid_amount?: number | null
          previous_day_balance?: number | null
          unpaid_amount?: number | null
          updated_at?: string | null
          withdrawal_account?: string | null
        }
        Relationships: []
      }
      portfolio_reports: {
        Row: {
          created_at: string
          id: string
          portfolio_type: string
          portfolio_type_id: string | null
          report_date: string
          report_url: string
          updated_at: string
          year_month: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_type: string
          portfolio_type_id?: string | null
          report_date: string
          report_url: string
          updated_at?: string
          year_month?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_type?: string
          portfolio_type_id?: string | null
          report_date?: string
          report_url?: string
          updated_at?: string
          year_month?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_reports_portfolio_type_id_fkey"
            columns: ["portfolio_type_id"]
            isOneToOne: false
            referencedRelation: "portfolio_types"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          risk_level: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          risk_level?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          risk_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rebalancing_histories: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          portfolio_type_id: string
          rebalancing_date: string
          reference_url: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          portfolio_type_id: string
          rebalancing_date: string
          reference_url?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          portfolio_type_id?: string
          rebalancing_date?: string
          reference_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rebalancing_histories_portfolio_type_id_fkey"
            columns: ["portfolio_type_id"]
            isOneToOne: false
            referencedRelation: "portfolio_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          created_at: string
          customer_number: string | null
          email: string
          id: string
          name: string
          old_id: string | null
          personal_id: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_number?: string | null
          email: string
          id?: string
          name: string
          old_id?: string | null
          personal_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_number?: string | null
          email?: string
          id?: string
          name?: string
          old_id?: string | null
          personal_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_role: {
        Args: {
          admin_email: string
        }
        Returns: string
      }
      create_consultation_without_fk_check: {
        Args: {
          p_user_id: string
          p_title: string
          p_content: string
          p_consultation_date: string
          p_created_at: string
        }
        Returns: Json
      }
      get_table_columns: {
        Args: {
          table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      log_auth_debug: {
        Args: {
          message: string
        }
        Returns: undefined
      }
      log_auth_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          role_name: string
          is_admin: boolean
          user_id: string
          claims: Json
        }[]
      }
      update_auth_user_id: {
        Args: {
          old_id: string
          new_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
