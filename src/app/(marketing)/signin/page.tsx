'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

function SignInForm() {
  // ...existing code...
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/app/dashboard'

  // Listen for Supabase auth state changes and redirect after login
  useEffect(() => {
    const supabase = createSupabaseClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        router.push(redirectTo);
        router.refresh();
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, redirectTo]);
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'reader' | 'writer' | null>(null) // Role selection for OAuth
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.user) {
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      setError('Please select your role before continuing with Google')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const supabase = createSupabaseClient()
      let redirectUrl = ''
      if (typeof window !== 'undefined') {
        redirectUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}&role=${selectedRole}`
      } else {
        // fallback for SSR, but this should never run in SSR
        redirectUrl = `/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}&role=${selectedRole}`
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            role: selectedRole // Pass role as query parameter
          }
        }
      })
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Google sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Feature Highlights */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 to-red-500 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">Welcome back</h2>
          <p className="text-xl text-white/90 mb-8">
            Continue your creative journey with StoryFoundry's powerful storytelling tools.
          </p>
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">New: AI Coverage Analysis</h3>
              <p className="text-sm text-white/80">
                Get professional-grade script coverage powered by industry knowledge.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">Enhanced Collaboration</h3>
              <p className="text-sm text-white/80">
                New real-time editing features for seamless team workflows.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">SF</span>
            </div>
            <span className="text-xl font-bold text-gray-800">StoryFoundry</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign in to your account</h1>
            <p className="text-gray-600">
              Welcome back! Please enter your details to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Sign in failed</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors pr-12"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-orange-500 bg-white border-gray-300 rounded focus:ring-orange-500"
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-orange-500 hover:text-orange-600">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary group flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Role Selection for Social Sign In */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Continue as a
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('reader')}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                  selectedRole === 'reader'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                <div className="w-8 h-8 mb-2 rounded-full bg-current opacity-20"></div>
                <span className="font-medium text-sm">Reader</span>
                <span className="text-xs text-center mt-1">
                  Browse & discover stories
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('writer')}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                  selectedRole === 'writer'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                <div className="w-8 h-8 mb-2 rounded-full bg-current opacity-20"></div>
                <span className="font-medium text-sm">Writer</span>
                <span className="text-xs text-center mt-1">
                  Create & publish stories
                </span>
              </button>
            </div>
            {selectedRole && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                {selectedRole === 'reader' 
                  ? 'Perfect for discovering amazing stories. You can upgrade to Writer anytime.'
                  : 'Perfect for authors and storytellers. Create, collaborate, and protect your work.'
                }
              </p>
            )}
          </div>

          {/* Social Sign In */}
          <div className="space-y-3">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading || !selectedRole}
              className={`w-full flex items-center justify-center space-x-3 py-3 px-4 border rounded-lg transition-colors ${
                selectedRole 
                  ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>
                {selectedRole 
                  ? `Continue with Google as ${selectedRole === 'reader' ? 'Reader' : 'Writer'}`
                  : 'Select your role first'
                }
              </span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
}
