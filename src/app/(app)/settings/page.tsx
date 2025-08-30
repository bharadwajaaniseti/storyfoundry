import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  User, 
  CreditCard, 
  Shield, 
  Bell, 
  Eye, 
  Users,
  ChevronRight
} from 'lucide-react'

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'Profile',
      description: 'Manage your personal information and professional details',
      icon: User,
      href: '/settings/profile',
      items: ['Display name', 'Bio', 'Avatar', 'Contact info']
    },
    {
      title: 'Billing & Subscription',
      description: 'Manage your subscription, payment methods, and billing history',
      icon: CreditCard,
      href: '/settings/billing',
      items: ['Current plan', 'Payment methods', 'Billing history', 'Invoices']
    },
    {
      title: 'Privacy & Security',
      description: 'Control your privacy settings and account security',
      icon: Shield,
      href: '/settings/privacy',
      items: ['Password', 'Two-factor auth', 'Data privacy', 'Account deletion']
    },
    {
      title: 'Notifications',
      description: 'Configure email and in-app notification preferences',
      icon: Bell,
      href: '/settings/notifications',
      items: ['Email alerts', 'Push notifications', 'Project updates', 'Marketing']
    },
    {
      title: 'Visibility & Discovery',
      description: 'Control how others can find and interact with you',
      icon: Eye,
      href: '/settings/visibility',
      items: ['Profile visibility', 'Project discovery', 'Contact preferences']
    },
    {
      title: 'Team & Collaboration',
      description: 'Manage team settings and collaboration preferences',
      icon: Users,
      href: '/settings/team',
      items: ['Default permissions', 'Collaboration tools', 'Team invitations']
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-300 mt-2">Manage your account preferences and configuration</p>
      </div>

      {/* Settings Categories */}
      <div className="grid gap-6">
        {settingsCategories.map((category) => {
          const IconComponent = category.icon
          
          return (
            <Card key={category.title} className="bg-navy-800/50 border-navy-700 backdrop-blur-sm hover:border-navy-600 transition-colors">
              <CardContent className="p-6">
                <Link href={category.href} className="block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-navy-900" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">{category.title}</h3>
                        <p className="text-gray-300 mb-3">{category.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {category.items.map((item) => (
                            <span key={item} className="text-xs text-gray-400 bg-navy-900/50 px-2 py-1 rounded">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-300">
            Common settings tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/settings/profile">
                <User className="w-6 h-6" />
                <span>Update Profile</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/settings/billing">
                <CreditCard className="w-6 h-6" />
                <span>Manage Billing</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
