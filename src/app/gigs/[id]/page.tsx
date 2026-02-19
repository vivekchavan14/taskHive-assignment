'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/NavBar';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const gigId = params.id as string;

  const [gig, setGig] = useState<any>(null);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [pitch, setPitch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGigPoster, setIsGigPoster] = useState(false);

  useEffect(() => {
    loadGigData();
    if (user) {
      loadMyAgents();
    }
  }, [gigId, user]);

  const loadGigData = async () => {
    try {
      // Fetch gig details
      const gigRes = await fetch(`/api/gigs?id=${gigId}`);
      if (!gigRes.ok) throw new Error('Failed to fetch gig');
      const gigData = await gigRes.json();
      
      if (gigData.success && gigData.gigs.length > 0) {
        setGig(gigData.gigs[0]);
        
        // Check if current user is the poster
        if (user) {
          // Try to fetch applications (will fail if not the poster)
          try {
            const appsRes = await fetch(`/api/applications?gigId=${gigId}`);
            if (appsRes.ok) {
              const appsData = await appsRes.json();
              if (appsData.success) {
                setApplications(appsData.applications);
                setIsGigPoster(true);
              }
            }
          } catch (e) {
            // Not the poster, that's okay
          }
        }
      }
    } catch (error) {
      console.error('Error loading gig:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyAgents = async () => {
    try {
      const res = await fetch('/api/agents?myAgents=true');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMyAgents(data.agents);
        if (data.agents.length > 0) {
          setSelectedAgent(data.agents[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !pitch.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId,
          agentId: selectedAgent,
          pitch,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Application submitted successfully!');
        setShowApplyForm(false);
        setPitch('');
        router.refresh();
      } else {
        alert(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this application?`)) return;

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadGigData(); // Reload to show updated status
      } else {
        alert(data.error || `Failed to ${action} application`);
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
      alert('Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar active="gigs" />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar active="gigs" />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Gig not found</p>
        </div>
      </div>
    );
  }

  const isUrgent = gig.deadline && new Date(gig.deadline) < new Date(Date.now() + 48 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar active="gigs" />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        {/* Back button */}
        <Link href="/gigs" className="text-green-600 hover:text-green-700 text-sm font-medium mb-6 inline-block">
          ← Back to Gigs
        </Link>

        {/* Gig Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">{gig.title}</h1>
                {isUrgent && (
                  <span className="bg-orange-50 text-orange-600 border border-orange-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Urgent
                  </span>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  gig.status === 'open' ? 'bg-green-50 text-green-600 border border-green-200' :
                  gig.status === 'assigned' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                  'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-500 text-sm">Posted {new Date(gig.createdAt).toLocaleDateString()}</p>
            </div>
            {gig.budgetUsd && (
              <div className="text-right">
                <div className="text-3xl font-extrabold text-gray-950 tracking-tight">${gig.budgetUsd}</div>
                <div className="text-gray-400 text-sm">Budget</div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6 mt-6">
            <h2 className="text-sm font-bold text-gray-950 mb-3">Description</h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{gig.description}</p>
          </div>

          {gig.skillsRequired && gig.skillsRequired.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h2 className="text-sm font-bold text-gray-950 mb-3">Skills Required</h2>
              <div className="flex flex-wrap gap-2">
                {gig.skillsRequired.map((skill: string) => (
                  <span key={skill} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {gig.deadline && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h2 className="text-sm font-bold text-gray-950 mb-2">Deadline</h2>
              <p className="text-gray-700 text-sm">{new Date(gig.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}

          {gig.startedAt && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h2 className="text-sm font-bold text-gray-950 mb-2">Timeline</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Started:</span>
                  <span>{new Date(gig.startedAt).toLocaleString()}</span>
                </div>
                {gig.completedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Completed:</span>
                    <span>{new Date(gig.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {gig.executionLogs && gig.executionLogs.trim() && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2">
              <span>📋</span> Execution Logs
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{gig.executionLogs}</pre>
            </div>
          </div>
        )}

        {gig.deliverables && gig.deliverables.trim() && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2">
              <span>✅</span> Deliverables
            </h3>
            <div className="bg-green-50 rounded-lg p-5 border border-green-200">
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{gig.deliverables}</p>
            </div>
            {isGigPoster && gig.status === 'completed' && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    if (confirm('Approve this work?')) {
                      fetch(`/api/gigs/${gigId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'approved' })
                      }).then(() => loadGigData());
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition"
                >
                  ✓ Approve Work
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Why are you disputing this work?');
                    if (reason) {
                      fetch(`/api/gigs/${gigId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'disputed', disputeReason: reason })
                      }).then(() => loadGigData());
                    }
                  }}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 px-6 py-3 rounded-xl font-semibold text-sm transition"
                >
                  ⚠ Dispute
                </button>
              </div>
            )}
          </div>
        )}

        {/* Apply Section - Show to agent owners */}
        {!isGigPoster && user && gig.status === 'open' && myAgents.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            {!showApplyForm ? (
              <button
                onClick={() => setShowApplyForm(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-green-100 transition"
              >
                Apply with Your Agent
              </button>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-950">Submit Application</h3>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Select Agent</label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {myAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} - ${agent.hourlyRate}/hr
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Pitch</label>
                  <textarea
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    required
                    rows={6}
                    placeholder="Explain why your agent is the best fit for this gig..."
                    className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-xl font-bold text-sm transition"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Applications List - Show to gig poster */}
        {isGigPoster && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-950 mb-4">
              Applications ({applications.length})
            </h3>
            
            {applications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {applications.map(({ application, agent }: any) => (
                  <div key={application.id} className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center text-lg font-black text-green-600">
                          {agent?.name?.[0] || 'A'}
                        </div>
                        <div>
                          <Link href={`/agents/${agent?.slug}`} className="font-bold text-gray-950 hover:text-green-600">
                            {agent?.name || 'Unknown Agent'}
                          </Link>
                          {agent?.hourlyRate && (
                            <p className="text-sm text-gray-500">${agent.hourlyRate}/hr</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        application.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                        application.status === 'accepted' ? 'bg-green-50 text-green-600 border border-green-200' :
                        'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">{application.pitch}</p>
                    
                    {application.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApplicationAction(application.id, 'accept')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleApplicationAction(application.id, 'reject')}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
