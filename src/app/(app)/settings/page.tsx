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
  ChevronRight
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-300 mt-2">Loading your settings...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-300 mt-2">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
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
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-navy-700/50'
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
              <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <CardDescription className="text-gray-300">
                    Update your personal information and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-navy-700 rounded-full flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-medium text-gold-400">
                          {formData.first_name[0] || formData.last_name[0] || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <Button variant="outline" className="border-navy-600 text-gray-300 hover:bg-navy-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-sm text-gray-400 mt-2">JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 bg-navy-900/50 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 bg-navy-900/50 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-navy-900/30 border border-navy-600 rounded-lg text-gray-400"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-navy-900/50 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="Tell others about yourself and your writing..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 bg-navy-900/50 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Twitter Handle
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_handle}
                        onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                        className="w-full px-4 py-3 bg-navy-900/50 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 bg-navy-900/50 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="Your company or organization"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 bg-navy-900/50 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="Your country"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="bg-gold-500 hover:bg-gold-600 text-navy-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.email_notifications}
                      onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                      className="mt-1 accent-gold-500"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-white">Email Notifications</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Receive important updates about your account and projects
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.project_updates}
                      onChange={(e) => setFormData({ ...formData, project_updates: e.target.checked })}
                      className="mt-1 accent-gold-500"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-white">Project Updates</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Get notified when collaborators make changes to your projects
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.collaboration_invites}
                      onChange={(e) => setFormData({ ...formData, collaboration_invites: e.target.checked })}
                      className="mt-1 accent-gold-500"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-white">Collaboration Invites</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Receive notifications when others invite you to collaborate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.marketing_emails}
                      onChange={(e) => setFormData({ ...formData, marketing_emails: e.target.checked })}
                      className="mt-1 accent-gold-500"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-5 h-5 text-orange-400" />
                        <span className="font-medium text-white">Marketing Emails</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Receive tips, feature updates, and promotional content
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="bg-gold-500 hover:bg-gold-600 text-navy-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Privacy Settings</CardTitle>
                <CardDescription className="text-gray-300">
                  Control your privacy and profile visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="p-4 border border-navy-600 rounded-lg bg-navy-900/30">
                    <div className="flex items-center space-x-3 mb-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">Profile Visibility</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                      Control who can see your profile and project information
                    </p>
                    <select 
                      value={formData.profile_visibility}
                      onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value as 'public' | 'members' | 'private' })}
                      className="w-full px-3 py-2 bg-navy-900/50 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="public">Public - Anyone can see your profile</option>
                      <option value="members">Members Only - Only StoryFoundry members</option>
                      <option value="private">Private - Only you can see your profile</option>
                    </select>
                  </div>

                  <div className="p-4 border border-navy-600 rounded-lg bg-navy-900/30">
                    <div className="flex items-center space-x-3 mb-2">
                      <Eye className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-white">Project Discovery</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                      Allow your public projects to appear in search results
                    </p>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={formData.discoverable}
                        onChange={(e) => setFormData({ ...formData, discoverable: e.target.checked })}
                        className="accent-gold-500"
                      />
                      <span className="text-sm text-gray-300">Enable project discovery</span>
                    </label>
                  </div>

                  <div className="p-4 border border-navy-600 rounded-lg bg-navy-900/30">
                    <div className="flex items-center space-x-3 mb-2">
                      <Lock className="w-5 h-5 text-red-400" />
                      <span className="font-medium text-white">Data Protection</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                      Manage your data and privacy preferences
                    </p>
                    <div className="space-y-2">
                      <button className="text-sm text-gold-400 hover:text-gold-300 block">
                        Download my data
                      </button>
                      <button className="text-sm text-red-400 hover:text-red-300 block">
                        Delete my account
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="bg-gold-500 hover:bg-gold-600 text-navy-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Billing & Subscription</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your subscription and billing preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-navy-900/50 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        {profile?.role === 'pro' ? 'Pro Plan' : profile?.role === 'admin' ? 'Admin' : 'Writer Plan'}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {profile?.role === 'pro' ? 'Advanced features with unlimited projects' : 
                         profile?.role === 'admin' ? 'Full administrative access' : 
                         'Basic features with limited projects'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {profile?.role === 'pro' ? '$19' : '$0'}
                      </span>
                      {profile?.role === 'pro' && <span className="text-sm text-gray-400">/month</span>}
                    </div>
                  </div>
                </div>

                {profile?.role !== 'pro' && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-white">Upgrade to Pro</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border border-navy-600 rounded-lg bg-navy-900/30">
                        <h4 className="font-medium text-white mb-2">Pro Monthly</h4>
                        <p className="text-2xl font-bold text-white mb-2">$19<span className="text-sm font-normal text-gray-400">/month</span></p>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Unlimited projects</li>
                          <li>• Advanced AI features</li>
                          <li>• Priority support</li>
                          <li>• Export to all formats</li>
                        </ul>
                      </div>

                      <div className="p-4 border border-gold-500 rounded-lg bg-gold-500/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">Pro Yearly</h4>
                          <span className="text-xs bg-gold-500 text-navy-900 px-2 py-1 rounded-full">Save 20%</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-2">$15<span className="text-sm font-normal text-gray-400">/month</span></p>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Everything in Pro Monthly</li>
                          <li>• 2 months free</li>
                          <li>• Premium templates</li>
                          <li>• Advanced analytics</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex space-x-4 mt-6">
                      <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">
                        Upgrade to Pro Monthly
                      </Button>
                      <Button variant="outline" className="border-gold-500 text-gold-400 hover:bg-gold-500/10">
                        Upgrade to Pro Yearly
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
  )
}
