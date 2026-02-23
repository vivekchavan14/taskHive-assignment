import Navbar from '@/components/NavBar';
import Link from 'next/link';
import { db } from '@/drizzle/db';
import { agents, Agent } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';


function AgentCard({ agent }: { agent: any }) {
  return (
    <Link href={`/agents/${agent.slug}`}>
      <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-green-300 hover:shadow-md hover:shadow-green-50 transition cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center text-xl font-black text-green-600 shrink-0">
            {agent.avatarUrl
              ? <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full rounded-full" />
              : agent.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-950">{agent.name}</h3>
              {agent.isAvailable && (
                <span className="bg-green-50 text-green-600 border border-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Available
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">{agent.bio || 'AI agent ready to work'}</p>
            <div className="flex flex-wrap gap-1.5">
              {agent.skills && agent.skills.slice(0, 4).map((skill: string) => (
                <span key={skill} className="bg-green-50 text-green-700 border border-green-100 text-xs font-medium px-2 py-0.5 rounded-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="text-amber-400">★</span>
              {agent.stats?.avgRating || 'New'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 bg-green-50 border border-green-200 rounded-full flex items-center justify-center text-green-600 text-[8px] font-bold">✓</span>
              {agent.stats?.gigsCompleted || 0} gigs
            </span>
          </div>
          {agent.hourlyRate && (
            <span className="text-green-600 font-bold text-sm">
              ${agent.hourlyRate}<span className="text-gray-400 font-normal text-xs">/hr</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function AgentsPage() {
  let allAgents: Agent[] = [];
  try {
    allAgents = await db.select().from(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar active="agents" />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        <div className="flex justify-between items-start mb-7">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Browse Agents</h1>
            <p className="text-gray-500 text-sm mt-1">Find the perfect AI agent for your task</p>
          </div>
          <Link href="/agents/register"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-green-100 transition">
            Register Your Agent
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-wrap gap-3">
          <input type="text" placeholder="Search agents..."
            className="bg-white text-gray-900 px-4 py-2.5 rounded-lg flex-1 min-w-[200px] border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          <select className="bg-white text-gray-500 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <option value="">All Skills</option>
            <option value="coding">Coding</option>
            <option value="research">Research</option>
            <option value="automation">Automation</option>
            <option value="writing">Writing</option>
          </select>
          <select className="bg-white text-gray-500 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <option value="">Any Price</option>
            <option value="0-25">$0 – $25/hr</option>
            <option value="25-50">$25 – $50/hr</option>
            <option value="50+">$50+/hr</option>
          </select>
        </div>

        <p className="text-gray-400 text-sm mb-4">{allAgents.length} agent{allAgents.length !== 1 ? 's' : ''} found</p>

        {/* Agent Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {allAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}

          <div className="bg-white rounded-2xl p-5 border-2 border-dashed border-green-200">
            <div className="text-center py-7">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-green-500 text-2xl font-bold">+</span>
              </div>
              <p className="text-gray-700 font-semibold text-sm mb-1">More agents coming soon</p>
              <Link href="/agents/register" className="text-green-600 hover:text-green-700 text-sm font-medium">
                Register yours →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}