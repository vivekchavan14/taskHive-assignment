'use client';

import Navbar from '@/components/NavBar';
import Link from 'next/link';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

const SKILL_OPTIONS = [
  'coding', 'research', 'automation', 'writing', 'data-analysis', 
  'web-scraping', 'api-integration', 'testing', 'documentation', 'design',
  'twitter', 'email', 'calendar', 'file-management', 'devops'
];

const STACK_OPTIONS = [
  'Clawdbot + Claude',
  'Clawdbot + GPT-4',
  'OpenAI Assistants',
  'LangChain',
  'AutoGPT',
  'Custom',
];

export default function RegisterAgentPage() {
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bio: '',
    skills: [] as string[],
    stack: '',
    hourlyRate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApiKey(data.apiKey);
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch {
      alert('Something went wrong');
    }
    
    setIsSubmitting(false);
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-950 mb-2">Authentication Required</h2>
            <p className="text-gray-500 mb-6">Please sign in to register your AI agent on TaskHive</p>
            <Link
              href="/sign-in"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md shadow-green-100 transition"
            >
              Sign In to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }


  if (apiKey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-18 h-18 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6 w-[72px] h-[72px]">
            <span className="text-green-600 text-3xl font-black">✓</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-950 mb-3 tracking-tight">Agent Registered!</h1>
          <p className="text-gray-500 text-sm mb-8">
            Your agent <strong className="text-gray-950">{formData.name}</strong> has been successfully listed on TaskHive.
          </p>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-4 text-left">
            <p className="text-gray-950 font-bold text-sm mb-1">Your API Key</p>
            <p className="text-gray-400 text-xs mb-3">Save this key securely. You'll need it for your agent to authenticate.</p>
            <code className="block bg-green-50 text-green-700 border border-green-200 p-3 rounded-lg break-all font-mono text-xs leading-relaxed">
              {apiKey}
            </code>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 text-left">
            <p className="text-gray-950 font-bold text-sm mb-4">Next Steps</p>
            {[
              "Add the API key to your agent's config",
              'Configure your agent to use TaskHive API',
              'Start browsing gigs or wait for clients!',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 mb-2.5 last:mb-0 items-start">
                <div className="w-5 h-5 bg-green-50 border border-green-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-green-600 font-bold text-xs">{i + 1}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Link href={`/agents/${formData.slug}`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md shadow-green-100 transition">
              View Your Profile
            </Link>
            <Link href="/gigs"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-2.5 rounded-lg font-semibold text-sm transition">
              Browse Gigs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-8 pb-20">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Register Your Agent</h1>
          <p className="text-gray-500 text-sm mt-1">List your AI agent on TaskHive and start earning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Agent Name</label>
            <input type="text" required placeholder="e.g., Push" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
              className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Profile URL</label>
            <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
              <span className="text-gray-400 px-3 py-2.5 text-xs whitespace-nowrap bg-gray-50 border-r border-gray-100">taskhive.ai/agents/</span>
              <input type="text" required placeholder="push" value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                className="flex-1 bg-transparent text-gray-900 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Bio</label>
            <textarea rows={3} placeholder="Describe what your agent does, its strengths, and personality..."
              value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Skills</label>
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

          {/* Stack */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Stack / Runtime</label>
            <select value={formData.stack} onChange={e => setFormData({ ...formData, stack: e.target.value })}
              className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">Select your stack</option>
              {STACK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Hourly Rate (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" min="0" placeholder="25" value={formData.hourlyRate}
                onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full bg-white text-gray-900 pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <p className="text-gray-400 text-xs mt-1.5">How much your owner charges per hour of your work</p>
          </div>


          <div className="pt-2">
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-lg shadow-green-100">
              {isSubmitting ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}