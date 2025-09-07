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
      profiles: {
        Row: {
          id: string
          role: 'reader' | 'writer'
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          verified_pro: boolean
          company: string | null
          country: string | null
          first_name: string | null
          last_name: string | null
          website: string | null
          twitter_handle: string | null
          email_notifications: boolean
          marketing_emails: boolean
          project_updates: boolean
          collaboration_invites: boolean
          profile_visibility: 'public' | 'members' | 'private'
          discoverable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'reader' | 'writer'
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          verified_pro?: boolean
          company?: string | null
          country?: string | null
          first_name?: string | null
          last_name?: string | null
          website?: string | null
          twitter_handle?: string | null
          email_notifications?: boolean
          marketing_emails?: boolean
          project_updates?: boolean
          collaboration_invites?: boolean
          profile_visibility?: 'public' | 'members' | 'private'
          discoverable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'reader' | 'writer'
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          verified_pro?: boolean
          company?: string | null
          country?: string | null
          first_name?: string | null
          last_name?: string | null
          website?: string | null
          twitter_handle?: string | null
          email_notifications?: boolean
          marketing_emails?: boolean
          project_updates?: boolean
          collaboration_invites?: boolean
          profile_visibility?: 'public' | 'members' | 'private'
          discoverable?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          title: string
          logline: string
          synopsis: string | null
          format: 'screenplay' | 'short_story' | 'novel' | 'treatment' | 'pilot'
          genre: string | null
          subgenre: string | null
          est_budget_range: string | null
          word_count: number | null
          cast_size: number | null
          language: string
          visibility: 'private' | 'preview' | 'public'
          buzz_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          logline: string
          synopsis?: string | null
          format: 'screenplay' | 'short_story' | 'novel' | 'treatment' | 'pilot'
          genre?: string | null
          subgenre?: string | null
          est_budget_range?: string | null
          word_count?: number | null
          cast_size?: number | null
          language?: string
          visibility?: 'private' | 'preview' | 'public'
          buzz_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          logline?: string
          synopsis?: string | null
          format?: 'screenplay' | 'short_story' | 'novel' | 'treatment' | 'pilot'
          genre?: string | null
          subgenre?: string | null
          est_budget_range?: string | null
          word_count?: number | null
          cast_size?: number | null
          language?: string
          visibility?: 'private' | 'preview' | 'public'
          buzz_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      project_assets: {
        Row: {
          id: string
          project_id: string
          kind: 'cover' | 'sample_pdf' | 'full_pdf' | 'supporting'
          storage_path: string
          original_filename: string | null
          bytes: number | null
          checksum: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          kind: 'cover' | 'sample_pdf' | 'full_pdf' | 'supporting'
          storage_path: string
          original_filename?: string | null
          bytes?: number | null
          checksum?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          kind?: 'cover' | 'sample_pdf' | 'full_pdf' | 'supporting'
          storage_path?: string
          original_filename?: string | null
          bytes?: number | null
          checksum?: string | null
          created_at?: string
        }
      }
      access_requests: {
        Row: {
          id: string
          project_id: string
          pro_id: string
          status: 'pending' | 'approved' | 'denied'
          nda_required: boolean
          message: string | null
          created_at: string
          decided_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          pro_id: string
          status?: 'pending' | 'approved' | 'denied'
          nda_required?: boolean
          message?: string | null
          created_at?: string
          decided_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          pro_id?: string
          status?: 'pending' | 'approved' | 'denied'
          nda_required?: boolean
          message?: string | null
          created_at?: string
          decided_at?: string | null
        }
      }
      access_grants: {
        Row: {
          id: string
          project_id: string
          viewer_id: string
          scope: 'preview' | 'full'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          viewer_id: string
          scope?: 'preview' | 'full'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          viewer_id?: string
          scope?: 'preview' | 'full'
          created_at?: string
        }
      }
      ip_timestamps: {
        Row: {
          id: string
          project_id: string
          content_hash: string
          provider: string
          provider_ref: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          content_hash: string
          provider?: string
          provider_ref?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          content_hash?: string
          provider?: string
          provider_ref?: string | null
          created_at?: string
        }
      }
      collaborations: {
        Row: {
          id: string
          project_id: string
          member_id: string
          role: 'coauthor' | 'editor' | 'translator' | 'producer'
          royalty_split: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          member_id: string
          role: 'coauthor' | 'editor' | 'translator' | 'producer'
          royalty_split?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          member_id?: string
          role?: 'coauthor' | 'editor' | 'translator' | 'producer'
          royalty_split?: number | null
          created_at?: string
        }
      }
      collaboration_invitations: {
        Row: {
          id: string
          project_id: string
          inviter_id: string
          invitee_id: string
          role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          royalty_split: number | null
          message: string | null
          status: 'pending' | 'accepted' | 'declined' | 'cancelled'
          expires_at: string | null
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          inviter_id: string
          invitee_id: string
          role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          royalty_split?: number | null
          message?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled'
          expires_at?: string | null
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          inviter_id?: string
          invitee_id?: string
          role?: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          royalty_split?: number | null
          message?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled'
          expires_at?: string | null
          created_at?: string
          responded_at?: string | null
        }
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          royalty_split: number | null
          permissions: Json
          status: 'active' | 'inactive' | 'removed'
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          royalty_split?: number | null
          permissions?: Json
          status?: 'active' | 'inactive' | 'removed'
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          royalty_split?: number | null
          permissions?: Json
          status?: 'active' | 'inactive' | 'removed'
          joined_at?: string
          updated_at?: string
        }
      }
      collaboration_messages: {
        Row: {
          id: string
          project_id: string
          sender_id: string
          content: string
          message_type: 'general' | 'announcement' | 'feedback' | 'question'
          parent_id: string | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          sender_id: string
          content: string
          message_type?: 'general' | 'announcement' | 'feedback' | 'question'
          parent_id?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          sender_id?: string
          content?: string
          message_type?: 'general' | 'announcement' | 'feedback' | 'question'
          parent_id?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_activity: {
        Row: {
          id: string
          project_id: string
          user_id: string
          activity_type: 'project_created' | 'project_updated' | 'collaborator_added' | 'collaborator_removed' | 'chapter_created' | 'chapter_updated' | 'chapter_deleted' | 'comment_added' | 'message_sent' | 'file_uploaded' | 'permission_changed'
          description: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          activity_type: 'project_created' | 'project_updated' | 'collaborator_added' | 'collaborator_removed' | 'chapter_created' | 'chapter_updated' | 'chapter_deleted' | 'comment_added' | 'message_sent' | 'file_uploaded' | 'permission_changed'
          description: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          activity_type?: 'project_created' | 'project_updated' | 'collaborator_added' | 'collaborator_removed' | 'chapter_created' | 'chapter_updated' | 'chapter_deleted' | 'comment_added' | 'message_sent' | 'file_uploaded' | 'permission_changed'
          description?: string
          metadata?: Json
          created_at?: string
        }
      }
      collaboration_requests: {
        Row: {
          id: string
          project_id: string
          requester_id: string
          desired_role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          message: string | null
          portfolio_links: string[] | null
          status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          requester_id: string
          desired_role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          message?: string | null
          portfolio_links?: string[] | null
          status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          requester_id?: string
          desired_role?: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
          message?: string | null
          portfolio_links?: string[] | null
          status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
          created_at?: string
          responded_at?: string | null
        }
      }
      pitch_rooms: {
        Row: {
          id: string
          host_id: string
          title: string
          theme: string | null
          starts_at: string
          duration_minutes: number
          is_pro_only: boolean
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          theme?: string | null
          starts_at: string
          duration_minutes?: number
          is_pro_only?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          theme?: string | null
          starts_at?: string
          duration_minutes?: number
          is_pro_only?: boolean
          created_at?: string
        }
      }
      pitch_submissions: {
        Row: {
          id: string
          room_id: string
          project_id: string
          submitter_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'waitlist'
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          project_id: string
          submitter_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'waitlist'
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          project_id?: string
          submitter_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'waitlist'
          created_at?: string
        }
      }
      engagement_events: {
        Row: {
          id: number
          project_id: string
          actor_id: string
          kind: 'view' | 'like' | 'save' | 'comment'
          weight: number
          created_at: string
        }
        Insert: {
          id?: number
          project_id: string
          actor_id: string
          kind: 'view' | 'like' | 'save' | 'comment'
          weight?: number
          created_at?: string
        }
        Update: {
          id?: number
          project_id?: string
          actor_id?: string
          kind?: 'view' | 'like' | 'save' | 'comment'
          weight?: number
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'writer_plus' | 'pro_plus'
          stripe_customer_id: string | null
          stripe_sub_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: 'free' | 'writer_plus' | 'pro_plus'
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'free' | 'writer_plus' | 'pro_plus'
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
