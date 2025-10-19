'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Lock, Eye, FileCheck, Server, AlertTriangle, CheckCircle, ArrowRight, Download, Globe, Database, Key, Users } from 'lucide-react'

const securityFeatures = [
  {
    icon: Shield,
    title: 'SOC 2 Type II Certified',
    description: 'We maintain the highest standards of security controls and undergo annual third-party audits.',
    gradient: 'from-blue-500 to-purple-500'
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Your stories and intellectual property are encrypted at rest and in transit using AES-256 encryption.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Database,
    title: 'Secure Data Centers',
    description: 'Data stored in enterprise-grade facilities with 99.99% uptime SLA and redundant backups.',
    gradient: 'from-green-500 to-blue-500'
  },
  {
    icon: Key,
    title: 'Access Controls',
    description: 'Role-based permissions, two-factor authentication, and single sign-on (SSO) support.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Eye,
    title: 'Privacy First',
    description: 'GDPR and CCPA compliant. We never sell your data or use your content to train AI models.',
    gradient: 'from-pink-500 to-red-500'
  },
  {
    icon: Server,
    title: 'DDoS Protection',
    description: 'Enterprise-grade protection against distributed denial-of-service attacks and threats.',
    gradient: 'from-indigo-500 to-blue-500'
  }
]

const certifications = [
  { name: 'SOC 2 Type II', status: 'Certified', date: '2024' },
  { name: 'ISO 27001', status: 'In Progress', date: 'Q2 2025' },
  { name: 'GDPR Compliant', status: 'Certified', date: '2024' },
  { name: 'CCPA Compliant', status: 'Certified', date: '2024' }
]

const securityPractices = [
  {
    category: 'Infrastructure Security',
    practices: [
      'Multi-region data replication',
      'Automated security patching',
      'Network isolation and segmentation',
      'Intrusion detection systems',
      'Regular vulnerability assessments'
    ]
  },
  {
    category: 'Application Security',
    practices: [
      'Secure software development lifecycle',
      'Code review and static analysis',
      'Penetration testing (quarterly)',
      'Dependency security scanning',
      'Security-focused QA testing'
    ]
  },
  {
    category: 'Data Protection',
    practices: [
      'Encryption at rest (AES-256)',
      'Encryption in transit (TLS 1.3)',
      'Automated daily backups',
      'Data retention policies',
      'Secure data deletion'
    ]
  },
  {
    category: 'Access & Identity',
    practices: [
      'Multi-factor authentication (MFA)',
      'Single sign-on (SSO) support',
      'Role-based access control (RBAC)',
      'Session management',
      'Audit logging and monitoring'
    ]
  }
]

const SecurityFeatureCard = ({ feature, index }: any) => (
  <div className="card-modern group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.gradient} bg-opacity-10 flex-shrink-0`}>
        <feature.icon className="w-6 h-6 text-blue-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-gradient transition-all duration-300">
          {feature.title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
      </div>
    </div>
  </div>
)

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-2 mb-8">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Enterprise-Grade Security</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Stories Are <span className="text-gradient">Safe With Us</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We implement industry-leading security practices to protect your intellectual property 
              and ensure your creative work remains confidential and secure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started" className="btn-primary group flex items-center justify-center space-x-2">
                <span>Get Started Securely</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="btn-secondary group flex items-center justify-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Security Whitepaper</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Comprehensive <span className="text-gradient">Security Measures</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Multiple layers of protection to safeguard your creative assets and personal information.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <SecurityFeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Certifications & <span className="text-gradient">Compliance</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {certifications.map((cert, index) => (
                <div key={cert.name} className="card-modern p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {cert.status === 'Certified' ? (
                      <div className="p-3 rounded-xl bg-green-100">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-orange-100">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{cert.name}</h3>
                      <p className="text-sm text-gray-600">{cert.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    cert.status === 'Certified' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Our <span className="text-gradient">Security Practices</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {securityPractices.map((section, index) => (
                <div key={section.category} className="card-modern p-8">
                  <h3 className="text-xl font-semibold mb-6 text-gray-800">{section.category}</h3>
                  <ul className="space-y-3">
                    {section.practices.map((practice, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="card-modern p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Responsible Disclosure</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We take security seriously and welcome responsible disclosure of security vulnerabilities. 
                If you discover a security issue, please report it to our security team.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:security@storyfoundry.com" 
                  className="btn-primary"
                >
                  Report Security Issue
                </a>
                <Link href="/contact" className="btn-secondary">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Security <span className="text-gradient">FAQs</span>
            </h2>
            
            <div className="space-y-6">
              <div className="card-modern p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  How is my intellectual property protected?
                </h3>
                <p className="text-gray-600">
                  Your work is encrypted using military-grade AES-256 encryption, stored in secure data centers, 
                  and we offer blockchain timestamping for additional proof of creation and ownership.
                </p>
              </div>
              
              <div className="card-modern p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Do you use my content to train AI models?
                </h3>
                <p className="text-gray-600">
                  Absolutely not. Your creative work is your property. We never use your content for AI training 
                  or any other purpose without your explicit permission.
                </p>
              </div>
              
              <div className="card-modern p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  What happens to my data if I delete my account?
                </h3>
                <p className="text-gray-600">
                  When you delete your account, we permanently remove all your personal data and creative work 
                  from our systems within 30 days, in accordance with data retention regulations.
                </p>
              </div>
              
              <div className="card-modern p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  How often do you perform security audits?
                </h3>
                <p className="text-gray-600">
                  We conduct quarterly penetration testing, annual third-party security audits for SOC 2 compliance, 
                  and continuous automated security monitoring 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Create in a <span className="text-gradient">Secure Environment</span>?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who trust StoryFoundry to protect their intellectual property.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started" className="btn-primary group flex items-center justify-center space-x-2">
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="btn-secondary">
                Talk to Security Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
