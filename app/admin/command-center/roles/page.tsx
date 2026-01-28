"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Role {
  id: string;
  name: string;
  emoji: string;
  status: string;
  mission: string;
  responsibilities: string[];
  scheduledJobs: Array<{ id: string; time: string }>;
  output: string[];
  rules: string[];
  channels?: string[];
  sources?: {
    breakingNews?: string[];
    flowPositioning?: string[];
    technicals?: string[];
    macroSentiment?: string[];
  };
  catalystTypes?: string[];
  securityRules?: string[];
}

interface RolesData {
  lastUpdated: string;
  roles: Role[];
}

export default function RolesPage() {
  const [data, setData] = useState<RolesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/command-center/data')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white/50">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h1 className="text-xl font-semibold text-white">Employee Roles</h1>
                <p className="text-xs text-white/50">Responsibilities & Rules</p>
              </div>
            </div>
            <nav className="flex gap-2">
              <Link href="/admin" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Admin</Link>
              <Link href="/admin/command-center" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Dashboard</Link>
              <Link href="/admin/command-center/flow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Flow</Link>
              <Link href="/admin/command-center/discord" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Discord</Link>
              <Link href="/admin/command-center/roles" className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg">Roles</Link>
              <Link href="/admin/command-center/workflow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Workflow</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {data.roles.map((role) => (
          <Card key={role.id} className="bg-white/5 border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-start gap-4">
              <span className="text-4xl">{role.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">{role.name}</h2>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      role.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {role.status}
                  </Badge>
                </div>
                <p className="text-sm text-white/50 mt-1">{role.mission}</p>
              </div>
            </div>
            
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs uppercase text-white/40 tracking-wider mb-3">Responsibilities</h3>
                <ul className="space-y-2">
                  {role.responsibilities.map((r, i) => (
                    <li key={i} className="text-sm text-white/70 flex gap-2">
                      <span className="text-white/30">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xs uppercase text-white/40 tracking-wider mb-3">Scheduled Jobs</h3>
                <div className="flex flex-wrap gap-2">
                  {role.scheduledJobs.map((job, i) => (
                    <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono">
                      {job.id}
                    </span>
                  ))}
                </div>
                
                <h3 className="text-xs uppercase text-white/40 tracking-wider mb-3 mt-4">Output</h3>
                <div className="flex flex-wrap gap-2">
                  {role.output.map((o, i) => (
                    <span key={i} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      {o}
                    </span>
                  ))}
                </div>

                {role.channels && (
                  <>
                    <h3 className="text-xs uppercase text-white/40 tracking-wider mb-3 mt-4">Channels</h3>
                    <div className="flex flex-wrap gap-2">
                      {role.channels.map((c, i) => (
                        <span key={i} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <h3 className="text-xs uppercase text-white/40 tracking-wider mb-3">Rules</h3>
                <ul className="space-y-2">
                  {role.rules.map((r, i) => (
                    <li key={i} className="text-sm text-white/70 flex gap-2">
                      <span className="text-yellow-500">⚠️</span>
                      {r}
                    </li>
                  ))}
                </ul>
                
                {role.securityRules && (
                  <>
                    <h3 className="text-xs uppercase text-white/40 tracking-wider mb-3 mt-4">Security</h3>
                    <ul className="space-y-2">
                      {role.securityRules.map((r, i) => (
                        <li key={i} className="text-sm text-white/70 flex gap-2">
                          <span>🔒</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {role.sources && (
              <div className="p-5 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {role.sources.breakingNews && (
                  <div>
                    <h4 className="text-xs uppercase text-white/40 tracking-wider mb-2">Breaking News</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.sources.breakingNews.map((s, i) => (
                        <span key={i} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {role.sources.flowPositioning && (
                  <div>
                    <h4 className="text-xs uppercase text-white/40 tracking-wider mb-2">Flow</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.sources.flowPositioning.map((s, i) => (
                        <span key={i} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {role.sources.technicals && (
                  <div>
                    <h4 className="text-xs uppercase text-white/40 tracking-wider mb-2">Technicals</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.sources.technicals.slice(0, 6).map((s, i) => (
                        <span key={i} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">{s}</span>
                      ))}
                      {role.sources.technicals.length > 6 && (
                        <span className="text-xs text-white/40">+{role.sources.technicals.length - 6} more</span>
                      )}
                    </div>
                  </div>
                )}
                {role.sources.macroSentiment && (
                  <div>
                    <h4 className="text-xs uppercase text-white/40 tracking-wider mb-2">Macro</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.sources.macroSentiment.map((s, i) => (
                        <span key={i} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </main>
    </div>
  );
}
