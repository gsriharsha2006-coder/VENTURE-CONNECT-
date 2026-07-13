export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Nullable<T> = T | null;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: Nullable<string>;
          role: string;
          full_name: Nullable<string>;
          company_name: Nullable<string>;
          email: Nullable<string>;
          phone: Nullable<string>;
          plan: string;
          trust_score: number;
          verification_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: Nullable<string>;
          role?: string;
          full_name?: Nullable<string>;
          company_name?: Nullable<string>;
          email?: Nullable<string>;
          phone?: Nullable<string>;
          plan?: string;
          trust_score?: number;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      idea_workspaces: {
        Row: {
          id: string;
          founder_id: Nullable<string>;
          template_type: string;
          title: string;
          sections_json: Json;
          video_link: Nullable<string>;
          stage: string;
          visibility: string;
          tags: string[];
          completion_percentage: number;
          status: string;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          founder_id?: Nullable<string>;
          template_type?: string;
          title: string;
          sections_json?: Json;
          video_link?: Nullable<string>;
          stage?: string;
          visibility?: string;
          tags?: string[];
          completion_percentage?: number;
          status?: string;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["idea_workspaces"]["Insert"]>;
      };
      opportunities: {
        Row: {
          id: string;
          created_by: Nullable<string>;
          creator_role: Nullable<string>;
          title: string;
          organizer_name: Nullable<string>;
          opportunity_type: Nullable<string>;
          category: Nullable<string>;
          prize_or_funding: Nullable<string>;
          deadline: Nullable<string>;
          eligibility: Nullable<string>;
          guidelines: Nullable<string>;
          tags: Nullable<string[]>;
          location: Nullable<string>;
          mode: Nullable<string>;
          verified: boolean;
          trending: boolean;
          external_link: Nullable<string>;
          contact_email: Nullable<string>;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by?: Nullable<string>;
          creator_role?: Nullable<string>;
          title: string;
          organizer_name?: Nullable<string>;
          opportunity_type?: Nullable<string>;
          category?: Nullable<string>;
          prize_or_funding?: Nullable<string>;
          deadline?: Nullable<string>;
          eligibility?: Nullable<string>;
          guidelines?: Nullable<string>;
          tags?: Nullable<string[]>;
          location?: Nullable<string>;
          mode?: Nullable<string>;
          verified?: boolean;
          trending?: boolean;
          external_link?: Nullable<string>;
          contact_email?: Nullable<string>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Insert"]>;
      };
      applications: {
        Row: {
          id: string;
          founder_id: Nullable<string>;
          opportunity_id: Nullable<string>;
          idea_workspace_id: Nullable<string>;
          status: string;
          submitted_at: string;
          reviewed_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          founder_id?: Nullable<string>;
          opportunity_id?: Nullable<string>;
          idea_workspace_id?: Nullable<string>;
          status?: string;
          submitted_at?: string;
          reviewed_at?: Nullable<string>;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
      };
      vc_reports: {
        Row: {
          id: string;
          founder_id: Nullable<string>;
          idea_workspace_id: Nullable<string>;
          report_type: Nullable<string>;
          plan_required: Nullable<string>;
          report_content: Json;
          score: Nullable<number>;
          created_at: string;
        };
        Insert: {
          id?: string;
          founder_id?: Nullable<string>;
          idea_workspace_id?: Nullable<string>;
          report_type?: Nullable<string>;
          plan_required?: Nullable<string>;
          report_content?: Json;
          score?: Nullable<number>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vc_reports"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          application_id: Nullable<string>;
          sender_id: Nullable<string>;
          receiver_id: Nullable<string>;
          body: Nullable<string>;
          meeting_link: Nullable<string>;
          meeting_time: Nullable<string>;
          is_locked_for_free_user: boolean;
          created_at: string;
          read_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          application_id?: Nullable<string>;
          sender_id?: Nullable<string>;
          receiver_id?: Nullable<string>;
          body?: Nullable<string>;
          meeting_link?: Nullable<string>;
          meeting_time?: Nullable<string>;
          is_locked_for_free_user?: boolean;
          created_at?: string;
          read_at?: Nullable<string>;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      service_providers: {
        Row: {
          id: string;
          user_id: Nullable<string>;
          name: Nullable<string>;
          firm_name: Nullable<string>;
          email: Nullable<string>;
          phone: Nullable<string>;
          service_category: Nullable<string>;
          pan_or_gst: Nullable<string>;
          website_or_linkedin: Nullable<string>;
          experience_details: Nullable<string>;
          certificate_url: Nullable<string>;
          cgpdtm_registration_number: Nullable<string>;
          verification_status: string;
          venture_connect_verified: boolean;
          cgpdtm_checked: boolean;
          verification_date: Nullable<string>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: Nullable<string>;
          name?: Nullable<string>;
          firm_name?: Nullable<string>;
          email?: Nullable<string>;
          phone?: Nullable<string>;
          service_category?: Nullable<string>;
          pan_or_gst?: Nullable<string>;
          website_or_linkedin?: Nullable<string>;
          experience_details?: Nullable<string>;
          certificate_url?: Nullable<string>;
          cgpdtm_registration_number?: Nullable<string>;
          verification_status?: string;
          venture_connect_verified?: boolean;
          cgpdtm_checked?: boolean;
          verification_date?: Nullable<string>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_providers"]["Insert"]>;
      };
      service_posts: {
        Row: {
          id: string;
          provider_id: Nullable<string>;
          title: string;
          category: Nullable<string>;
          description: Nullable<string>;
          guide_info: Nullable<string>;
          original_price: Nullable<number>;
          listed_price: Nullable<number>;
          contact_info: Nullable<string>;
          external_link: Nullable<string>;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id?: Nullable<string>;
          title: string;
          category?: Nullable<string>;
          description?: Nullable<string>;
          guide_info?: Nullable<string>;
          original_price?: Nullable<number>;
          listed_price?: Nullable<number>;
          contact_info?: Nullable<string>;
          external_link?: Nullable<string>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_posts"]["Insert"]>;
      };
      service_requests: {
        Row: {
          id: string;
          founder_id: Nullable<string>;
          provider_id: Nullable<string>;
          service_post_id: Nullable<string>;
          status: string;
          quotation: Nullable<string>;
          created_at: string;
        };
        Insert: {
          id?: string;
          founder_id?: Nullable<string>;
          provider_id?: Nullable<string>;
          service_post_id?: Nullable<string>;
          status?: string;
          quotation?: Nullable<string>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_requests"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: Nullable<string>;
          type: Nullable<string>;
          title: Nullable<string>;
          message: Nullable<string>;
          link: Nullable<string>;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: Nullable<string>;
          type?: Nullable<string>;
          title?: Nullable<string>;
          message?: Nullable<string>;
          link?: Nullable<string>;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: Nullable<string>;
          plan: string;
          status: string;
          started_at: string;
          expires_at: Nullable<string>;
          report_count_used: number;
          opportunity_submissions_used: number;
          free_swot_used: boolean;
        };
        Insert: {
          id?: string;
          user_id?: Nullable<string>;
          plan?: string;
          status?: string;
          started_at?: string;
          expires_at?: Nullable<string>;
          report_count_used?: number;
          opportunity_submissions_used?: number;
          free_swot_used?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { uid?: string };
        Returns: boolean;
      };
      current_profile_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
