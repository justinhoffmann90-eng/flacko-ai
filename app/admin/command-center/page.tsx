"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  MessageSquare,
  Radio,
  RefreshCw
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  emoji: string;
  status: string;
  mission: string;
  todo: Array<{ name: string; time?: string; priority?: string }>;
  blockers: Array<{ name: string }>;
  scheduledJobs: Array<{ id: string; time: string }>;
}

interface VerificationData {
  report: {
    filename: string;
    date: string;
    modified: number;
  };
  keyLevels: {
    exists: boolean;
    modified: number;
    data: {
      reportDate: string;
      levels: Array<{
        price: number;
        level: string;
        emoji: string;
        action: string;
      }>;
      quickReference: {
        masterEject: number;
        callWall: number;
        keyGammaStrike: number;
        hedgeWall: number;
      };
      source: string;
      lastUpdated: string;
    };
  };
  timestamp: number;
}

interface DashboardData {
  lastUpdated: string;
  roles: Role[];
  stats: {
    scheduled: number;
    completed: number;
    inProgress: number;
    blockers: number;
  };
  activity: Array<{ type: string; message: string; time: string }>;
}

export default function CommandCenterPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [dataRes, verifyRes] = await Promise.all([
        fetch('/api/command-center/data'),
        fetch('/api/command-center/verification')
      ]);
      const dataJson = await dataRes.json();
      const verifyJson = await verifyRes.json();
      setData(dataJson);
      setVerification(verifyJson);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white/50">Loading Command Center...</div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    "trading-analyst": "text-blue-400",
    "content-creator": "text-purple-400",
    "community-manager": "text-green-400",
    "ops": "text-orange-400",
    "research-analyst": "text-pink-400"
  };

  // Aggregate all jobs and sort by time
  const allJobs = data.roles
    .flatMap(r => r.scheduledJobs.map(j => ({ ...j, role: r.id })))
    .sort((a, b) => parseTime(a.time) - parseTime(b.time));

  function parseTime(timeStr: string): number {
    if (!timeStr) return 9999;
    const match = timeStr.match(/(\d+):?(\d*)([ap])?/i);
    if (!match) return 9999;
    let hour = parseInt(match[1]);
    const min = parseInt(match[2]) || 0;
    const ampm = (match[3] || 'a').toLowerCase();
    if (ampm === 'p' && hour !== 12) hour += 12;
    if (ampm === 'a' && hour === 12) hour = 0;
    return hour * 60 + min;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-white/60 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h1 className="text-xl font-semibold text-white">Mission Control</h1>
                  <p className="text-xs text-white/50">Clawd Operations Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="flex gap-2 mr-4">
                <Link href="/admin/command-center" className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg">Dashboard</Link>
                <Link href="/admin/command-center/roles" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Roles</Link>
                <Link href="/admin/command-center/workflow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Workflow</Link>
              </nav>
              <button 
                onClick={fetchData}
                className="flex items-center gap-2 text-white/60 hover:text-white text-sm"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10 p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{data.stats.scheduled}</div>
            <div className="text-xs text-white/50 uppercase mt-1">Scheduled</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{data.stats.completed}</div>
            <div className="text-xs text-white/50 uppercase mt-1">Completed</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{data.stats.inProgress}</div>
            <div className="text-xs text-white/50 uppercase mt-1">In Progress</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{data.stats.blockers}</div>
            <div className="text-xs text-white/50 uppercase mt-1">Blockers</div>
          </Card>
        </div>

        {/* Data Verification Panel */}
        {verification && (
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">🔍 Data Verification</h2>
              <Badge 
                variant="outline" 
                className={`${
                  verification.report.date === verification.keyLevels.data.reportDate
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}
              >
                {verification.report.date === verification.keyLevels.data.reportDate ? '✅ Synced' : '⚠️ Out of sync'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Latest Report */}
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Latest Daily Report</div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-white/50">File:</span>
                    <span className="text-white/80">{verification.report.filename}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/50">Date:</span>
                    <span className="text-white/80">{verification.report.date}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/50">Modified:</span>
                    <span className="text-white/80">{new Date(verification.report.modified * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Key Levels Config */}
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Key Levels Config</div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-white/50">Source:</span>
                    <span className="text-white/80 text-xs">{verification.keyLevels.data.source}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/50">Updated:</span>
                    <span className="text-white/80">{new Date(verification.keyLevels.modified * 1000).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/50">Master Eject:</span>
                    <span className="text-red-400 font-semibold">${verification.keyLevels.data.quickReference.masterEject}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Levels Table */}
            <div className="pt-6 border-t border-white/10">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Active Alert Levels</div>
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 max-h-80 overflow-y-auto text-sm">
                {verification.keyLevels.data.levels.map((level, i) => {
                  let priceColor = 'text-blue-400';
                  if (level.price === verification.keyLevels.data.quickReference.masterEject) {
                    priceColor = 'text-red-400';
                  } else if (level.emoji === '🎯') {
                    priceColor = 'text-green-400';
                  } else if (level.emoji === '⚠️') {
                    priceColor = 'text-yellow-400';
                  }

                  return (
                    <div key={i} className="contents">
                      <div className={`${priceColor} font-semibold font-mono`}>${level.price}</div>
                      <div className="text-white/70">{level.emoji} {level.level}</div>
                      <div className="text-white/40 text-xs text-right">{level.action}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* The Desk */}
        <div>
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">👥 The Desk</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.roles.map((role) => (
              <Card key={role.id} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{role.emoji}</span>
                  <span className="font-medium text-white text-sm">{role.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] ml-auto ${
                      role.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {role.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase">To Do</div>
                  {role.todo.length > 0 ? (
                    <div className="space-y-1">
                      {role.todo.map((item, i) => (
                        <div key={i} className="text-xs bg-white/5 rounded px-2 py-1 flex items-center gap-2">
                          {item.time && <span className="text-blue-400 font-mono">{item.time}</span>}
                          <span className="text-white/70">{item.name}</span>
                          {item.priority && (
                            <span className="text-red-400 text-[10px] ml-auto">{item.priority}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/30">No items</div>
                  )}
                  
                  <div className="text-xs text-white/40 uppercase pt-2">Blockers</div>
                  {role.blockers.length > 0 ? (
                    <div className="space-y-1">
                      {role.blockers.map((item, i) => (
                        <div key={i} className="text-xs bg-red-500/10 border-l-2 border-red-500 rounded px-2 py-1 text-white/70">
                          {item.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/30">None</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheduled Jobs */}
          <div>
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">
              ⏰ Scheduled Jobs <span className="text-blue-400">({allJobs.length})</span>
            </h2>
            <Card className="bg-white/5 border-white/10 overflow-hidden max-h-80 overflow-y-auto">
              <div className="divide-y divide-white/10">
                {allJobs.map((job, i) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-white/40" />
                      <span className="text-sm text-white">{job.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-white/60 font-mono">{job.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Activity + Quick Links */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">📜 Recent Activity</h2>
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="space-y-3">
                  {data.activity.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`mt-0.5 ${item.type === 'success' ? 'text-green-400' : item.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
                        {item.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : 
                         item.type === 'error' ? <AlertCircle className="h-4 w-4" /> : 
                         <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{item.message}</div>
                        <div className="text-xs text-white/30">
                          {new Date(item.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/admin/reports">
                  <Card className="bg-white/5 border-white/10 p-3 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-white/80">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm">Upload Report</span>
                    </div>
                  </Card>
                </Link>
                <Link href="/catalysts">
                  <Card className="bg-white/5 border-white/10 p-3 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-white/80">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Catalysts</span>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
