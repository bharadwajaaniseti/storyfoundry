'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User,
  Bell,
  Shield,
  CreditCard,
  Eye,
  Camera,
  Save,
  ArrowLeft,
  Check,
  AlertCircle,
  Globe,
  Lock,
  Mail,
  Smartphone,
  ChevronRight,
  UserPlus
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import AvatarUpload from '@/components/avatar-upload'
import ProfileAccessManager from '@/components/profile-access-manager'

interface Profile {
  id: string
  role: 'writer' | 'pro' | 'admin'
  display_name: string | null
  first_name: string | null
  last_name: string | null
  email: string
  bio: string | null
  website: string | null
  twitter_handle: string | null
  avatar_url: string | null
  company: string | null
  country: string | null
  email_notifications: boolean
  marketing_emails: boolean
  project_updates: boolean
  collaboration_invites: boolean
  profile_visibility: 'public' | 'members' | 'private'
  discoverable: boolean
  verified_pro: boolean
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard }
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error' | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    website: '',
    twitter_handle: '',
    company: '',
    country: '',
    email_notifications: true,
    marketing_emails: false,
    project_updates: true,
    collaboration_invites: true,
    profile_visibility: 'public' as 'public' | 'members' | 'private',
    discoverable: true
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({ ...profileData, email: user.email || '' })
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          bio: profileData.bio || '',
          website: profileData.website || '',
          twitter_handle: profileData.twitter_handle || '',
          company: profileData.company || '',
          country: profileData.country || '',
          email_notifications: profileData.email_notifications ?? true,
          marketing_emails: profileData.marketing_emails ?? false,
          project_updates: profileData.project_updates ?? true,
          collaboration_invites: profileData.collaboration_invites ?? true,
          profile_visibility: profileData.profile_visibility || 'public',
          discoverable: profileData.discoverable ?? true
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!profile) return

    setSaving(true)
    setSaveStatus(null)

    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim() || null,
          last_name: formData.last_name.trim() || null,
          bio: formData.bio.trim() || null,
          website: formData.website.trim() || null,
          twitter_handle: formData.twitter_handle.trim() || null,
          company: formData.company.trim() || null,
          country: formData.country.trim() || null,
          email_notifications: formData.email_notifications,
          marketing_emails: formData.marketing_emails,
          project_updates: formData.project_updates,
          collaboration_invites: formData.collaboration_invites,
          profile_visibility: formData.profile_visibility,
          discoverable: formData.discoverable
        })
        .eq('id', profile.id)

      if (error) throw error

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
      
      // Dispatch event to notify header and other components to refresh
      console.log('🔥 DISPATCHING profileUpdated event from saveProfile');
      window.dispatchEvent(new CustomEvent('profileUpdated'))
      document.dispatchEvent(new CustomEvent('profileUpdated'))
      
      // Also try calling global refresh function directly
      if ((window as any).refreshHeaderProfile) {
        (window as any).refreshHeaderProfile();
      }
      
      // Reload profile to get updated data
      await loadProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/app/dashboard"
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
                  
                  {/* Avatar */}
                  <div className="flex items-center space-x-6 mb-8">
                    <AvatarUpload
                      currentAvatarUrl={profile?.avatar_url}
                      onAvatarUpdate={async (newUrl) => {
                        if (profile) {
                          setProfile({ ...profile, avatar_url: newUrl })
                          // Dispatch event to notify header and other components to refresh
                          window.dispatchEvent(new CustomEvent('profileUpdated'))
                          // Reload profile to ensure data is fresh
                          await loadProfile()
                        }
                      }}
                      size="lg"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Tell others about yourself and your writing..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter Handle
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_handle}
                        onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Your company or organization"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Your country"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.email_notifications}
                      onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-800">Email Notifications</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Receive important updates about your account and projects
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.project_updates}
                      onChange={(e) => setFormData({ ...formData, project_updates: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-800">Project Updates</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Get notified when collaborators make changes to your projects
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.collaboration_invites}
                      onChange={(e) => setFormData({ ...formData, collaboration_invites: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-800">Collaboration Invites</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Receive notifications when others invite you to collaborate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.marketing_emails}
                      onChange={(e) => setFormData({ ...formData, marketing_emails: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-5 h-5 text-orange-500" />
                        <span className="font-medium text-gray-800">Marketing Emails</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Receive tips, feature updates, and promotional content
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Privacy Settings</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-800">Profile Visibility</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Control who can see your profile and project information
                    </p>
                    <select 
                      value={formData.profile_visibility}
                      onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value as 'public' | 'members' | 'private' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="public">Public - Anyone can see your profile</option>
                      <option value="members">Members Only - Only StoryFoundry members</option>
                      <option value="private">Private - Only you can see your profile</option>
                    </select>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Eye className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-800">Project Discovery</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Allow your public projects to appear in search results
                    </p>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={formData.discoverable}
                        onChange={(e) => setFormData({ ...formData, discoverable: e.target.checked })}
                      />
                      <span className="text-sm text-gray-700">Enable project discovery</span>
                    </label>
                  </div>

                  {formData.profile_visibility === 'private' && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <UserPlus className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-800">Profile Access Management</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage who can access your private profile
                      </p>
                      {profile?.id ? (
                        <ProfileAccessManager userId={profile.id} />
                      ) : (
                        <div className="text-sm text-gray-500">Loading...</div>
                      )}
                    </div>
                  )}

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Lock className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-gray-800">Data Protection</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage your data and privacy preferences
                    </p>
                    <div className="space-y-2">
                      <button className="text-sm text-orange-600 hover:text-orange-700">
                        Download my data
                      </button>
                      <button className="text-sm text-red-600 hover:text-red-700 block">
                        Delete my account
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Billing & Subscription</h2>
                
                <div className="p-6 bg-gray-50 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {profile?.role === 'pro' ? 'Pro Plan' : profile?.role === 'admin' ? 'Admin' : 'Writer Plan'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {profile?.role === 'pro' ? 'Advanced features with unlimited projects' : 
                         profile?.role === 'admin' ? 'Full administrative access' : 
                         'Basic features with limited projects'}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-gray-800">
                      {profile?.role === 'pro' ? '$19' : '$0'}
                      {profile?.role === 'pro' && <span className="text-sm font-normal text-gray-600">/month</span>}
                    </span>
                  </div>
                </div>

                {profile?.role !== 'pro' && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-800">Upgrade to Pro</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Pro Monthly</h4>
                        <p className="text-2xl font-bold text-gray-800 mb-2">$19<span className="text-sm font-normal text-gray-600">/month</span></p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Unlimited projects</li>
                          <li>• Advanced AI features</li>
                          <li>• Priority support</li>
                          <li>• Export to all formats</li>
                        </ul>
                      </div>

                      <div className="p-4 border border-orange-500 rounded-lg bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">Pro Yearly</h4>
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">Save 20%</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-2">$15<span className="text-sm font-normal text-gray-600">/month</span></p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Everything in Pro Monthly</li>
                          <li>• 2 months free</li>
                          <li>• Premium templates</li>
                          <li>• Advanced analytics</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex space-x-4 mt-6">
                      <button className="btn-primary">Upgrade to Pro Monthly</button>
                      <button className="btn-secondary">Upgrade to Pro Yearly</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Status */}
            {saveStatus && (
              <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg ${
                saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                <div className="flex items-center space-x-2">
                  {saveStatus === 'saved' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>
                    {saveStatus === 'saved' ? 'Settings saved successfully!' : 'Error saving settings'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
