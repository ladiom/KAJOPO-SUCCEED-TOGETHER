'use client';

import { categories } from '@/data/categories';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'seeker' | 'provider' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Kájọpọ̀</h1>
              <span className="ml-3 text-sm text-gray-600 italic">Succeed Together</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/signin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Connect. Impact. <span className="text-blue-600">Succeed Together.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Kájọpọ̀ bridges the gap between those seeking opportunities and those providing them across 11 key impact areas. 
            Whether you're looking for support or ready to make a difference, find your perfect match here.
          </p>
          
          {/* Role Selection */}
          <div className="flex justify-center space-x-6 mb-12">
            <button
              onClick={() => setUserRole('seeker')}
              className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                userRole === 'seeker'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300'
              }`}
            >
              🔍 I'm Seeking Opportunities
            </button>
            <button
              onClick={() => setUserRole('provider')}
              className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                userRole === 'provider'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300'
              }`}
            >
              🤝 I'm Providing Opportunities
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Explore Impact Categories
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                
                {selectedCategory === category.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Subcategories:</h5>
                    <div className="space-y-1">
                      {category.subcategories.map((sub) => (
                        <div key={sub.id} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          {sub.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Make an Impact?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of changemakers connecting across Africa and beyond.
          </p>
          <Link href="/auth/signup" className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors inline-block">
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Kájọpọ̀</h4>
              <p className="text-gray-400 text-sm">
                Connecting opportunity seekers with providers across Africa for sustainable impact.
              </p>
            </div>
            <div>
              <h5 className="font-medium mb-3">For Seekers</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Find Opportunities</li>
                <li>Build Profile</li>
                <li>Get Matched</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-3">For Providers</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Post Opportunities</li>
                <li>Find Candidates</li>
                <li>Track Impact</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-3">Support</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Kájọpọ̀. All rights reserved. Built with ❤️ for social impact.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
