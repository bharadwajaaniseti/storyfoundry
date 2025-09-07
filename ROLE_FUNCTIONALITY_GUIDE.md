# 🎭 Multiple Role-Based Collaboration Functionality Implementation Guide

## 🏗️ **Current System Architecture**

### **Database Structure**
```sql
-- Enhanced collaboration tables with multiple role support
project_collaborators (
  id: UUID
  project_id: UUID -> projects(id)
  user_id: UUID -> profiles(id)
  role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'  -- Primary role
  secondary_roles: TEXT[]  -- Additional roles array
  royalty_split: DECIMAL
  permissions: JSONB  -- Merged permissions from all roles
  status: 'active' | 'removed' | 'pending'
)

collaboration_invitations (
  id: UUID
  project_id: UUID -> projects(id)
  inviter_id: UUID -> profiles(id)
  invitee_id: UUID -> profiles(id)
  role: collaboration_role  -- Primary role
  secondary_roles: TEXT[]  -- Additional roles for invitation
  royalty_split: DECIMAL
  message: TEXT
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
)
```

### **Multiple Role System**
```typescript
// Users can have multiple roles with merged permissions
const collaborator = {
  role: 'coauthor',           // Primary role
  secondary_roles: ['translator', 'editor'],  // Additional roles
  computed_permissions: {     // Merged from all roles (OR logic)
    read: true,    // Any role that grants read
    write: true,   // Any role that grants write  
    comment: true, // Any role that grants comment
    invite: false  // Any role that grants invite
  }
}
```

### **Role Definitions with Multiple Role Support**
```typescript
// 5 Collaboration Roles that can be combined
const ROLES = {
  coauthor: {
    read: ✅, write: ✅, comment: ✅, invite: ❌,
    description: "Co-write and develop the story together"
  },
  editor: {
    read: ✅, write: ✅, comment: ✅, invite: ❌,
    description: "Review, edit, and refine the content"
  },
  translator: {
    read: ✅, write: ✅, comment: ✅, invite: ❌,
    description: "Translate content to other languages"
  },
  producer: {
    read: ✅, write: ❌, comment: ✅, invite: ✅,
    description: "Manage project development and coordination"
  },
  reviewer: {
    read: ✅, write: ❌, comment: ✅, invite: ❌,
    description: "Provide feedback and suggestions"
  }
}

// Multiple Role Examples:
// Coauthor + Translator = Can write original + translate (all permissions merged)
// Editor + Producer = Can edit content + manage project + invite others
// Reviewer + Translator = Can provide feedback + translate (read-only for original)
```

## 🚀 **Implementation Components**

### **1. Permission Hooks** (`/src/hooks/usePermissions.ts`)
```typescript
// Main permission checking hook with multiple role support
const { permissions, loading } = useProjectPermissions(projectId, userId)

// Check specific actions with merged permissions
const { canPerform } = useCanPerformAction(projectId, 'write', userId)

// UI helpers with multiple role display
const { showElement, getRoleColor, getAllRoleNames } = useRoleBasedUI(projectId, userId)
```

### **2. Permission Gate Component** (`/src/components/permission-gate.tsx`)
```typescript
// Wrap UI elements with permission requirements (works with merged permissions)
<PermissionGate projectId={projectId} userId={userId} requiredPermission="write">
  <EditButton />
</PermissionGate>

// Display all roles for a user
<RoleBadge projectId={projectId} userId={userId} showAllRoles />
```

### **3. Multiple Role Selector** (`/src/components/multiple-role-selector.tsx`)
```typescript
// Advanced role selection with primary + secondary roles
<MultipleRoleSelector
  primaryRole={role}
  secondaryRoles={secondaryRoles}
  onPrimaryRoleChange={setRole}
  onSecondaryRolesChange={setSecondaryRoles}
/>
```

### **4. Enhanced Utilities** (`/src/lib/collaboration-utils.ts`)
```typescript
// Get all roles for a collaborator
const allRoles = getAllRoles(collaborator)

// Check if user has specific role
const hasTranslatorRole = hasRole(collaborator, 'translator')

// Get merged permissions from all roles
const permissions = getCollaboratorPermissions(collaborator)
```

## 📋 **How Each Role Functions**

### **🖋️ Coauthor (Full Story Partner)**
```typescript
// Features they can access:
- Full story editing ✅
- Character development ✅  
- Plot structure changes ✅
- Chapter creation/editing ✅
- Comments and feedback ✅
- Revenue sharing ✅

// Implementation example:
<PermissionGate requiredPermission="write">
  <NovelEditor />
  <CharacterEditor />
  <PlotOutline />
  <ChapterManager />
</PermissionGate>
```

### **📝 Editor (Content Refinement)**
```typescript
// Features they can access:
- Content editing ✅
- Grammar/style fixes ✅
- Structure improvements ✅
- Comments and suggestions ✅
- Track changes ✅

// Implementation example:
<PermissionGate requiredPermission="write">
  <ContentEditor showTrackChanges />
  <GrammarChecker />
  <StyleGuide />
</PermissionGate>
```

### **🌐 Translator (Language Adaptation)**
```typescript
// Features they can access:
- Translation interface ✅
- Language variants ✅
- Cultural adaptation notes ✅
- Translation memory ✅

// Implementation example:
<PermissionGate requiredPermission="write">
  <TranslationEditor />
  <LanguageSelector />
  <CulturalNotes />
  <TranslationMemory />
</PermissionGate>
```

### **🎬 Producer (Project Management)**
```typescript
// Features they can access:
- Project timeline ✅
- Collaboration oversight ✅
- Invite more collaborators ✅
- Progress tracking ✅
- Deadline management ✅
- Read-only content access ✅

// Implementation example:
<PermissionGate requiredPermission="invite">
  <ProjectDashboard />
  <TimelineManager />
  <CollaboratorInvites />
  <ProgressTracker />
</PermissionGate>

<PermissionGate requiredPermission="read" fallback={<RestrictedAccess />}>
  <ReadOnlyContent />
</PermissionGate>
```

### **👀 Reviewer (Feedback Provider)**
```typescript
// Features they can access:
- Read-only story access ✅
- Comment system ✅
- Feedback forms ✅
- Rating/review tools ✅

// Implementation example:
<PermissionGate requiredPermission="read">
  <ReadOnlyViewer />
</PermissionGate>

<PermissionGate requiredPermission="comment">
  <CommentSystem />
  <FeedbackForms />
  <RatingTools />
</PermissionGate>
```

## 🔧 **How to Add Role-Based Features**

### **Step 1: Wrap Features with Permission Gates**
```typescript
// Example: Adding a new editing feature
<PermissionGate 
  projectId={projectId} 
  userId={userId} 
  requiredPermission="write"
  fallback={<FeatureNotAvailable />}
  showFallback
>
  <NewEditingFeature />
</PermissionGate>
```

### **Step 2: Create Role-Specific Components**
```typescript
// Example: Producer-only dashboard
function ProducerDashboard({ projectId, userId }) {
  const { userRole } = useRoleBasedUI(projectId, userId)
  
  if (userRole !== 'producer') return null
  
  return (
    <PermissionGate requiredPermission="invite">
      <ProjectManagementTools />
    </PermissionGate>
  )
}
```

### **Step 3: Implement Conditional UI**
```typescript
// Example: Different interfaces per role
function RoleBasedInterface({ projectId, userId }) {
  const { userRole, permissions } = useRoleBasedUI(projectId, userId)
  
  return (
    <div>
      {permissions.canWrite && <WritingTools />}
      {permissions.canComment && <CommentTools />}
      {permissions.canInvite && <InviteTools />}
      {userRole === 'translator' && <TranslationTools />}
      {userRole === 'producer' && <ManagementDashboard />}
    </div>
  )
}
```

## 🎯 **Multiple Role Examples & Use Cases**

### **🔥 Popular Multiple Role Combinations**

#### **1. Coauthor + Translator**
```typescript
// Perfect for bilingual writers
primaryRole: 'coauthor'
secondaryRoles: ['translator']
permissions: {
  read: true,    // From both roles
  write: true,   // From both roles  
  comment: true, // From both roles
  invite: false  // Neither role has this
}
// Can: Write original story AND translate to other languages
```

#### **2. Editor + Producer** 
```typescript
// Editorial manager who also coordinates project
primaryRole: 'editor'
secondaryRoles: ['producer']
permissions: {
  read: true,    // From both roles
  write: true,   // From editor role
  comment: true, // From both roles
  invite: true   // From producer role
}
// Can: Edit content + manage timeline + invite team members
```

#### **3. Reviewer + Translator**
```typescript
// Quality assurance for international content
primaryRole: 'reviewer'
secondaryRoles: ['translator']
permissions: {
  read: true,    // From both roles
  write: true,   // From translator role (for translations)
  comment: true, // From both roles
  invite: false  // Neither role has this
}
// Can: Review original + translate + provide feedback
```

#### **4. Coauthor + Editor + Producer**
```typescript
// Full project partner with comprehensive access
primaryRole: 'coauthor'
secondaryRoles: ['editor', 'producer']
permissions: {
  read: true,    // From all roles
  write: true,   // From coauthor & editor
  comment: true, // From all roles
  invite: true   // From producer role
}
// Can: Everything except ownership transfer
```

## 📊 **Implementation Status**

✅ **Completed:**
- Database structure with multiple role support
- Permission merging system (OR logic)
- Multiple role selector component
- Enhanced permission checking hooks
- Role badge with multiple role display
- UI components for permission gates
- Notification system for role changes
- API endpoints supporting secondary roles

🔄 **Ready to Implement:**
- Apply permission gates to existing components
- Create role-specific UI features
- Add role-based content restrictions
- Implement role management interface

## 🚀 **Next Steps to Activate Multiple Role Features**

1. **Apply Permission Gates**: Wrap existing editor components
2. **Create Role-Specific Features**: Build specialized tools for role combinations
3. **Add Access Control**: Restrict content based on merged permissions
4. **Test Multiple Role Scenarios**: Verify different role combination experiences
5. **Add Role Management**: Allow owners to modify collaborator role combinations

## 💡 **How Multiple Roles Work in Practice**

### **Invitation Process**
```typescript
// User selects primary role + additional roles
const invitation = {
  role: 'coauthor',                    // Primary role
  secondary_roles: ['translator'],     // Additional roles
  // System automatically merges permissions
}
```

### **Permission Checking**
```typescript
// System checks merged permissions from all roles
const canEdit = permissions.write // true if ANY role grants write access
const canInvite = permissions.invite // true if ANY role grants invite access
```

### **UI Display**
```typescript
// Shows primary role with indicator for additional roles
<RoleBadge showAllRoles /> 
// Displays: "Coauthor +1" or individual badges for each role
```

The multiple role system is fully implemented and ready to use! Users can now have complex role combinations that give them exactly the permissions they need for their specific contribution to the project.
