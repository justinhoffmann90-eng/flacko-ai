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

interface PipelineStep {
  id: string;
  name: string;
  status: string;
  timestamp: string | null;
  details: string;
  expectedTime: string;
}

interface PipelineData {
  timestamp: string;
  steps: PipelineStep[];
  summary: {
    total: number;
    complete: number;
    pending: number;
    blocked: number;
  };
  verification?: {
    reportDate: string;
    reportFile: string;
    masterEject: number;
    callWall: number;
    keyGammaStrike: number;
    hedgeWall: number;
    levelCount: number;
    lastUpdated: string;
    source: string;
  };
}

interface WorkflowExecution {
  lastCompleted: string | null;
  status?: string;
  fileCount?: number;
  latestFile?: string;
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
  workflows?: {
    tradingCapture?: WorkflowExecution;
    morningBrief?: WorkflowExecution;
    reportUpload?: WorkflowExecution;
    keyLevelsUpdate?: WorkflowExecution;
    eodWrap?: WorkflowExecution;
  };
}

export default function CommandCenterPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [dataRes, pipelineRes] = await Promise.all([
        fetch('/api/command-center/data'),
        fetch('/api/command-center/pipeline')
      ]);
      const dataJson = await dataRes.json();
      const pipelineJson = await pipelineRes.json();
      setData(dataJson);
      setPipeline(pipelineJson);
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
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h1 className="text-xl font-semibold text-white">Command Center</h1>
                <p className="text-xs text-white/50">Clawd Operations Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="flex gap-2 mr-4">
                <Link href="/admin" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Admin</Link>
                <Link href="/admin/command-center" className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg">Dashboard</Link>
                <Link href="/admin/command-center/flow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Flow</Link>
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

        {/* Workflow Execution Status */}
        {data.workflows && (
          <div>
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">⏱️ Workflow Execution Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Trading Capture */}
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📸</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Trading Capture</div>
                    <div className="text-xs text-white/40">Expected: 3:00p CT</div>
                  </div>
                  {data.workflows.tradingCapture ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                {data.workflows.tradingCapture ? (
                  <>
                    <div className="text-xs text-white/50">Last completed:</div>
                    <div className="text-sm text-green-400 font-medium">
                      {new Date(data.workflows.tradingCapture.lastCompleted!).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    {data.workflows.tradingCapture.fileCount && (
                      <div className="text-xs text-white/40 mt-1">
                        {data.workflows.tradingCapture.fileCount} files captured
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-yellow-400">Pending today</div>
                )}
              </Card>

              {/* Morning Brief */}
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🌅</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Morning Brief</div>
                    <div className="text-xs text-white/40">Expected: 8:00a CT</div>
                  </div>
                  {data.workflows.morningBrief ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                {data.workflows.morningBrief ? (
                  <>
                    <div className="text-xs text-white/50">Status:</div>
                    <div className="text-sm text-green-400 font-medium">Completed</div>
                  </>
                ) : (
                  <div className="text-xs text-yellow-400">Pending today</div>
                )}
              </Card>

              {/* Report Upload */}
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Report Upload</div>
                    <div className="text-xs text-white/40">After Claude generates</div>
                  </div>
                  {data.workflows.reportUpload ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                {data.workflows.reportUpload ? (
                  <>
                    <div className="text-xs text-white/50">Last completed:</div>
                    <div className="text-sm text-green-400 font-medium">
                      {new Date(data.workflows.reportUpload.lastCompleted!).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-yellow-400">Pending</div>
                )}
              </Card>

              {/* Key Levels Update */}
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔑</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Key Levels Update</div>
                    <div className="text-xs text-white/40">After report upload</div>
                  </div>
                  {data.workflows.keyLevelsUpdate ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                {data.workflows.keyLevelsUpdate ? (
                  <>
                    <div className="text-xs text-white/50">Last completed:</div>
                    <div className="text-sm text-green-400 font-medium">
                      {new Date(data.workflows.keyLevelsUpdate.lastCompleted!).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-yellow-400">Pending</div>
                )}
              </Card>

              {/* EOD Wrap */}
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">EOD Wrap</div>
                    <div className="text-xs text-white/40">Expected: 8:00p CT</div>
                  </div>
                  {data.workflows.eodWrap ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                {data.workflows.eodWrap ? (
                  <>
                    <div className="text-xs text-white/50">Status:</div>
                    <div className="text-sm text-green-400 font-medium">Completed</div>
                  </>
                ) : (
                  <div className="text-xs text-yellow-400">Pending today</div>
                )}
              </Card>

              {/* Price Monitor */}
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🚨</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Price Monitor</div>
                    <div className="text-xs text-white/40">Every 1 min</div>
                  </div>
                  {pipeline?.steps?.[3]?.status === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                {pipeline?.steps?.[3] && (
                  <>
                    <div className="text-xs text-white/50">Last check:</div>
                    <div className="text-sm text-green-400 font-medium">
                      {pipeline.steps[3].timestamp && new Date(pipeline.steps[3].timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {pipeline.steps[3].details}
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Current Report & Key Levels Verification */}
        {pipeline?.verification && (
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                🔍 Current Report & Key Levels
              </h2>
              <Badge 
                className={`${
                  pipeline.verification.reportDate === new Date().toISOString().split('T')[0] ||
                  pipeline.verification.reportDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}
              >
                Report: {pipeline.verification.reportDate}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Info */}
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Latest Report File</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">File:</span>
                    <span className="text-sm text-white font-mono">{pipeline.verification.reportFile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Date:</span>
                    <span className="text-sm text-white">{pipeline.verification.reportDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Updated:</span>
                    <span className="text-sm text-white/70">
                      {new Date(pipeline.verification.lastUpdated).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Levels:</span>
                    <span className="text-sm text-white">{pipeline.verification.levelCount} configured</span>
                  </div>
                </div>
              </div>

              {/* Key Levels */}
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Key Price Levels</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 mb-1">Master Eject</div>
                    <div className="text-2xl font-bold text-red-400">${pipeline.verification.masterEject}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 mb-1">Call Wall</div>
                    <div className="text-2xl font-bold text-green-400">${pipeline.verification.callWall}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 mb-1">Key Gamma Strike</div>
                    <div className="text-2xl font-bold text-blue-400">${pipeline.verification.keyGammaStrike}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/50 mb-1">Hedge Wall</div>
                    <div className="text-2xl font-bold text-yellow-400">${pipeline.verification.hedgeWall}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-white/40">
                Source: {pipeline.verification.source}
              </div>
            </div>
          </Card>
        )}

        {/* Daily Report Pipeline */}
        {pipeline && (
          <div>
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              📊 Daily Report Pipeline
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  pipeline.summary.blocked > 0 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : pipeline.summary.complete === pipeline.summary.total
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}
              >
                {pipeline.summary.complete}/{pipeline.summary.total} Complete
              </Badge>
            </h2>
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <div className="divide-y divide-white/10">
                {pipeline.steps.map((step, i) => {
                  let statusIcon = <Clock className="h-5 w-5 text-yellow-400" />;
                  let statusColor = "text-yellow-400";
                  
                  if (step.status === "complete") {
                    statusIcon = <CheckCircle2 className="h-5 w-5 text-green-400" />;
                    statusColor = "text-green-400";
                  } else if (step.status === "incomplete" || step.status === "stale" || step.status === "out-of-sync" || step.status === "blocked") {
                    statusIcon = <AlertCircle className="h-5 w-5 text-red-400" />;
                    statusColor = "text-red-400";
                  }

                  return (
                    <div key={step.id} className="p-4 flex items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">{i === 0 ? '📸' : i === 1 ? '📝' : i === 2 ? '🔑' : i === 3 ? '🚨' : '✅'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{step.name}</span>
                            {statusIcon}
                          </div>
                          <div className="text-xs text-white/50">{step.details}</div>
                          {step.timestamp && (
                            <div className="text-xs text-white/30 mt-1">
                              {new Date(step.timestamp).toLocaleString([], { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${statusColor} uppercase`}>
                          {step.status === "out-of-sync" ? "Out of Sync" : step.status}
                        </div>
                        <div className="text-xs text-white/40 mt-1">{step.expectedTime}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
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
