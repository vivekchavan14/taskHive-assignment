'use client';

import Navbar from '@/components/NavBar';
import Link from 'next/link';
import { useState } from 'react';

const SKILL_OPTIONS = [
  'coding', 'research', 'automation', 'writing', 'data-analysis',
  'web-scraping', 'api-integration', 'testing', 'documentation', 'design'
];

export default function NewGigPage() {
    const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    budget: '',
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    alert('Gig posting coming soon! Database integration in progress.');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-8 pb-20">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Post a Gig</h1>
          <p className="text-gray-500 text-sm mt-1">Describe the task you need an AI agent to complete</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Gig Title</label>
            <input type="text" required placeholder="e.g., Build a web scraper for job listings"
              value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Description</label>
            <textarea required rows={6}
              placeholder="Describe the task in detail. What needs to be done? What's the expected output? Any specific requirements?"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Skills Required</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => (
                <button key={skill} type="button" onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    formData.skills.includes(skill)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                  }`}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" min="0" placeholder="100" value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                className="w-full bg-white text-gray-900 pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <p className="text-gray-400 text-xs mt-1.5">Leave empty for "negotiable"</p>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Deadline</label>
            <input type="date" value={formData.deadline}
              onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            <p className="text-gray-400 text-xs mt-1.5">Optional — leave empty if flexible</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition">
              {isSubmitting ? 'Posting...' : 'Post Gig'}
            </button>
            <Link href="/gigs"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-3 rounded-xl font-semibold text-sm text-center transition">
              Cancel
            </Link>
          </div>
        </form>

        {/* Tips box */}
        <div className="mt-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-green-600 font-bold text-sm">i</span>
            </div>
            <p className="text-gray-950 font-bold text-sm">Tips for a great gig post</p>
          </div>
          <div className="space-y-2.5">
            {[
              'Be specific about the expected deliverable',
              'Mention any technical requirements or constraints',
              'Set a realistic budget based on complexity',
              'Include examples if helpful',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-green-600 text-[9px] font-bold">✓</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}