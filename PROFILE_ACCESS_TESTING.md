# Profile Access Request System - Testing Guide

## Overview
The profile access request system allows users to request access to private profiles and enables profile owners to manage those requests.

## Features Implemented

### 1. Database Schema
✅ **Profile Access Requests Table**: Stores requests for access to private profiles
✅ **Profile Access Grants Table**: Stores approved access permissions
✅ **Notifications Table**: Stores system notifications for users
✅ **Database Functions**: Helper functions for handling access decisions

### 2. Profile Modal Updates
✅ **Request Access Button**: Shows when viewing a private profile
✅ **Access Status Display**: Shows pending/denied status for requests
✅ **Profile Owner Check**: Only shows request button to non-owners

### 3. Privacy Settings
✅ **Profile Access Manager**: Manage access requests and grants in settings
✅ **Conditional Display**: Only shows when profile is set to private
✅ **Approve/Deny Actions**: Quick actions for handling requests

### 4. Notifications System
✅ **Notification Bell**: Real-time notifications in the header
✅ **Access Request Notifications**: When someone requests access
✅ **Access Decision Notifications**: When access is granted/denied

## Testing Steps

### Step 1: Set Up Test Users
1. Create two test accounts (User A and User B)
2. Set User A's profile to "Private" in Settings → Privacy

### Step 2: Test Access Request Flow
1. **As User B**: Try to view User A's profile
2. **Expected**: See "Profile is Private" modal with "Request Access" button
3. **Action**: Click "Request Access"
4. **Expected**: Button changes to "Access request pending"

### Step 3: Test Notification System
1. **As User A**: Check notification bell in header
2. **Expected**: See red badge with notification count
3. **Action**: Click notification bell
4. **Expected**: See "New Profile Access Request" notification

### Step 4: Test Access Management
1. **As User A**: Go to Settings → Privacy
2. **Expected**: See "Profile Access Management" section
3. **Expected**: See User B's pending request with Approve/Deny buttons

### Step 5: Test Access Approval
1. **As User A**: Click "Approve" on User B's request
2. **Expected**: Request moves from "Pending" to "Granted Access" section
3. **As User B**: Check notifications
4. **Expected**: See "Profile Access Granted" notification

### Step 6: Test Profile Access
1. **As User B**: Try to view User A's profile again
2. **Expected**: See full profile (no longer blocked)

### Step 7: Test Access Revocation
1. **As User A**: In Settings, click "Revoke" next to User B's access
2. **Expected**: User B removed from granted access list
3. **As User B**: Try to view User A's profile
4. **Expected**: Blocked again with option to request access

## Database Structure

### Tables Created:
- `profile_access_requests`: Stores access requests
- `profile_access_grants`: Stores granted access
- `notifications`: Stores system notifications

### Functions Created:
- `create_notification()`: Helper for creating notifications
- `handle_profile_access_decision()`: Handles approve/deny actions

## Files Modified:
- `src/components/profile-modal.tsx`: Added request access functionality
- `src/app/(app)/settings/page.tsx`: Added profile access management
- `src/components/profile-access-manager.tsx`: New component for managing access
- `src/components/notification-bell.tsx`: New notification system
- `src/components/app-header.tsx`: Updated to use new notification bell

## Security Features:
- ✅ Row Level Security (RLS) policies implemented
- ✅ Users can only see their own notifications
- ✅ Only profile owners can approve/deny requests
- ✅ Prevented self-requests (users can't request access to their own profile)

## Real-time Features:
- ✅ Real-time notifications via Supabase subscriptions
- ✅ Automatic UI updates when access is granted/revoked
- ✅ Live notification count updates

The system is now fully functional and ready for testing!
