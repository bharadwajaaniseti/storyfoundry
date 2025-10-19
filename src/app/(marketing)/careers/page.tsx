'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, MapPin, Clock, DollarSign, Users, Heart, Lightbulb, Rocket, Coffee, Home, Plane, GraduationCap, ArrowRight, Search } from 'lucide-react'

const openPositions = [
  {
    id: 1,
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA / Remote',
    type: 'Full-time',
    salary: '$140K - $180K',
    description: 'Build scalable features for our AI-powered storytelling platform.',
    tags: ['React', 'Node.js', 'TypeScript', 'AWS']
  },
  {
    id: 2,
    title: 'AI/ML Engineer',
    department: 'AI Research',
    location: 'San Francisco, CA / Remote',
    type: 'Full-time',
    salary: '$150K - $200K',
    description: 'Develop and improve our AI models for creative writing assistance.',
    tags: ['Python', 'TensorFlow', 'NLP', 'LLMs']
  },
  {
    id: 3,
    title: 'Product Designer',
    department: 'Design',
    location: 'San Francisco, CA / Remote',
    type: 'Full-time',
    salary: '$120K - $160K',
    description: 'Design intuitive interfaces that empower storytellers worldwide.',
    tags: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping']
  },
  {
    id: 4,
    title: 'Product Manager',
    department: 'Product',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$130K - $170K',
    description: 'Lead product strategy and roadmap for key platform features.',
    tags: ['Strategy', 'Analytics', 'Stakeholder Management', 'Agile']
  },
  {
    id: 5,
    title: 'Content Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90K - $120K',
    description: 'Create compelling content that resonates with storytellers and creators.',
    tags: ['Content Strategy', 'SEO', 'Copywriting', 'Social Media']
  },
  {
    id: 6,
    title: 'Customer Success Manager',
    department: 'Support',
    location: 'San Francisco, CA / Remote',
    type: 'Full-time',
    salary: '$80K - $110K',
    description: 'Help our customers achieve their creative goals and drive product adoption.',
    tags: ['Customer Success', 'SaaS', 'Communication', 'Problem Solving']
  }
]

const benefits = [
  {
    icon: DollarSign,
    title: 'Competitive Salary',
    description: 'Industry-leading compensation plus equity in a fast-growing company.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Home,
    title: 'Remote-First',
    description: 'Work from anywhere or join us in our beautiful San Francisco office.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision insurance for you and your family.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Plane,
    title: 'Unlimited PTO',
    description: 'Take time off when you need it. We trust you to manage your schedule.',
    color: 'from-purple-500 to-violet-500'
  },
  {
    icon: GraduationCap,
    title: 'Learning Budget',
    description: '$2,000 annual budget for courses, conferences, and professional development.',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Coffee,
    title: 'Team Events',
    description: 'Regular team offsites, happy hours, and social activities.',
    color: 'from-red-500 to-orange-500'
  }
]

const values = [
  {
    icon: Lightbulb,
    title: 'Innovation First',
    description: 'We embrace new ideas and aren\'t afraid to experiment.'
  },
  {
    icon: Users,
    title: 'Collaborative Spirit',
    description: 'We believe the best work happens when we work together.'
  },
  {
    icon: Heart,
    title: 'Creator-Centric',
    description: 'Everything we do is in service of our creative community.'
  },
  {
    icon: Rocket,
    title: 'Move Fast',
    description: 'We ship quickly, learn from feedback, and iterate constantly.'
  }
]

const JobCard = ({ job }: any) => {
  return (
    <div className="card-modern p-6 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800 group-hover:text-gradient transition-all duration-300 mb-2">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <Briefcase className="w-4 h-4" />
              <span>{job.department}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{job.type}</span>
            </span>
          </div>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
          {job.salary}
        </div>
      </div>
      
      <p className="text-gray-600 mb-4 leading-relaxed">{job.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {job.tags.map((tag: string, index: number) => (
          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>
      
      <button className="btn-primary w-full group flex items-center justify-center space-x-2">
        <span>Apply Now</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}

const BenefitCard = ({ benefit, index }: any) => (
  <div className="card-modern p-6 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${benefit.color} flex items-center justify-center mb-4`}>
      <benefit.icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-800">{benefit.title}</h3>
    <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
  </div>
)

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const departments = ['all', 'Engineering', 'AI Research', 'Design', 'Product', 'Marketing', 'Support']
  
  const filteredJobs = openPositions.filter(job => {
    const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesDepartment && matchesSearch
  })

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-orange-100 border border-orange-200 rounded-full px-4 py-2 mb-8">
              <Briefcase className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">We're Hiring!</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Build the Future of <span className="text-gradient">Storytelling</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join our mission to empower creators worldwide with AI-powered tools 
              that protect and amplify their creative voices.
            </p>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span><strong>50+</strong> Team Members</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span><strong>Remote-First</strong> Culture</span>
              </div>
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-orange-500" />
                <span><strong>Series A</strong> Funded</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Our <span className="text-gradient">Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do and help us build a culture we're proud of.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div key={value.title} className="card-modern p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Why Work at <span className="text-gradient">StoryFoundry</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We invest in our team with competitive compensation and comprehensive benefits.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <BenefitCard key={benefit.title} benefit={benefit} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">
              Open <span className="text-gradient">Positions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find your next opportunity and help us revolutionize storytelling.
            </p>
          </div>
          
          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="card-modern p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search positions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDepartment(dept)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                        selectedDepartment === dept
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {dept === 'all' ? 'All Departments' : dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Job Listings */}
          <div className="max-w-4xl mx-auto">
            {filteredJobs.length > 0 ? (
              <div className="space-y-6">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No positions found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Didn't Find a Match */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="card-modern p-12 text-center bg-gradient-to-br from-orange-50 to-red-50">
              <h2 className="text-3xl font-bold mb-4">Didn't Find the Right Role?</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We're always looking for talented individuals who are passionate about storytelling and technology. 
                Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:careers@storyfoundry.com" className="btn-primary">
                  Send Your Resume
                </a>
                <Link href="/contact" className="btn-secondary">
                  Contact HR Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Make an <span className="text-gradient">Impact</span>?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join a team that's passionate about empowering creators and building the future of storytelling.
            </p>
            
            <button className="btn-primary group flex items-center justify-center space-x-2 mx-auto">
              <span>View All Positions</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
