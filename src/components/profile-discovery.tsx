'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import UserAvatar from '@/components/user-avatar'
import { 
  Search, 
  Filter, 
  Users, 
  Pen, 
  BookOpen, 
  Star,
  Eye,
  UserPlus,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  UserCheck
} from 'lucide-react'

interface Profile {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  role: 'reader' | 'writer'
  website: string | null
  created_at: string
  profile_visibility: 'public' | 'members' | 'private'
  discoverable: boolean
  verified_pro: boolean
  company: string | null
  country: string | null
  follower_count?: number
  following_count?: number
  project_count?: number
}

interface ProfileDiscoveryProps {
  currentUserId?: string
  searchQuery?: string
  roleFilter?: 'all' | 'reader' | 'writer'
  followingUserIds?: string[]
  onFollowingChange?: () => Promise<void>
  onProfileClick?: (profileId: string) => void
}

export default function ProfileDiscovery({ 
  currentUserId, 
  searchQuery: externalSearchQuery = '', 
  roleFilter: externalRoleFilter = 'all',
  followingUserIds = [],
  onFollowingChange,
  onProfileClick
}: ProfileDiscoveryProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'reader' | 'writer'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Use external props when provided, otherwise use internal state
  const effectiveSearchQuery = externalSearchQuery || searchQuery
  const effectiveRoleFilter = externalRoleFilter || roleFilter

  const loadProfiles = async () => {
    try {
      setIsLoading(true)
      const supabase = createSupabaseClient()

      let query = supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          bio,
          avatar_url,
          role,
          website,
          created_at,
          profile_visibility,
          discoverable,
          verified_pro,
          company,
          country
        `)
        .eq('discoverable', true)

      // Apply role filter
      if (effectiveRoleFilter !== 'all') {
        query = query.eq('role', effectiveRoleFilter)
      }

      // Apply search filter
      if (effectiveSearchQuery.trim()) {
        query = query.or(`display_name.ilike.%${effectiveSearchQuery}%,bio.ilike.%${effectiveSearchQuery}%`)
      }

      // Exclude current user
      if (currentUserId) {
        query = query.neq('id', currentUserId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        setIsLoading(false)
        return
      }

      // Get additional stats for each profile
      const profilesWithStats = await Promise.all(
        (data || []).map(async (profile) => {
          // Get follower count
          const { count: followerCount } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact' })
            .eq('following_id', profile.id)

          // Get following count  
          const { count: followingCount } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact' })
            .eq('follower_id', profile.id)

          // Get project count for writers
          let projectCount = 0
          if (profile.role === 'writer') {
            const { count } = await supabase
              .from('projects')
              .select('*', { count: 'exact' })
              .eq('author_id', profile.id)
              .eq('is_published', true)
              .eq('visibility', 'public')
            
            projectCount = count || 0
          }

          return {
            ...profile,
            follower_count: followerCount || 0,
            following_count: followingCount || 0,
            project_count: projectCount
          }
        })
      )

      setProfiles(profilesWithStats)
    } catch (error) {
      // Error loading profiles
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [effectiveSearchQuery, effectiveRoleFilter, currentUserId])

  // Color schemes for consistent styling
  const getColorClasses = (userRole: string = 'reader') => {
    if (userRole === 'writer') {
      return {
        primary: 'bg-orange-500 text-white border-orange-500',
        primaryHover: 'hover:bg-orange-600',
        primaryButton: 'bg-orange-500 hover:bg-orange-600 text-white',
        primaryText: 'text-orange-600',
        primaryTextDark: 'text-orange-700',
        primaryLight: 'bg-orange-50',
        primaryMedium: 'bg-orange-100',
        borderLight: 'border-orange-300',
        ring: 'ring-orange-500/20',
        accent: 'text-orange-400',
        gradient: 'from-orange-50 to-white hover:from-orange-50',
        cardBorder: 'border-l-orange-500',
        iconColor: 'text-orange-500',
        focusRing: 'focus:ring-orange-500/20 focus:border-orange-500',
        hoverBg: 'hover:bg-orange-50',
        hoverText: 'hover:text-orange-700'
      }
    } else {
      return {
        primary: 'bg-purple-500 text-white border-purple-500',
        primaryHover: 'hover:bg-purple-600',
        primaryButton: 'bg-purple-500 hover:bg-purple-600 text-white',
        primaryText: 'text-purple-600',
        primaryTextDark: 'text-purple-700',
        primaryLight: 'bg-purple-50',
        primaryMedium: 'bg-purple-100',
        borderLight: 'border-purple-300',
        ring: 'ring-purple-500/20',
        accent: 'text-purple-400',
        gradient: 'from-purple-50 to-white hover:from-purple-50',
        cardBorder: 'border-l-purple-500',
        iconColor: 'text-purple-500',
        focusRing: 'focus:ring-purple-500/20 focus:border-purple-500',
        hoverBg: 'hover:bg-purple-50',
        hoverText: 'hover:text-purple-700'
      }
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'writer' ? 
      <Pen className="w-4 h-4 text-yellow-500" /> : 
      <BookOpen className="w-4 h-4 text-purple-500" />
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'writer' ? 
      'bg-yellow-100 text-yellow-700 border-yellow-300' : 
      'bg-purple-100 text-purple-700 border-purple-300'
  }

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const getCardClasses = (role: string) => {
    return role === 'writer' 
      ? 'border-orange-200 hover:border-orange-300 hover:bg-orange-50' 
      : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'
  }

  const getStatsBg = (role: string) => {
    return role === 'writer' 
      ? 'bg-orange-50 border border-orange-100' 
      : 'bg-purple-50 border border-purple-100'
  }

  const getButtonClasses = (role: string) => {
    return role === 'writer' 
      ? 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700' 
      : 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
  }

  const getActionButtonClasses = (role: string) => {
    return role === 'writer' 
      ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
      : 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500'
  }

  return (
    <div className="space-y-6">
      {/* Only show search and filters if not provided externally */}
      {!externalSearchQuery && !externalRoleFilter && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search profiles by name or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          </div>

          {showFilters && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <div className="flex space-x-2">
                {['all', 'reader', 'writer'].map((role) => (
                  <Button
                    key={role}
                    variant={roleFilter === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRoleFilter(role as any)}
                    className="capitalize"
                  >
                    {role === 'all' ? 'All Users' : 
                     role === 'writer' ? 'Writers' : 'Readers'}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search terms or filters.' : 'No public profiles are available for discovery.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => {
            const isFollowing = currentUserId && followingUserIds.includes(profile.id)
            
            return (
              <div 
                key={profile.id} 
                onClick={() => {
                  if (onProfileClick) {
                    onProfileClick(profile.id)
                  } else {
                    window.dispatchEvent(new CustomEvent('openProfileModal', {
                      detail: { profileId: profile.id }
                    }))
                  }
                }}
                className="block group cursor-pointer"
              >
                <Card className={`w-full bg-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 cursor-pointer hover:shadow-xl ${profile.role === 'writer' ? 'hover:border-orange-400' : 'hover:border-purple-400'} hover:-translate-y-1 transform group-hover:h-auto overflow-hidden`}>
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <UserAvatar 
                          user={profile}
                          size="custom"
                          className="w-16 h-16 ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all duration-300"
                          fallbackClassName={`${profile.role === 'writer' ? 'bg-orange-500' : 'bg-purple-500'} text-white text-lg font-semibold`}
                        />
                        {profile.verified_pro && (
                          <div className={`absolute -top-1 -right-1 w-6 h-6 ${profile.role === 'writer' ? 'bg-orange-500' : 'bg-purple-500'} rounded-full flex items-center justify-center shadow-sm`}>
                            <Star className="w-3 h-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-gray-700 transition-colors">
                          {profile.display_name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className={`text-xs ${profile.role === 'writer' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'} border-0`}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {profile.role || 'Writer'}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Following Status */}
                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          
                          if (!currentUserId) {
                            return
                          }
                          
                          try {
                            const supabase = createSupabaseClient()
                            
                            if (isFollowing) {
                              // Unfollow
                              await supabase
                                .from('user_follows')
                                .delete()
                                .eq('follower_id', currentUserId)
                                .eq('following_id', profile.id)
                            } else {
                              // Follow
                              await supabase
                                .from('user_follows')
                                .insert({
                                  follower_id: currentUserId,
                                  following_id: profile.id
                                })
                            }
                            
                            // Refresh following status
                            if (onFollowingChange) {
                              await onFollowingChange()
                            }
                          } catch (error) {
                            // Error toggling follow
                          }
                        }}
                        disabled={!currentUserId}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 transform ${
                          !currentUserId 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isFollowing
                              ? `${profile.role === 'writer' ? 'bg-orange-500' : 'bg-purple-500'} text-white hover:opacity-80`
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {!currentUserId ? (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Sign in to Follow
                          </>
                        ) : isFollowing ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Follow
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">
                      {profile.bio}
                    </p>
                  )}

                  {/* Stats Section */}
                  <div className={`grid grid-cols-3 gap-4 py-4 border-t border-gray-100 group-hover:border-gray-200 transition-colors`}>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${profile.role === 'writer' ? 'text-orange-700' : 'text-purple-700'} group-hover:scale-110 transition-transform duration-200`}>
                        {profile.follower_count || 0}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${profile.role === 'writer' ? 'text-orange-700' : 'text-purple-700'} group-hover:scale-110 transition-transform duration-200`}>
                        {profile.project_count || 0}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${profile.role === 'writer' ? 'text-orange-700' : 'text-purple-700'} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {Math.floor(Math.random() * 500) + 100}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Buzz Score</div>
                    </div>
                  </div>

                  {/* Footer - Dynamic Height Expansion */}
                  <div className="transition-all duration-300 ease-in-out max-h-0 group-hover:max-h-20 overflow-hidden">
                    <div className="pt-4 border-t border-gray-100 group-hover:border-gray-200 transition-colors">
                      <div className="flex items-center justify-center">
                        <div className={`text-sm ${profile.role === 'writer' ? 'text-orange-600' : 'text-purple-600'} font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0`}>
                          Click to view profile →
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
