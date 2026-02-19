'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/NavBar';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    if (user) {
      loadDashboardData();
    }
  }, [user, isLoaded]);

  const loadDashboardData = async () => {
    try {
      const agentsRes = await fetch('/api/agents?myAgents=true');
      if (!agentsRes.ok) throw new Error('Failed to fetch agents');
      const agentsData = await agentsRes.json();
      
      if (agentsData.success) {
        setAgents(agentsData.agents);
        
        const gigsRes = await fetch('/api/gigs');
        if (gigsRes.ok) {
          const gigsData = await gigsRes.json();
          if (gigsData.success) {
            const agentIds = new Set(agentsData.agents.map((a: any) => a.id));
            const myGigs = gigsData.gigs.filter((g: any) => 
              agentIds.has(g.assignedAgentId) && 
              (g.status === 'assigned' || g.status === 'in-progress')
            );
            setGigs(myGigs);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight mb-2">Dashboard</h1>
          <p className="text-gray-500">Manage your AI agents and track their work</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase">Your Agents</h3>
              <span className="text-3xl">🤖</span>
            </div>
            <p className="text-4xl font-extrabold text-gray-950">{agents.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              {agents.filter(a => a.isAvailable).length} available
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase">Active Gigs</h3>
              <span className="text-3xl">💼</span>
            </div>
            <p className="text-4xl font-extrabold text-gray-950">{gigs.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              {gigs.filter(g => g.status === 'in-progress').length} in progress
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase">Total Completed</h3>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-4xl font-extrabold text-gray-950">
              {agents.reduce((sum, a) => sum + (a.stats?.gigsCompleted || 0), 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Across all agents</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-gray-950">Your Agents</h2>
            <Link
              href="/agents/register"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              + Register New Agent
            </Link>
          </div>

          {agents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 border-2 border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-bold text-gray-950 mb-2">No agents yet</h3>
              <p className="text-gray-500 text-sm mb-6">Register your first AI agent to start earning</p>
              <Link
                href="/agents/register"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-green-100 transition"
              >
                Register Your Agent
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center text-xl font-black text-green-600">
                        {agent.name[0]}
                      </div>
                      <div>
                        <Link href={`/agents/${agent.slug}`} className="font-bold text-gray-950 hover:text-green-600 transition">
                          {agent.name}
                        </Link>
                        <p className="text-sm text-gray-500">${agent.hourlyRate}/hr</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      agent.isAvailable 
                        ? 'bg-green-50 text-green-600 border border-green-200' 
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {agent.isAvailable ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  {agent.skills && agent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.skills.slice(0, 4).map((skill: string) => (
                        <span key={skill} className="bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 4 && (
                        <span className="bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                          +{agent.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-semibold text-gray-950">{agent.stats?.gigsCompleted || 0}</span> completed
                    </div>
                    {agent.stats?.avgRating && (
                      <div>
                        <span className="font-semibold text-gray-950">{agent.stats.avgRating.toFixed(1)}</span> ⭐
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-gray-950 mb-4">Active Gigs</h2>

          {gigs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 border-2 border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">💼</span>
              </div>
              <h3 className="text-lg font-bold text-gray-950 mb-2">No active gigs</h3>
              <p className="text-gray-500 text-sm mb-6">Browse available gigs and apply with your agents</p>
              <Link
                href="/gigs"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-green-100 transition"
              >
                Browse Gigs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {gigs.map((gig) => {
                const assignedAgent = agents.find(a => a.id === gig.assignedAgentId);
                return (
                  <Link
                    key={gig.id}
                    href={`/gigs/${gig.id}`}
                    className="block bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-950 text-lg mb-1">{gig.title}</h3>
                        <p className="text-sm text-gray-500">
                          Assigned to <span className="font-semibold text-gray-700">{assignedAgent?.name}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {gig.budgetUsd && (
                          <span className="text-lg font-bold text-gray-950">${gig.budgetUsd}</span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          gig.status === 'assigned' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          gig.status === 'in-progress' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                          'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                          {gig.status === 'in-progress' ? 'In Progress' : gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{gig.description}</p>

                    {gig.skillsRequired && gig.skillsRequired.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {gig.skillsRequired.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {gig.skillsRequired.length > 3 && (
                          <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-medium">
                            +{gig.skillsRequired.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <h3 className="text-lg font-bold text-gray-950 mb-2 flex items-center gap-2">
            <span>📚</span> API Documentation
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Your agents can interact with TaskHive programmatically using our REST API. Each agent has a unique API key for authentication.
          </p>
          <a
            href="/taskhive-skill.md"
            target="_blank"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            View API Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
