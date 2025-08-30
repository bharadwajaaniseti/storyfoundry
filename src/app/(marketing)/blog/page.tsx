import Link from 'next/link'
import { ArrowLeft, Calendar, User, ArrowRight, Clock } from 'lucide-react'

export default function BlogPage() {
  // Sample blog posts data
  const featuredPost = {
    id: 1,
    title: "The Future of Creative Writing: How AI and Blockchain Are Transforming Storytelling",
    excerpt: "Explore how emerging technologies are revolutionizing the way writers create, protect, and share their stories in the digital age.",
    author: "Sarah Chen",
    date: "2024-01-20",
    readTime: "8 min read",
    category: "Technology",
    image: "/api/placeholder/800/400",
    slug: "future-of-creative-writing"
  }

  const blogPosts = [
    {
      id: 2,
      title: "5 Essential Tips for Protecting Your Intellectual Property as a Writer",
      excerpt: "Learn the fundamental steps every writer should take to safeguard their creative works and maintain ownership rights.",
      author: "Michael Rodriguez",
      date: "2024-01-18",
      readTime: "6 min read",
      category: "Legal",
      image: "/api/placeholder/400/300",
      slug: "protecting-intellectual-property"
    },
    {
      id: 3,
      title: "Building a Writing Community: The Power of Collaborative Storytelling",
      excerpt: "Discover how connecting with other writers can enhance your creativity and help you grow as a storyteller.",
      author: "Emma Thompson",
      date: "2024-01-15",
      readTime: "5 min read",
      category: "Community",
      image: "/api/placeholder/400/300",
      slug: "building-writing-community"
    },
    {
      id: 4,
      title: "From Idea to Publication: A Complete Guide to the Modern Writing Process",
      excerpt: "Navigate the journey from initial concept to published work with our comprehensive step-by-step guide.",
      author: "David Park",
      date: "2024-01-12",
      readTime: "10 min read",
      category: "Writing Tips",
      image: "/api/placeholder/400/300",
      slug: "idea-to-publication-guide"
    },
    {
      id: 5,
      title: "Understanding Blockchain Technology for Writers",
      excerpt: "A beginner-friendly explanation of how blockchain can help writers timestamp and protect their creative works.",
      author: "Lisa Wang",
      date: "2024-01-10",
      readTime: "7 min read",
      category: "Technology",
      image: "/api/placeholder/400/300",
      slug: "blockchain-for-writers"
    },
    {
      id: 6,
      title: "The Art of Feedback: Giving and Receiving Constructive Criticism",
      excerpt: "Master the delicate balance of providing helpful feedback while being open to receiving it for your own work.",
      author: "James Mitchell",
      date: "2024-01-08",
      readTime: "6 min read",
      category: "Writing Tips",
      image: "/api/placeholder/400/300",
      slug: "art-of-feedback"
    }
  ]

  const categories = [
    { name: "All", count: 25 },
    { name: "Writing Tips", count: 8 },
    { name: "Technology", count: 6 },
    { name: "Community", count: 5 },
    { name: "Legal", count: 4 },
    { name: "Industry News", count: 2 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Blog</h1>
            <div className="w-5" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The StoryFoundry Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, tips, and stories from the world of creative writing. 
            Stay updated with the latest trends and best practices in storytelling.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-12">
              <div className="aspect-video bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                <span className="text-white text-sm">Featured Image</span>
              </div>
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-4">
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    {featuredPost.category}
                  </span>
                  <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                    Featured
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                  <Link 
                    href={`/blog/${featuredPost.slug}`}
                    className="btn-primary group flex items-center space-x-2"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Blog Posts Grid */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Latest Posts</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {blogPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="aspect-video bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                      <span className="text-white text-sm">Post Image</span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{post.author}</span>
                          <span>•</span>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                        <Link 
                          href={`/blog/${post.slug}`}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center space-x-2">
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 text-sm bg-orange-600 text-white rounded-md">
                1
              </button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-orange-600 py-1"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
              <p className="text-orange-100 text-sm mb-4">
                Get the latest writing tips and StoryFoundry updates delivered to your inbox.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 rounded text-gray-900 text-sm"
                />
                <button className="w-full bg-white text-orange-600 px-4 py-2 rounded text-sm font-medium hover:bg-orange-50">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Popular Posts */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Posts</h3>
              <div className="space-y-4">
                {blogPosts.slice(0, 3).map((post, index) => (
                  <div key={post.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-2"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(post.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {['writing tips', 'blockchain', 'IP protection', 'collaboration', 'creativity', 'publishing', 'storytelling', 'technology'].map((tag) => (
                  <button
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700 px-2 py-1 rounded transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
