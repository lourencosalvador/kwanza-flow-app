/**
 * Tipos da base de dados Supabase.
 * Numa configuração real, gerar com:
 *   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
 * Esta versão reflete o schema em supabase/migrations/0001_init.sql.
 */

type Timestamped = {
  id: string;
  user_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          base_currency: string;
          streak: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      accounts: {
        Row: Timestamped & {
          name: string;
          kind: string;
          balance: number;
          currency: string;
          icon: string;
          color: string;
          target_balance: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["accounts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["accounts"]["Row"]>;
      };
      transactions: {
        Row: Timestamped & {
          account_id: string;
          type: string;
          amount: number;
          category: string;
          description: string;
          date: string;
          to_account_id: string | null;
          recurring: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
      };
      salaries: {
        Row: Timestamped & {
          label: string;
          amount: number;
          frequency: string;
          pay_day: number;
          account_id: string;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["salaries"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["salaries"]["Row"]>;
      };
      debts: {
        Row: Timestamped & {
          creditor: string;
          total_amount: number;
          paid_amount: number;
          installments: number;
          paid_installments: number;
          due_date: string;
          priority: string;
          status: string;
        };
        Insert: Partial<Database["public"]["Tables"]["debts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["debts"]["Row"]>;
      };
      recurring_payments: {
        Row: Timestamped & {
          label: string;
          kind: string;
          category: string;
          amount: number;
          day_of_month: number;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["recurring_payments"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["recurring_payments"]["Row"]>;
      };
      goals: {
        Row: Timestamped & {
          title: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          status: string;
          monthly_contribution: number | null;
          color: string;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
      };
      missions: {
        Row: Timestamped & {
          title: string;
          kind: string;
          target_amount: number | null;
          deadline: string | null;
          status: string;
          is_primary: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["missions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["missions"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
