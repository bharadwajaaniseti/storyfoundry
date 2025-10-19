'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Clock, Activity, Server, Database, Globe, Zap, ArrowRight, TrendingUp, ExternalLink } from 'lucide-react'

const services = [
  {
    name: 'API Services',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '45ms',
    description: 'Core API endpoints and services'
  },
  {
    name: 'Web Application',
    status: 'operational',
    uptime: '99.98%',
    responseTime: '120ms',
    description: 'Main web application and dashboard'
  },
  {
    name: 'AI Services',
    status: 'operational',
    uptime: '99.95%',
    responseTime: '850ms',
    description: 'AI writing assistant and generation tools'
  },
  {
    name: 'Database',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '12ms',
    description: 'Primary database and storage systems'
  },
  {
    name: 'Authentication',
    status: 'operational',
    uptime: '100%',
    responseTime: '35ms',
    description: 'User authentication and authorization'
  },
  {
    name: 'File Storage',
    status: 'operational',
    uptime: '99.97%',
    responseTime: '180ms',
    description: 'Media and document storage'
  },
  {
    name: 'Email Services',
    status: 'operational',
    uptime: '99.96%',
    responseTime: '250ms',
    description: 'Email notifications and communications'
  },
  {
    name: 'CDN',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '22ms',
    description: 'Content delivery network'
  }
]

const incidents = [
  {
    date: 'Oct 15, 2024',
    title: 'API Latency Increase',
    severity: 'Minor',
    status: 'Resolved',
    duration: '45 minutes',
    description: 'Increased API response times due to database query optimization. Issue was resolved by implementing improved caching.',
    affectedServices: ['API Services', 'Web Application']
  },
  {
    date: 'Oct 8, 2024',
    title: 'Scheduled Maintenance',
    severity: 'Maintenance',
    status: 'Completed',
    duration: '2 hours',
    description: 'Scheduled infrastructure upgrade to improve performance and reliability.',
    affectedServices: ['All Services']
  },
  {
    date: 'Sep 22, 2024',
    title: 'Email Delivery Delay',
    severity: 'Minor',
    status: 'Resolved',
    duration: '1 hour',
    description: 'Brief delay in email delivery due to third-party service provider issues.',
    affectedServices: ['Email Services']
  }
]

const upcomingMaintenance = [
  {
    date: 'Nov 20, 2024',
    time: '02:00 AM - 04:00 AM PST',
    title: 'Database Upgrade',
    description: 'Scheduled database maintenance to improve performance. Brief service interruptions expected.',
    impact: 'Low'
  }
]

const metrics = [
  { label: 'Uptime (30 days)', value: '99.98%', icon: TrendingUp, color: 'text-green-500' },
  { label: 'Avg Response Time', value: '95ms', icon: Zap, color: 'text-blue-500' },
  { label: 'API Requests/day', value: '2.4M', icon: Activity, color: 'text-purple-500' },
  { label: 'Global CDN Nodes', value: '45', icon: Globe, color: 'text-orange-500' }
]

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'operational':
        return {
          icon: CheckCircle,
          text: 'Operational',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          iconColor: 'text-green-500'
        }
      case 'degraded':
        return {
          icon: AlertCircle,
          text: 'Degraded Performance',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-500'
        }
      case 'outage':
        return {
          icon: AlertCircle,
          text: 'Partial Outage',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          iconColor: 'text-red-500'
        }
      default:
        return {
          icon: Clock,
          text: 'Maintenance',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-500'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor} text-sm font-medium`}>
      <Icon className={`w-4 h-4 ${config.iconColor}`} />
      <span>{config.text}</span>
    </span>
  )
}

const ServiceStatusCard = ({ service }: any) => (
  <div className="card-modern p-6 hover:shadow-lg transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{service.name}</h3>
        <p className="text-sm text-gray-600">{service.description}</p>
      </div>
      <StatusBadge status={service.status} />
    </div>
    
    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
      <div>
        <div className="text-xs text-gray-500 mb-1">Uptime</div>
        <div className="text-sm font-semibold text-green-600">{service.uptime}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Response Time</div>
        <div className="text-sm font-semibold text-blue-600">{service.responseTime}</div>
      </div>
    </div>
  </div>
)

const IncidentCard = ({ incident }: any) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-700'
      case 'Major': return 'bg-orange-100 text-orange-700'
      case 'Minor': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div className="card-modern p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm text-gray-500">{incident.date}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
              {incident.severity}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              {incident.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{incident.title}</h3>
          <p className="text-gray-600 text-sm mb-3 leading-relaxed">{incident.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Duration: {incident.duration}</span>
            </span>
            <span>Affected: {incident.affectedServices.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StatusPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const allOperational = services.every(s => s.status === 'operational')

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      {/* Status Banner */}
      <div className={`${allOperational ? 'bg-green-500' : 'bg-yellow-500'} text-white py-4`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {allOperational ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold text-lg">All Systems Operational</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6" />
                  <span className="font-semibold text-lg">Some Services Experiencing Issues</span>
                </>
              )}
            </div>
            <span className="text-sm opacity-90">
              Last updated: {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl font-bold mb-6">
              System <span className="text-gradient">Status</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Real-time monitoring of all StoryFoundry services and infrastructure. 
              Subscribe to get instant notifications about incidents.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            {metrics.map((metric, index) => (
              <div key={index} className="card-modern p-6 text-center">
                <metric.icon className={`w-8 h-8 ${metric.color} mx-auto mb-3`} />
                <div className="text-2xl font-bold text-gray-800 mb-1">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Status */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">
              Service <span className="text-gradient">Status</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <ServiceStatusCard key={index} service={service} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Maintenance */}
      {upcomingMaintenance.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">
                Scheduled <span className="text-gradient">Maintenance</span>
              </h2>
              
              <div className="space-y-4">
                {upcomingMaintenance.map((maintenance, index) => (
                  <div key={index} className="card-modern p-6 bg-blue-50 border-blue-200">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{maintenance.title}</h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            Impact: {maintenance.impact}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{maintenance.description}</p>
                        <div className="text-sm text-gray-600">
                          <strong>{maintenance.date}</strong> • {maintenance.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Incident History */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">
              Recent <span className="text-gradient">Incidents</span>
            </h2>
            
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <IncidentCard key={index} incident={incident} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/status/history" className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center space-x-2">
                <span>View Full Incident History</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="card-modern p-12 text-center bg-gradient-to-br from-orange-50 to-red-50">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Activity className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Stay Informed</h2>
              <p className="text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                Subscribe to get real-time notifications about service status changes, 
                planned maintenance, and incident updates.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="btn-primary px-8 whitespace-nowrap">
                  Subscribe
                </button>
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                Or follow our status on{' '}
                <a href="https://twitter.com/storyfoundry" className="text-orange-600 hover:text-orange-700 font-semibold">
                  Twitter
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Links Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/security" className="card-modern p-6 hover:shadow-lg transition-all duration-300 group">
                <Server className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-gradient transition-all">
                  Security
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Learn about our security measures and compliance
                </p>
                <span className="text-orange-600 text-sm font-semibold inline-flex items-center space-x-1">
                  <span>Learn More</span>
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/help" className="card-modern p-6 hover:shadow-lg transition-all duration-300 group">
                <Activity className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-gradient transition-all">
                  Support
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Get help and contact our support team
                </p>
                <span className="text-orange-600 text-sm font-semibold inline-flex items-center space-x-1">
                  <span>Get Help</span>
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Link>

              <Link href="/docs/api" className="card-modern p-6 hover:shadow-lg transition-all duration-300 group">
                <Database className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-gradient transition-all">
                  API Docs
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Check API status and documentation
                </p>
                <span className="text-orange-600 text-sm font-semibold inline-flex items-center space-x-1">
                  <span>View Docs</span>
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
