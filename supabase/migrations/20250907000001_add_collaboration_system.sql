-- Collaboration System Enhancement Migration
-- This migration adds comprehensive collaboration features including invitations, messaging, and enhanced permissions

-- COLLABORATION INVITATIONS
-- Handles inviting users to collaborate on projects
CREATE TABLE IF NOT EXISTS public.collaboration_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('coauthor','editor','translator','producer','reviewer')) NOT NULL,
  royalty_split NUMERIC CHECK (royalty_split >= 0 AND royalty_split <= 100),
  message TEXT,
  status TEXT CHECK (status IN ('pending','accepted','declined','cancelled')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(project_id, invitee_id)
);

-- PROJECT COLLABORATORS
-- Enhanced version of collaborations table with better permissions and status tracking
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('coauthor','editor','translator','producer','reviewer')) NOT NULL,
  royalty_split NUMERIC CHECK (royalty_split >= 0 AND royalty_split <= 100),
  permissions JSONB DEFAULT '{"read": true, "write": false, "comment": true, "invite": false}',
  status TEXT CHECK (status IN ('active','inactive','removed')) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- COLLABORATION MESSAGES
-- Communication between project collaborators
CREATE TABLE IF NOT EXISTS public.collaboration_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('general','announcement','feedback','question')) DEFAULT 'general',
  parent_id UUID REFERENCES public.collaboration_messages(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT ACTIVITY LOG
-- Track all activities in collaborative projects
CREATE TABLE IF NOT EXISTS public.project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT CHECK (activity_type IN (
    'project_created','project_updated','collaborator_added','collaborator_removed',
    'chapter_created','chapter_updated','chapter_deleted','comment_added',
    'message_sent','file_uploaded','permission_changed'
  )) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLLABORATION REQUESTS
-- Public requests to join projects
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  desired_role TEXT CHECK (desired_role IN ('coauthor','editor','translator','producer','reviewer')) NOT NULL,
  message TEXT,
  portfolio_links TEXT[],
  status TEXT CHECK (status IN ('pending','approved','rejected','withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(project_id, requester_id)
);

-- Add notification types for collaboration
DO $$
BEGIN
  -- Check if notifications table exists and has type column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Add new notification types for collaboration
    ALTER TABLE public.notifications 
    DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_type_check CHECK (
      type IN (
        'profile_access_request', 'profile_access_granted', 'profile_access_denied', 
        'follow', 'project_comment', 'collaboration_invite', 'collaboration_accepted',
        'collaboration_declined', 'collaboration_request', 'project_activity',
        'message_received', 'role_changed', 'project_shared'
      )
    );
  END IF;
END $$;

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_project_id ON public.collaboration_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_invitee_id ON public.collaboration_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_status ON public.collaboration_invitations(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_expires_at ON public.collaboration_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON public.project_collaborators(status);

CREATE INDEX IF NOT EXISTS idx_collaboration_messages_project_id ON public.collaboration_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_messages_sender_id ON public.collaboration_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_messages_created_at ON public.collaboration_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaboration_messages_parent_id ON public.collaboration_messages(parent_id);

CREATE INDEX IF NOT EXISTS idx_project_activity_project_id ON public.project_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_user_id ON public.project_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_created_at ON public.project_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_activity_type ON public.project_activity(activity_type);

CREATE INDEX IF NOT EXISTS idx_collaboration_requests_project_id ON public.collaboration_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_requester_id ON public.collaboration_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_status ON public.collaboration_requests(status);

-- TRIGGERS for updated_at timestamps
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_collaborators') THEN
    DROP TRIGGER IF EXISTS project_collaborators_updated_at ON public.project_collaborators;
    CREATE TRIGGER project_collaborators_updated_at
      BEFORE UPDATE ON public.project_collaborators
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_messages') THEN
    DROP TRIGGER IF EXISTS collaboration_messages_updated_at ON public.collaboration_messages;
    CREATE TRIGGER collaboration_messages_updated_at
      BEFORE UPDATE ON public.collaboration_messages
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- RLS POLICIES

-- Collaboration Invitations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_invitations') THEN
    ALTER TABLE public.collaboration_invitations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view invitations sent to them or by them" ON public.collaboration_invitations;
    CREATE POLICY "Users can view invitations sent to them or by them" ON public.collaboration_invitations
      FOR SELECT USING (
        auth.uid() = invitee_id OR 
        auth.uid() = inviter_id OR
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = collaboration_invitations.project_id 
          AND p.owner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Project owners can create invitations" ON public.collaboration_invitations;
    CREATE POLICY "Project owners can create invitations" ON public.collaboration_invitations
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = collaboration_invitations.project_id 
          AND p.owner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Invitees can update their invitation status" ON public.collaboration_invitations;
    CREATE POLICY "Invitees can update their invitation status" ON public.collaboration_invitations
      FOR UPDATE USING (
        auth.uid() = invitee_id AND 
        status = 'pending'
      );
  END IF;
END $$;

-- Project Collaborators
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_collaborators') THEN
    ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Collaborators can view project collaborators" ON public.project_collaborators;
    CREATE POLICY "Collaborators can view project collaborators" ON public.project_collaborators
      FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = project_collaborators.project_id 
          AND p.owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM project_collaborators pc2
          WHERE pc2.project_id = project_collaborators.project_id 
          AND pc2.user_id = auth.uid() 
          AND pc2.status = 'active'
        )
      );

    DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;
    CREATE POLICY "Project owners can manage collaborators" ON public.project_collaborators
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = project_collaborators.project_id 
          AND p.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Collaboration Messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_messages') THEN
    ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Project collaborators can view messages" ON public.collaboration_messages;
    CREATE POLICY "Project collaborators can view messages" ON public.collaboration_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = collaboration_messages.project_id 
          AND (
            p.owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_collaborators pc
              WHERE pc.project_id = p.id 
              AND pc.user_id = auth.uid() 
              AND pc.status = 'active'
            )
          )
        )
      );

    DROP POLICY IF EXISTS "Project collaborators can send messages" ON public.collaboration_messages;
    CREATE POLICY "Project collaborators can send messages" ON public.collaboration_messages
      FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = collaboration_messages.project_id 
          AND (
            p.owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_collaborators pc
              WHERE pc.project_id = p.id 
              AND pc.user_id = auth.uid() 
              AND pc.status = 'active'
            )
          )
        )
      );
  END IF;
END $$;

-- Project Activity
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_activity') THEN
    ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Project collaborators can view activity" ON public.project_activity;
    CREATE POLICY "Project collaborators can view activity" ON public.project_activity
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = project_activity.project_id 
          AND (
            p.owner_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM project_collaborators pc
              WHERE pc.project_id = p.id 
              AND pc.user_id = auth.uid() 
              AND pc.status = 'active'
            )
          )
        )
      );

    DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON public.project_activity;
    CREATE POLICY "Authenticated users can create activity logs" ON public.project_activity
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Collaboration Requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_requests') THEN
    ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own requests and project owners can view all requests" ON public.collaboration_requests;
    CREATE POLICY "Users can view their own requests and project owners can view all requests" ON public.collaboration_requests
      FOR SELECT USING (
        auth.uid() = requester_id OR
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = collaboration_requests.project_id 
          AND p.owner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Authenticated users can create collaboration requests" ON public.collaboration_requests;
    CREATE POLICY "Authenticated users can create collaboration requests" ON public.collaboration_requests
      FOR INSERT WITH CHECK (auth.uid() = requester_id);

    DROP POLICY IF EXISTS "Project owners can update collaboration requests" ON public.collaboration_requests;
    CREATE POLICY "Project owners can update collaboration requests" ON public.collaboration_requests
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = collaboration_requests.project_id 
          AND p.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Functions for collaboration workflows

-- Function to accept collaboration invitation
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO inv_record 
  FROM collaboration_invitations 
  WHERE id = invitation_id AND invitee_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  -- Update invitation status
  UPDATE collaboration_invitations 
  SET status = 'accepted', responded_at = NOW()
  WHERE id = invitation_id;
  
  -- Add collaborator to project
  INSERT INTO project_collaborators (project_id, user_id, role, royalty_split)
  VALUES (inv_record.project_id, inv_record.invitee_id, inv_record.role, inv_record.royalty_split)
  ON CONFLICT (project_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    royalty_split = EXCLUDED.royalty_split,
    status = 'active',
    updated_at = NOW();
  
  -- Log activity
  INSERT INTO project_activity (project_id, user_id, activity_type, description)
  VALUES (
    inv_record.project_id, 
    inv_record.invitee_id, 
    'collaborator_added',
    'Accepted collaboration invitation as ' || inv_record.role
  );
  
  -- Create notification for project owner
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT 
    p.owner_id,
    'collaboration_accepted',
    'Collaboration Accepted',
    prof.display_name || ' accepted your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', inv_record.invitee_id)
  FROM projects p, profiles prof
  WHERE p.id = inv_record.project_id AND prof.id = inv_record.invitee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline collaboration invitation
CREATE OR REPLACE FUNCTION decline_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO inv_record 
  FROM collaboration_invitations 
  WHERE id = invitation_id AND invitee_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  -- Update invitation status
  UPDATE collaboration_invitations 
  SET status = 'declined', responded_at = NOW()
  WHERE id = invitation_id;
  
  -- Create notification for project owner
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT 
    p.owner_id,
    'collaboration_declined',
    'Collaboration Declined',
    prof.display_name || ' declined your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', inv_record.invitee_id)
  FROM projects p, profiles prof
  WHERE p.id = inv_record.project_id AND prof.id = inv_record.invitee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove collaborator
CREATE OR REPLACE FUNCTION remove_project_collaborator(collab_project_id UUID, collab_user_id UUID)
RETURNS VOID AS $$
DECLARE
  project_owner_id UUID;
BEGIN
  -- Check if current user is project owner
  SELECT owner_id INTO project_owner_id 
  FROM projects 
  WHERE id = collab_project_id;
  
  IF project_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only project owner can remove collaborators';
  END IF;
  
  -- Update collaborator status
  UPDATE project_collaborators 
  SET status = 'removed', updated_at = NOW()
  WHERE project_id = collab_project_id AND user_id = collab_user_id;
  
  -- Log activity
  INSERT INTO project_activity (project_id, user_id, activity_type, description)
  VALUES (
    collab_project_id, 
    auth.uid(), 
    'collaborator_removed',
    'Removed collaborator from project'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
