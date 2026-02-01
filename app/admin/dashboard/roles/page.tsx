"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Role {
  id: string;
  emoji: string;
  name: string;
  mission: string;
  status: string;
  responsibilities: string[];
  scheduledJobs: Array<{ id: string; time: string }>;
  output: string[];
  rules: string[];
  todo: Array<{ name: string; time?: string; priority?: string }>;
  blockers: string[];
}

interface RolesData {
  roles: Role[];
  lastUpdated?: string;
}

export default function RolesPage() {
  const [data, setData] = useState<RolesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/admin/dashboard/roles");
      if (!res.ok) throw new Error("Failed to load");
      const rolesData = await res.json();
      setData(rolesData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading roles:", error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <nav className="bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/command-center" className="text-gray-400 hover:text-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="text-lg font-bold text-blue-400">Agent Roles</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-2 text-blue-400">👥 Agent Roles & Responsibilities</h1>
        <p className="text-gray-400 mb-8">
          Multi-agent system for Flacko AI operations
        </p>

        <div className="space-y-6">
          {data?.roles && data.roles.map((role) => (
            <div key={role.id} className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{role.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{role.name}</h2>
                    <span className={`px-2 py-1 text-xs rounded ${
                      role.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                    }`}>
                      {role.status}
                    </span>
                  </div>
                  <p className="text-gray-300">{role.mission}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Responsibilities</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {role.responsibilities.map((resp, idx) => (
                      <li key={idx} className="pl-3 relative">
                        <span className="absolute left-0">•</span>
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Scheduled Jobs</h3>
                  <div className="space-y-1 text-sm">
                    {role.scheduledJobs.map((job, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-blue-400 min-w-[60px]">{job.time}</span>
                        <span className="text-gray-300">{job.id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Output Channels</h3>
                  <div className="flex flex-wrap gap-2">
                    {role.output.map((out, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                        {out}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Rules</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {role.rules.map((rule, idx) => (
                      <li key={idx} className="pl-3 relative">
                        <span className="absolute left-0">→</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {role.todo && role.todo.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">To-Do</h3>
                  <div className="space-y-2">
                    {role.todo.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          item.priority === "HIGH" ? "bg-red-500/20 text-red-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {item.priority || "NORMAL"}
                        </span>
                        <span className="text-gray-300">{item.name}</span>
                        {item.time && <span className="font-mono text-blue-400">{item.time}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {role.blockers && role.blockers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-red-400 uppercase mb-2">⚠️ Blockers</h3>
                  <ul className="space-y-1 text-sm text-red-300">
                    {role.blockers.map((blocker, idx) => (
                      <li key={idx}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {data?.lastUpdated && (
          <div className="mt-8 text-center text-xs text-gray-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
