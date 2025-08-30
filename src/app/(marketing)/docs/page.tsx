import Link from 'next/link'
import { ArrowLeft, Book, Code, Download, ExternalLink } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Documentation</h1>
            <div className="w-5" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            StoryFoundry Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about using StoryFoundry to create, protect, and share your stories.
          </p>
        </div>

        {/* Quick Start Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Book className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
            <p className="text-gray-600 mb-4">
              Learn the basics of creating your first project and understanding StoryFoundry's core features.
            </p>
            <Link href="/get-started" className="text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1">
              <span>Start Here</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Reference</h3>
            <p className="text-gray-600 mb-4">
              Integrate StoryFoundry into your workflow with our comprehensive API documentation.
            </p>
            <Link href="/docs/api" className="text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1">
              <span>View API Docs</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
            <p className="text-gray-600 mb-4">
              Download templates, examples, and other resources to help you succeed.
            </p>
            <Link href="#resources" className="text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1">
              <span>Browse Resources</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                <a href="#user-guide" className="block text-sm text-gray-600 hover:text-orange-600">User Guide</a>
                <a href="#features" className="block text-sm text-gray-600 hover:text-orange-600 pl-4">Core Features</a>
                <a href="#collaboration" className="block text-sm text-gray-600 hover:text-orange-600 pl-4">Collaboration</a>
                <a href="#ip-protection" className="block text-sm text-gray-600 hover:text-orange-600 pl-4">IP Protection</a>
                <a href="#integrations" className="block text-sm text-gray-600 hover:text-orange-600">Integrations</a>
                <a href="#api" className="block text-sm text-gray-600 hover:text-orange-600">API Reference</a>
                <a href="#resources" className="block text-sm text-gray-600 hover:text-orange-600">Resources</a>
                <a href="#troubleshooting" className="block text-sm text-gray-600 hover:text-orange-600">Troubleshooting</a>
              </nav>
            </div>
          </div>

          {/* Main Documentation Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="prose max-w-none">
                <section id="user-guide" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">User Guide</h2>
                  
                  <div id="features" className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Features</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Project Creation</h4>
                        <p className="text-gray-600">
                          Create new projects with customizable templates, genre settings, and privacy controls. 
                          Each project comes with built-in version control and automatic cloud backup.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Rich Text Editor</h4>
                        <p className="text-gray-600">
                          Write with our distraction-free editor that supports formatting, character tracking, 
                          and real-time collaboration features.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Version Control</h4>
                        <p className="text-gray-600">
                          Track changes to your work with automatic versioning, compare different drafts, 
                          and restore previous versions when needed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div id="collaboration" className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Collaboration</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Sharing Projects</h4>
                        <p className="text-gray-600">
                          Share your projects with other writers, editors, or beta readers. 
                          Control access levels and permissions for each collaborator.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Comments and Feedback</h4>
                        <p className="text-gray-600">
                          Leave inline comments, suggestions, and feedback. 
                          Track conversations and resolve discussions as you iterate.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Pitch Rooms</h4>
                        <p className="text-gray-600">
                          Create virtual pitch rooms to present your work to publishers, agents, or collaborators. 
                          Schedule sessions and manage feedback efficiently.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div id="ip-protection" className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property Protection</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Blockchain Timestamping</h4>
                        <p className="text-gray-600">
                          Every save creates an immutable timestamp on the blockchain, 
                          providing legal proof of when your content was created.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">IP Certificates</h4>
                        <p className="text-gray-600">
                          Generate downloadable certificates that prove ownership and creation dates. 
                          These documents are legally recognized and can be used in copyright disputes.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Content Hashing</h4>
                        <p className="text-gray-600">
                          Advanced cryptographic hashing ensures the integrity of your work 
                          and can detect any unauthorized modifications.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="integrations" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Integrations</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Export Formats</h4>
                      <p className="text-gray-600 text-sm">
                        Export your work to PDF, DOCX, ePub, and other popular formats.
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Cloud Storage</h4>
                      <p className="text-gray-600 text-sm">
                        Sync with Google Drive, Dropbox, and other cloud storage providers.
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Writing Tools</h4>
                      <p className="text-gray-600 text-sm">
                        Integrate with Grammarly, Hemingway Editor, and other writing aids.
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Publishing Platforms</h4>
                      <p className="text-gray-600 text-sm">
                        Direct publishing to Medium, Substack, and other platforms.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="api" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">API Reference</h2>
                  <p className="text-gray-600 mb-4">
                    StoryFoundry provides a comprehensive REST API for developers who want to integrate 
                    our services into their own applications.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <code className="text-sm">
                      Base URL: https://api.storyfoundry.com/v1
                    </code>
                  </div>
                  <Link href="/docs/api" className="btn-primary inline-flex items-center space-x-2">
                    <span>View Full API Documentation</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </section>

                <section id="resources" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Resources</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Templates</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Pre-built project templates for novels, screenplays, and short stories.
                      </p>
                      <a href="#" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                        Download Templates →
                      </a>
                    </div>
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Style Guides</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Industry-standard formatting guides for different types of writing.
                      </p>
                      <a href="#" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                        View Style Guides →
                      </a>
                    </div>
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Video Tutorials</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Step-by-step video guides covering all major features.
                      </p>
                      <a href="#" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                        Watch Tutorials →
                      </a>
                    </div>
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Community</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Join our community forum to connect with other writers.
                      </p>
                      <a href="#" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                        Join Community →
                      </a>
                    </div>
                  </div>
                </section>

                <section id="troubleshooting" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Troubleshooting</h2>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Common Issues</h4>
                      <div className="space-y-3">
                        <details className="group">
                          <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                            My project isn't saving properly
                          </summary>
                          <div className="mt-2 pl-4 text-gray-600 text-sm">
                            Check your internet connection and ensure you have sufficient storage space. 
                            Try refreshing the page and saving again.
                          </div>
                        </details>
                        <details className="group">
                          <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                            I can't access shared projects
                          </summary>
                          <div className="mt-2 pl-4 text-gray-600 text-sm">
                            Verify that the project owner has granted you the correct permissions. 
                            Check your email for invitation links.
                          </div>
                        </details>
                        <details className="group">
                          <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                            Export function is not working
                          </summary>
                          <div className="mt-2 pl-4 text-gray-600 text-sm">
                            Large projects may take time to export. Wait for the process to complete 
                            or try exporting smaller sections.
                          </div>
                        </details>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Get Help</h4>
                      <p className="text-gray-600 mb-4">
                        Can't find what you're looking for? Our support team is here to help.
                      </p>
                      <Link href="/help" className="btn-primary inline-flex items-center space-x-2">
                        <span>Contact Support</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
