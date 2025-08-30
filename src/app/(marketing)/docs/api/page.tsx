import Link from 'next/link'
import { ArrowLeft, Code, Key, Database, Shield } from 'lucide-react'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/docs" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">API Documentation</h1>
            <div className="w-5" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            StoryFoundry API
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build applications that integrate with StoryFoundry's creative writing platform. 
            Manage projects, content, and IP protection programmatically.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">API Reference</h3>
              <nav className="space-y-2">
                <a href="#authentication" className="block text-sm text-gray-600 hover:text-orange-600">Authentication</a>
                <a href="#projects" className="block text-sm text-gray-600 hover:text-orange-600">Projects</a>
                <a href="#content" className="block text-sm text-gray-600 hover:text-orange-600 pl-4">Content</a>
                <a href="#collaboration" className="block text-sm text-gray-600 hover:text-orange-600 pl-4">Collaboration</a>
                <a href="#users" className="block text-sm text-gray-600 hover:text-orange-600">Users</a>
                <a href="#ip-protection" className="block text-sm text-gray-600 hover:text-orange-600">IP Protection</a>
                <a href="#webhooks" className="block text-sm text-gray-600 hover:text-orange-600">Webhooks</a>
                <a href="#rate-limits" className="block text-sm text-gray-600 hover:text-orange-600">Rate Limits</a>
                <a href="#examples" className="block text-sm text-gray-600 hover:text-orange-600">Examples</a>
              </nav>
            </div>
          </div>

          {/* Main Documentation Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="prose max-w-none">
                {/* Overview */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
                  <p className="text-gray-600 mb-4">
                    The StoryFoundry API is a RESTful service that allows you to programmatically access 
                    and manipulate your creative projects, manage collaborations, and integrate IP protection features 
                    into your own applications.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 mb-2">Base URL</h4>
                    <code className="text-blue-800 bg-blue-100 px-2 py-1 rounded">
                      https://api.storyfoundry.com/v1
                    </code>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Key className="w-5 h-5 text-orange-600" />
                        <h4 className="font-medium text-gray-900">Authentication</h4>
                      </div>
                      <p className="text-gray-600 text-sm">
                        API key-based authentication with role-based access control.
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="w-5 h-5 text-orange-600" />
                        <h4 className="font-medium text-gray-900">Data Format</h4>
                      </div>
                      <p className="text-gray-600 text-sm">
                        All requests and responses use JSON format with UTF-8 encoding.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Authentication */}
                <section id="authentication" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication</h2>
                  <p className="text-gray-600 mb-4">
                    The StoryFoundry API uses API keys for authentication. Include your API key in the 
                    Authorization header of your requests.
                  </p>
                  
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                    <pre><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.storyfoundry.com/v1/projects`}</code></pre>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Security Note
                    </h4>
                    <p className="text-yellow-800 text-sm">
                      Keep your API key secure and never expose it in client-side code. 
                      Use environment variables or secure credential management systems.
                    </p>
                  </div>
                </section>

                {/* Projects Endpoint */}
                <section id="projects" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Projects</h2>
                  
                  <div className="space-y-8">
                    {/* List Projects */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">List Projects</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                        <code className="text-gray-700">/projects</code>
                      </div>
                      <p className="text-gray-600 mb-4">Retrieve a list of all projects accessible to the authenticated user.</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                        <pre><code>{`GET /v1/projects?page=1&limit=20&status=active
Authorization: Bearer YOUR_API_KEY

Response:
{
  "data": [
    {
      "id": "proj_123456",
      "title": "My Novel",
      "genre": "Fantasy",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z",
      "word_count": 45000,
      "collaborators": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}`}</code></pre>
                      </div>
                    </div>

                    {/* Create Project */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Create Project</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">POST</span>
                        <code className="text-gray-700">/projects</code>
                      </div>
                      <p className="text-gray-600 mb-4">Create a new project with the specified parameters.</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                        <pre><code>{`POST /v1/projects
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "title": "My New Story",
  "genre": "Science Fiction",
  "description": "A tale of future worlds",
  "privacy": "private",
  "template": "novel"
}

Response:
{
  "id": "proj_789012",
  "title": "My New Story",
  "genre": "Science Fiction",
  "status": "active",
  "created_at": "2024-01-21T09:00:00Z"
}`}</code></pre>
                      </div>
                    </div>

                    {/* Get Project */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Project</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                        <code className="text-gray-700">/projects/{'{id}'}</code>
                      </div>
                      <p className="text-gray-600 mb-4">Retrieve detailed information about a specific project.</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                        <pre><code>{`GET /v1/projects/proj_123456
Authorization: Bearer YOUR_API_KEY

Response:
{
  "id": "proj_123456",
  "title": "My Novel",
  "genre": "Fantasy",
  "description": "An epic fantasy adventure",
  "status": "active",
  "privacy": "private",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z",
  "word_count": 45000,
  "chapter_count": 12,
  "collaborators": [
    {
      "user_id": "user_456",
      "role": "editor",
      "added_at": "2024-01-16T12:00:00Z"
    }
  ],
  "ip_protection": {
    "blockchain_hash": "0x1234567890abcdef",
    "timestamp": "2024-01-15T10:30:00Z",
    "certificate_url": "https://api.storyfoundry.com/certificates/proj_123456.pdf"
  }
}`}</code></pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Content Endpoint */}
                <section id="content" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Content Management</h2>
                  
                  <div className="space-y-8">
                    {/* Get Content */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Project Content</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                        <code className="text-gray-700">/projects/{'{id}'}/content</code>
                      </div>
                      <p className="text-gray-600 mb-4">Retrieve the full content of a project or specific chapters.</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                        <pre><code>{`GET /v1/projects/proj_123456/content?chapter=1
Authorization: Bearer YOUR_API_KEY

Response:
{
  "project_id": "proj_123456",
  "chapter": 1,
  "title": "Chapter 1: The Beginning",
  "content": "It was a dark and stormy night...",
  "word_count": 2500,
  "last_modified": "2024-01-20T14:45:00Z",
  "version": 3
}`}</code></pre>
                      </div>
                    </div>

                    {/* Update Content */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Content</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">PUT</span>
                        <code className="text-gray-700">/projects/{'{id}'}/content</code>
                      </div>
                      <p className="text-gray-600 mb-4">Update the content of a project with automatic versioning and IP protection.</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                        <pre><code>{`PUT /v1/projects/proj_123456/content
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "chapter": 1,
  "content": "Updated content with new paragraphs...",
  "auto_save": true,
  "create_checkpoint": true
}

Response:
{
  "success": true,
  "version": 4,
  "word_count": 2750,
  "blockchain_hash": "0xabcdef1234567890",
  "timestamp": "2024-01-21T09:15:00Z"
}`}</code></pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* IP Protection */}
                <section id="ip-protection" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">IP Protection</h2>
                  <p className="text-gray-600 mb-4">
                    Generate IP protection certificates and manage blockchain timestamping for your creative works.
                  </p>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Generate Certificate</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">POST</span>
                      <code className="text-gray-700">/projects/{'{id}'}/certificate</code>
                    </div>
                    
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                      <pre><code>{`POST /v1/projects/proj_123456/certificate
Authorization: Bearer YOUR_API_KEY

Response:
{
  "certificate_id": "cert_abc123",
  "project_id": "proj_123456",
  "blockchain_hash": "0x1234567890abcdef",
  "timestamp": "2024-01-21T09:30:00Z",
  "download_url": "https://api.storyfoundry.com/certificates/cert_abc123.pdf",
  "expires_at": "2025-01-21T09:30:00Z"
}`}</code></pre>
                    </div>
                  </div>
                </section>

                {/* Rate Limits */}
                <section id="rate-limits" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limits</h2>
                  <p className="text-gray-600 mb-4">
                    The API enforces rate limits to ensure fair usage and system stability.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests/Hour</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Burst Limit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Free</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10/minute</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Starter</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,000</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50/minute</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Professional</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10,000</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">200/minute</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Enterprise</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Custom</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Custom</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Examples */}
                <section id="examples" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript/Node.js</h3>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre><code>{`const fetch = require('node-fetch');

const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.storyfoundry.com/v1';

async function getProjects() {
  const response = await fetch(\`\${BASE_URL}/projects\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  const data = await response.json();
  return data;
}

async function createProject(projectData) {
  const response = await fetch(\`\${BASE_URL}/projects\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });
  
  return response.json();
}`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Python</h3>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre><code>{`import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://api.storyfoundry.com/v1'

class StoryFoundryAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_projects(self):
        response = requests.get(f'{BASE_URL}/projects', headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def create_project(self, project_data):
        response = requests.post(
            f'{BASE_URL}/projects',
            json=project_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
api = StoryFoundryAPI(API_KEY)
projects = api.get_projects()`}</code></pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Support */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Support</h2>
                  <p className="text-gray-600 mb-4">
                    Need help with the API? Our support team is here to assist you.
                  </p>
                  <div className="flex space-x-4">
                    <Link href="/contact" className="btn-primary">
                      Contact Support
                    </Link>
                    <Link href="/docs" className="btn-ghost">
                      Back to Docs
                    </Link>
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
