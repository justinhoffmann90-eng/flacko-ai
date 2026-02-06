"use client";

import { useState, useEffect, useCallback } from "react";

// Types
interface Task {
  id: number;
  text: string;
  engine: string;
  impacts: string[];
  slot: string | null;
  customPoints?: number;
  isCore?: boolean;
  coreId?: string;
  pinned?: boolean;
}

interface CoreTask {
  id: string;
  icon: string;
  label: string;
  desc: string;
  engine: string;
}

interface GameData {
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
}

interface TodayStats {
  completed: number;
  impactPoints: number;
  xpEarned: number;
}

interface HistoryEntry {
  date: string;
  tasks: Task[];
  score: number;
  journal: string;
}

interface Idea {
  id: number;
  category: string;
  series: string;
  angle: string;
  trigger: string;
  difficulty: string;
  pinned?: boolean;
}

// Constants
const limits = { backlog: Infinity, today: 10, progress: 2, complete: Infinity };
const impactLabels: Record<string, string> = { revenue: "💰", growth: "📈", product: "🧠", automation: "⚙️", reliability: "🛡️" };
const impactPointsMap: Record<string, number> = { revenue: 30, growth: 25, product: 20, automation: 15, reliability: 10 };
const engineLabels: Record<string, string> = { product: "🤖 Product", systems: "⚙️ Systems", growth: "📈 Growth" };

const levels = [
  { level: 1, xp: 0, title: "Rookie" },
  { level: 2, xp: 100, title: "Operator" },
  { level: 3, xp: 300, title: "Commander" },
  { level: 4, xp: 600, title: "Elite" },
  { level: 5, xp: 1000, title: "Master" },
  { level: 6, xp: 1500, title: "Legend" },
  { level: 7, xp: 2200, title: "Mythic" },
  { level: 8, xp: 3000, title: "Transcendent" },
];

const defaultCoreTasks: CoreTask[] = [
  { id: "core-1", icon: "🥇", label: "Product Delivery", desc: "Ship or validate daily intelligence output", engine: "product" },
  { id: "core-2", icon: "🥈", label: "Growth & Authority", desc: "Publish one high-value public insight", engine: "growth" },
  { id: "core-3", icon: "🥉", label: "System/Product Improvement", desc: "Improve one piece of infrastructure or product", engine: "systems" },
];

const ideaCategories: Record<string, string> = {
  all: "🎯 All",
  daily: "📊 Daily",
  educational: "🧠 Educational",
  analysis: "📉 Analysis",
  psychology: "🎯 Psychology",
  proof: "🧪 Proof",
  culture: "🔥 Culture",
  weekly: "📆 Weekly",
};

const defaultIdeas: Idea[] = [
  { id: 1, category: "daily", series: "Level Watch", angle: "Post when TSLA approaches key levels - why this level matters, dealer flow, bull vs bear scenario", trigger: "TSLA near key level", difficulty: "easy" },
  { id: 2, category: "daily", series: "Mode Check", angle: "Daily quick post: current market mode + what behavior usually follows", trigger: "Daily", difficulty: "easy" },
  { id: 3, category: "daily", series: "Battle Plan Snapshot", angle: "Ultra simple: bullish scenario, bearish scenario, invalidation levels", trigger: "Pre-market or open", difficulty: "easy" },
  { id: 4, category: "educational", series: "Indicator Breakdown", angle: "Explain one indicator: what it measures, when it works best, common mistakes", trigger: "Anytime", difficulty: "medium" },
  { id: 5, category: "educational", series: "Dealer Flow Simplified", angle: "Explain one SpotGamma concept in plain language (put walls, call walls, gamma flips)", trigger: "Anytime", difficulty: "medium" },
  { id: 6, category: "educational", series: "How Flacko Reads Charts", angle: "Walk through your thinking process on a chart", trigger: "Interesting setup", difficulty: "medium" },
  { id: 7, category: "analysis", series: "After Action Report", angle: "After big TSLA moves: what happened, which signals warned, what was unexpected", trigger: "After big move", difficulty: "easy" },
  { id: 8, category: "analysis", series: "Scenario Review", angle: "Compare predicted scenarios vs actual outcome", trigger: "End of week", difficulty: "easy" },
  { id: 9, category: "psychology", series: "Mistake Most TSLA Traders Make", angle: "Simple contrarian insight about common trading errors", trigger: "Anytime", difficulty: "easy" },
  { id: 10, category: "psychology", series: "When NOT to Trade", angle: "Risk discipline content - knowing when to sit out", trigger: "Choppy/unclear market", difficulty: "easy" },
  { id: 11, category: "psychology", series: "Position Management", angle: "How we manage around a core TSLA position - your unique philosophy", trigger: "Anytime", difficulty: "medium" },
  { id: 12, category: "proof", series: "Report Snippet", angle: "Post excerpt from daily report showing quality", trigger: "After report published", difficulty: "easy" },
  { id: 13, category: "proof", series: "Historical Call Review", angle: "Show past level or scenario that played out", trigger: "Level hits or scenario plays", difficulty: "easy" },
  { id: 14, category: "proof", series: "Accuracy Scoreboard", angle: "Track wins + misses openly for credibility", trigger: "Weekly", difficulty: "medium" },
  { id: 15, category: "culture", series: "Trenches Commentary", angle: "React to market chaos humorously", trigger: "Volatile day", difficulty: "easy" },
  { id: 16, category: "culture", series: "Trader Archetype Roast", angle: "Roast breakout chasers, overleveraged bulls, panic sellers", trigger: "Anytime", difficulty: "easy" },
  { id: 17, category: "culture", series: "War Room Update", angle: "Light storytelling style market commentary", trigger: "Interesting market day", difficulty: "easy" },
  { id: 18, category: "weekly", series: "Week Ahead Map", angle: "Key levels + macro catalysts for the week", trigger: "Sunday/Monday", difficulty: "medium" },
  { id: 19, category: "weekly", series: "What Mattered This Week", angle: "Dealer flow / structural changes recap", trigger: "Friday", difficulty: "medium" },
  { id: 20, category: "weekly", series: "One Lesson From This Week", angle: "Educational + reflective insight from price action", trigger: "Weekend", difficulty: "easy" },
];

const defaultBacklog: Task[] = [
  { id: 101, text: "Create \"Flacko OS explained\" flagship thread", engine: "growth", impacts: ["growth", "revenue"], slot: null },
  { id: 102, text: "Build repeatable daily post template system", engine: "growth", impacts: ["growth", "automation"], slot: null },
  { id: 103, text: "Create library of educational dealer flow posts", engine: "growth", impacts: ["growth", "product"], slot: null },
  { id: 104, text: "Create monthly \"TSLA structural playbook\" content series", engine: "growth", impacts: ["growth", "revenue"], slot: null },
  { id: 105, text: "Build case study posts using past successful calls", engine: "growth", impacts: ["growth", "revenue"], slot: null },
  { id: 201, text: "Improve scenario decision tree clarity", engine: "product", impacts: ["product"], slot: null },
  { id: 202, text: "Improve \"mode before move\" definitions", engine: "product", impacts: ["product"], slot: null },
  { id: 301, text: "Add alert monitoring dashboard", engine: "systems", impacts: ["reliability", "automation"], slot: null },
  { id: 302, text: "Create automation failure logging system", engine: "systems", impacts: ["reliability", "automation"], slot: null },
];

export default function ProductivityPage() {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<"kanban" | "history">("kanban");
  const [tasks, setTasks] = useState<{ backlog: Task[]; today: Task[]; progress: Task[]; complete: Task[] }>({
    backlog: [],
    today: [],
    progress: [],
    complete: [],
  });
  const [coreTasks] = useState<CoreTask[]>(defaultCoreTasks);
  const [coreTasksPlaced, setCoreTasksPlaced] = useState<Record<string, string>>({});
  const [gameData, setGameData] = useState<GameData>({ xp: 0, level: 1, streak: 0, bestStreak: 0, lastActiveDate: null });
  const [todayStats, setTodayStats] = useState<TodayStats>({ completed: 0, impactPoints: 0, xpEarned: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyRange, setHistoryRange] = useState<"week" | "month" | "all">("week");
  const [backlogCollapsed, setBacklogCollapsed] = useState(false);
  const [dailyNotes, setDailyNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaCategory, setSelectedIdeaCategory] = useState("all");

  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState<string>("backlog");
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("morning");
  const [taskInput, setTaskInput] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [journalInput, setJournalInput] = useState("");
  const [ideaCategoryInput, setIdeaCategoryInput] = useState("daily");
  const [ideaSeriesInput, setIdeaSeriesInput] = useState("");
  const [ideaAngleInput, setIdeaAngleInput] = useState("");
  const [ideaTriggerInput, setIdeaTriggerInput] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");

  // Drag state
  const [draggedTask, setDraggedTask] = useState<number | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<string | null>(null);
  const [draggedCoreId, setDraggedCoreId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Helper to get date in Central Time (America/Chicago)
  const getCentralDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  };
  const today = getCentralDate();

  // Storage keys
  const storageKeys = {
    tasks: "flacko-kanban-v4",
    game: "flacko-game-v4",
    history: "flacko-history-v4",
    todayStats: `flacko-stats-${today}`,
    journal: `flacko-journal-${today}`,
    corePlaced: `flacko-core-v4-${today}`,
    notes: `flacko-notes-${today}`,
    backlogCollapsed: "flacko-backlog-collapsed",
    ideas: "flacko-ideas-v1",
    lastRefreshDate: "flacko-last-refresh-v1",
  };

  // Load data on mount
  useEffect(() => {
    setMounted(true);
    
    // Load tasks
    let loadedTasks = { backlog: defaultBacklog, today: [], progress: [], complete: [] };
    const savedTasks = localStorage.getItem(storageKeys.tasks);
    if (savedTasks) {
      try {
        loadedTasks = JSON.parse(savedTasks);
        setTasks(loadedTasks);
      } catch {
        setTasks(loadedTasks);
      }
    } else {
      setTasks(loadedTasks);
    }

    // Daily Board Refresh: Check if we need to archive completed tasks from previous day
    const lastRefreshDate = localStorage.getItem(storageKeys.lastRefreshDate);
    if (lastRefreshDate && lastRefreshDate !== today && loadedTasks.complete.length > 0) {
      // It's a new day and there are completed tasks to archive
      const completedTasks = loadedTasks.complete;
      
      // Add completed tasks to history under the previous day's date
      setHistory((prev) => {
        const existingEntry = prev.find((h) => h.date === lastRefreshDate);
        let newHistory;
        if (existingEntry) {
          // Append to existing entry for that date
          newHistory = prev.map((h) =>
            h.date === lastRefreshDate
              ? { ...h, tasks: [...h.tasks, ...completedTasks] }
              : h
          );
        } else {
          // Create new history entry for the previous day
          const newEntry: HistoryEntry = {
            date: lastRefreshDate,
            tasks: completedTasks,
            score: completedTasks.length * 50, // Approximate score
            journal: "",
          };
          newHistory = [newEntry, ...prev];
        }
        localStorage.setItem(storageKeys.history, JSON.stringify(newHistory));
        return newHistory;
      });

      // Clear completed tasks
      loadedTasks.complete = [];
      setTasks({ ...loadedTasks });
      localStorage.setItem(storageKeys.tasks, JSON.stringify({ ...loadedTasks }));

      // Reset todayStats for the new day
      const resetStats: TodayStats = { completed: 0, impactPoints: 0, xpEarned: 0 };
      setTodayStats(resetStats);
      localStorage.setItem(storageKeys.todayStats, JSON.stringify(resetStats));
    }

    // Update last refresh date to today
    localStorage.setItem(storageKeys.lastRefreshDate, today);

    // Load core tasks placement
    const savedCorePlaced = localStorage.getItem(storageKeys.corePlaced);
    if (savedCorePlaced) {
      try {
        setCoreTasksPlaced(JSON.parse(savedCorePlaced));
      } catch {}
    }

    // Load game data
    const savedGame = localStorage.getItem(storageKeys.game);
    if (savedGame) {
      try {
        const data = JSON.parse(savedGame);
        // Update streak
        if (data.lastActiveDate) {
          const diff = Math.floor((new Date(today).getTime() - new Date(data.lastActiveDate).getTime()) / 86400000);
          if (diff === 1) {
            data.streak++;
            if (data.streak > data.bestStreak) data.bestStreak = data.streak;
          } else if (diff > 1) {
            data.streak = 1;
          }
        } else {
          data.streak = 1;
        }
        data.lastActiveDate = today;
        setGameData(data);
        localStorage.setItem(storageKeys.game, JSON.stringify(data));
      } catch {}
    }

    // Load history
    const savedHistory = localStorage.getItem(storageKeys.history);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {}
    }

    // Load today stats
    const savedStats = localStorage.getItem(storageKeys.todayStats);
    if (savedStats) {
      try {
        setTodayStats(JSON.parse(savedStats));
      } catch {}
    }

    // Load backlog collapsed state
    setBacklogCollapsed(localStorage.getItem(storageKeys.backlogCollapsed) === "true");

    // Load notes
    const savedNotes = localStorage.getItem(storageKeys.notes);
    if (savedNotes) setDailyNotes(savedNotes);

    // Load ideas
    const savedIdeas = localStorage.getItem(storageKeys.ideas);
    if (savedIdeas) {
      try {
        setIdeas(JSON.parse(savedIdeas));
      } catch {
        setIdeas(defaultIdeas);
      }
    } else {
      setIdeas(defaultIdeas);
    }
  }, []);

  // Save tasks when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks));
    }
  }, [tasks, mounted]);

  // Save core placement
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKeys.corePlaced, JSON.stringify(coreTasksPlaced));
    }
  }, [coreTasksPlaced, mounted]);

  // Save ideas
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKeys.ideas, JSON.stringify(ideas));
    }
  }, [ideas, mounted]);

  // Save notes with debounce
  useEffect(() => {
    if (!mounted) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(storageKeys.notes, dailyNotes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 1500);
    }, 500);
    return () => clearTimeout(timeout);
  }, [dailyNotes, mounted]);

  // Calculate task points
  const calcTaskPoints = (task: Task) => {
    let pts = 10;
    task.impacts.forEach((imp) => (pts += impactPointsMap[imp] || 0));
    return task.customPoints || pts;
  };

  // Add XP
  const addXP = useCallback((amount: number) => {
    setGameData((prev) => {
      let newData = { ...prev, xp: prev.xp + amount };
      for (let i = levels.length - 1; i >= 0; i--) {
        if (newData.xp >= levels[i].xp) {
          if (prev.level < levels[i].level) {
            newData.level = levels[i].level;
            alert(`🎉 Level Up! Level ${levels[i].level} - ${levels[i].title}!`);
          }
          break;
        }
      }
      localStorage.setItem(storageKeys.game, JSON.stringify(newData));
      return newData;
    });
    setTodayStats((prev) => {
      const newStats = { ...prev, xpEarned: prev.xpEarned + amount };
      localStorage.setItem(storageKeys.todayStats, JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  // Get level info
  const getCurrentLevel = () => levels.find((l) => l.level === gameData.level) || levels[0];
  const getNextLevel = () => levels.find((l) => l.level === gameData.level + 1);
  const getXpProgress = () => {
    const curr = getCurrentLevel();
    const next = getNextLevel();
    if (!next) return 100;
    return ((gameData.xp - curr.xp) / (next.xp - curr.xp)) * 100;
  };

  // Handle drag start for regular tasks
  const handleTaskDragStart = (taskId: number, column: string, slot: string | null) => {
    setDraggedTask(taskId);
    setDraggedFrom(column);
    setDraggedSlot(slot);
    setDraggedCoreId(null);
  };

  // Handle drag start for core tasks
  const handleCoreDragStart = (coreId: string) => {
    setDraggedCoreId(coreId);
    setDraggedTask(null);
    setDraggedFrom("core");
    setDraggedSlot(null);
  };

  // Handle drop on column/slot
  const handleDrop = (targetCol: string, targetSlot: string | null) => {
    setDragOverTarget(null);

    // Handle core task drop
    if (draggedCoreId && targetCol === "today" && targetSlot) {
      const coreTask = coreTasks.find((ct) => ct.id === draggedCoreId);
      if (coreTask && !coreTasksPlaced[draggedCoreId]) {
        if (tasks.today.length >= 10) {
          alert("Today is at capacity (10 max)!");
          return;
        }
        const newTask: Task = {
          id: Date.now(),
          text: `${coreTask.icon} ${coreTask.label}: ${coreTask.desc}`,
          engine: coreTask.engine,
          impacts: [],
          slot: targetSlot,
          isCore: true,
          coreId: draggedCoreId,
          customPoints: 50,
        };
        setTasks((prev) => ({ ...prev, today: [...prev.today, newTask] }));
        setCoreTasksPlaced((prev) => ({ ...prev, [draggedCoreId]: targetSlot }));
      }
      resetDragState();
      return;
    }

    if (!draggedTask || !draggedFrom) return;
    if (draggedFrom === targetCol && draggedSlot === targetSlot) return;

    // Check limits
    if (targetCol === "today" && draggedFrom !== "today" && tasks.today.length >= 10) {
      alert("Today is at capacity (10 max)!");
      return;
    }
    if (targetCol === "progress" && tasks.progress.length >= 2) {
      alert("In Progress is at capacity (2 max)!");
      return;
    }

    // Move task
    setTasks((prev) => {
      const sourceList = [...prev[draggedFrom as keyof typeof prev]];
      const idx = sourceList.findIndex((t) => t.id === draggedTask);
      if (idx === -1) return prev;

      const [task] = sourceList.splice(idx, 1);
      task.slot = targetSlot;

      const newTasks = { ...prev, [draggedFrom]: sourceList };
      newTasks[targetCol as keyof typeof newTasks] = [...newTasks[targetCol as keyof typeof newTasks], task];

      // Award points if moved to complete
      if (targetCol === "complete" && draggedFrom !== "complete") {
        const pts = calcTaskPoints(task);
        setTodayStats((s) => {
          const newStats = {
            completed: s.completed + 1,
            impactPoints: s.impactPoints + (pts - 10),
            xpEarned: s.xpEarned,
          };
          localStorage.setItem(storageKeys.todayStats, JSON.stringify(newStats));
          return newStats;
        });
        addXP(pts);
        saveDayToHistory(task);
      }

      return newTasks;
    });

    resetDragState();
  };

  // Handle returning core task to core section
  const handleCoreReturn = () => {
    setDragOverTarget(null);
    if (draggedTask && draggedFrom === "today") {
      const task = tasks.today.find((t) => t.id === draggedTask);
      if (task && task.isCore && task.coreId) {
        setTasks((prev) => ({
          ...prev,
          today: prev.today.filter((t) => t.id !== draggedTask),
        }));
        setCoreTasksPlaced((prev) => {
          const newPlaced = { ...prev };
          delete newPlaced[task.coreId!];
          return newPlaced;
        });
      }
    }
    resetDragState();
  };

  const resetDragState = () => {
    setDraggedTask(null);
    setDraggedFrom(null);
    setDraggedSlot(null);
    setDraggedCoreId(null);
  };

  const saveDayToHistory = (task: Task) => {
    setHistory((prev) => {
      let entry = prev.find((h) => h.date === today);
      if (!entry) {
        entry = { date: today, tasks: [], score: 0, journal: "" };
        const newHistory = [entry, ...prev];
        entry.tasks.push(task);
        entry.score = (todayStats.completed + 1) * 50 + todayStats.impactPoints;
        localStorage.setItem(storageKeys.history, JSON.stringify(newHistory));
        return newHistory;
      } else {
        const newHistory = prev.map((h) =>
          h.date === today
            ? { ...h, tasks: [...h.tasks, task], score: (todayStats.completed + 1) * 50 + todayStats.impactPoints }
            : h
        );
        localStorage.setItem(storageKeys.history, JSON.stringify(newHistory));
        return newHistory;
      }
    });
  };

  // Task modal functions
  const openTaskModal = (col: string) => {
    if (col === "today" && tasks.today.length >= 10) {
      alert("Today at capacity!");
      return;
    }
    setCurrentColumn(col);
    setSelectedEngine(null);
    setSelectedImpacts([]);
    setSelectedSlot("morning");
    setTaskInput("");
    setPointsInput("");
    setTaskModalOpen(true);
  };

  const saveTask = () => {
    if (!taskInput.trim() || !selectedEngine) {
      alert("Enter task and select engine");
      return;
    }
    const customPts = parseInt(pointsInput);
    const task: Task = {
      id: Date.now(),
      text: taskInput.trim(),
      engine: selectedEngine,
      impacts: [...selectedImpacts],
      slot: currentColumn === "today" ? selectedSlot : null,
    };
    if (customPts && customPts > 0) task.customPoints = customPts;
    setTasks((prev) => ({
      ...prev,
      [currentColumn]: currentColumn === "backlog"
        ? [task, ...prev.backlog]
        : [...prev[currentColumn as keyof typeof prev], task],
    }));
    setTaskModalOpen(false);
  };

  const deleteTask = (id: number, col: string) => {
    if (confirm("Delete task?")) {
      setTasks((prev) => ({
        ...prev,
        [col]: prev[col as keyof typeof prev].filter((t) => t.id !== id),
      }));
    }
  };

  const togglePin = (taskId: number) => {
    setTasks((prev) => ({
      ...prev,
      backlog: prev.backlog.map((t) => (t.id === taskId ? { ...t, pinned: !t.pinned } : t)),
    }));
  };

  // Journal
  const openJournalModal = () => {
    setJournalInput(localStorage.getItem(storageKeys.journal) || "");
    setJournalModalOpen(true);
  };

  const saveJournal = () => {
    localStorage.setItem(storageKeys.journal, journalInput);
    setHistory((prev) => {
      let entry = prev.find((h) => h.date === today);
      if (!entry) {
        entry = { date: today, tasks: [], score: 0, journal: journalInput };
        const newHistory = [entry, ...prev];
        localStorage.setItem(storageKeys.history, JSON.stringify(newHistory));
        return newHistory;
      } else {
        const newHistory = prev.map((h) =>
          h.date === today ? { ...h, journal: journalInput, score: todayStats.completed * 50 + todayStats.impactPoints } : h
        );
        localStorage.setItem(storageKeys.history, JSON.stringify(newHistory));
        return newHistory;
      }
    });
    setJournalModalOpen(false);
  };

  // Ideas
  const saveIdea = () => {
    if (!ideaSeriesInput.trim() || !ideaAngleInput.trim()) {
      alert("Please fill in series name and content angle");
      return;
    }
    setIdeas((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: ideaCategoryInput,
        series: ideaSeriesInput.trim(),
        angle: ideaAngleInput.trim(),
        trigger: ideaTriggerInput.trim() || "Anytime",
        difficulty: selectedDifficulty,
      },
    ]);
    setIdeaModalOpen(false);
    setIdeaSeriesInput("");
    setIdeaAngleInput("");
    setIdeaTriggerInput("");
  };

  const toggleIdeaPin = (id: number) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)));
  };

  const deleteIdea = (id: number) => {
    if (confirm("Delete this idea?")) {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const copyIdeaToBacklog = (idea: Idea) => {
    const task: Task = {
      id: Date.now(),
      text: `${idea.series}: ${idea.angle}`,
      engine: "growth",
      impacts: ["growth"],
      slot: null,
    };
    setTasks((prev) => ({
      ...prev,
      backlog: [task, ...prev.backlog],
    }));
  };

  // History filtering
  const filteredHistory = () => {
    const now = new Date();
    if (historyRange === "week") return history.filter((h) => new Date(h.date) >= new Date(now.getTime() - 7 * 86400000));
    if (historyRange === "month") return history.filter((h) => new Date(h.date) >= new Date(now.getTime() - 30 * 86400000));
    return history;
  };

  const historyStats = () => {
    const filtered = filteredHistory();
    const totalScore = filtered.reduce((s, h) => s + h.score, 0);
    const totalTasks = filtered.reduce((s, h) => s + h.tasks.length, 0);
    const avgScore = filtered.length ? Math.round(totalScore / filtered.length) : 0;
    return { totalScore, totalTasks, avgScore };
  };

  // Render task card
  const renderTask = (t: Task, col: string) => {
    const pts = calcTaskPoints(t);
    return (
      <div
        key={t.id}
        className={`task ${t.isCore ? "core-placed" : ""} ${t.pinned ? "pinned" : ""}`}
        draggable
        onDragStart={() => handleTaskDragStart(t.id, col, t.slot)}
        onDragEnd={resetDragState}
      >
        <div className="task-header">
          <span className={`task-engine engine-${t.engine}`}>{engineLabels[t.engine] || "🤖 Product"}</span>
          <span className="task-points">+{pts}</span>
        </div>
        <div className="task-text">{t.text}</div>
        {t.impacts && t.impacts.length > 0 && (
          <div className="task-impacts">
            {t.impacts.map((i) => (
              <span key={i} className="impact-badge">
                {impactLabels[i]}
              </span>
            ))}
          </div>
        )}
        <div className="task-actions">
          {col === "backlog" && (
            <button className={`task-action pin-btn ${t.pinned ? "pinned" : ""}`} onClick={() => togglePin(t.id)} title="Pin to top">
              📌
            </button>
          )}
          {!t.isCore && (
            <button className="task-action delete" onClick={() => deleteTask(t.id, col)}>
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const curr = getCurrentLevel();
  const next = getNextLevel();
  const sortedBacklog = [...tasks.backlog].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const unplacedCore = coreTasks.filter((ct) => !coreTasksPlaced[ct.id]);
  const filteredIdeas = selectedIdeaCategory === "all" ? ideas : ideas.filter((i) => i.category === selectedIdeaCategory);
  const sortedIdeas = [...filteredIdeas].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const stats = historyStats();

  return (
    <>
      <style jsx global>{`
        .productivity-page {
          font-family: "Inter", -apple-system, sans-serif;
          background: #0a0a0c;
          color: #fafafa;
          min-height: 100vh;
        }
        .header { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: #0a0a0c; z-index: 100; }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .back-link { color: #52525b; font-size: 13px; text-decoration: none; margin-right: 16px; }
        .back-link:hover { color: #fafafa; }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .logo-text { font-size: 18px; font-weight: 700; }
        .player-stats { display: flex; align-items: center; gap: 16px; }
        .stat-pill { display: flex; align-items: center; gap: 8px; background: #141418; border: 1px solid rgba(255,255,255,0.06); padding: 8px 14px; border-radius: 10px; font-size: 13px; }
        .stat-pill .value { font-family: "JetBrains Mono", monospace; font-weight: 700; color: #eab308; }
        .level-badge { background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; }
        .xp-bar { width: 120px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
        .xp-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); transition: width 0.3s; }
        .nav-tabs { display: flex; gap: 8px; }
        .nav-tab { background: transparent; border: 1px solid rgba(255,255,255,0.06); padding: 8px 16px; border-radius: 8px; color: #a1a1aa; font-size: 13px; cursor: pointer; }
        .nav-tab:hover { border-color: #8b5cf6; color: #fafafa; }
        .nav-tab.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
        .daily-score-card { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 20px; margin: 0 20px 16px; display: flex; justify-content: space-between; align-items: center; }
        .score-left { display: flex; align-items: center; gap: 20px; }
        .score-today { text-align: center; }
        .score-label { font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; }
        .score-value { font-family: "JetBrains Mono", monospace; font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #eab308, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .score-breakdown { display: flex; gap: 16px; font-size: 13px; color: #a1a1aa; }
        .breakdown-item { display: flex; align-items: center; gap: 6px; }
        .breakdown-item .num { font-family: "JetBrains Mono", monospace; color: #fafafa; }
        .journal-btn { background: transparent; border: 1px solid rgba(255,255,255,0.06); padding: 10px 16px; border-radius: 8px; color: #a1a1aa; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .journal-btn:hover { border-color: #8b5cf6; color: #fafafa; }
        .kanban { display: flex; gap: 14px; padding: 0 20px 20px; overflow-x: auto; min-height: calc(100vh - 220px); }
        .column { flex: 0 0 320px; background: #0f0f12; border-radius: 14px; display: flex; flex-direction: column; max-height: calc(100vh - 240px); }
        .column-header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }
        .column-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
        .column-count { font-family: "JetBrains Mono", monospace; font-size: 11px; color: #52525b; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 8px; }
        .column-count.limit { color: #ef4444; background: rgba(239,68,68,0.15); }
        .column-tasks { flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .column-footer { padding: 10px; border-top: 1px solid rgba(255,255,255,0.06); }
        .column.collapsed { flex: 0 0 60px; min-width: 60px; }
        .column.collapsed .column-tasks, .column.collapsed .column-footer, .column.collapsed .column-count { display: none; }
        .column.collapsed .column-header { writing-mode: vertical-rl; text-orientation: mixed; padding: 16px 10px; height: 100%; border-bottom: none; }
        .collapse-btn { background: transparent; border: none; color: #52525b; cursor: pointer; font-size: 14px; padding: 4px; border-radius: 4px; }
        .collapse-btn:hover { color: #fafafa; background: rgba(255,255,255,0.05); }
        .add-btn { width: 100%; background: transparent; border: 1px dashed rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; color: #52525b; font-size: 12px; cursor: pointer; }
        .add-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }
        .column.today-col { flex: 0 0 420px; border: 1px solid rgba(139,92,246,0.3); background: linear-gradient(180deg, rgba(139,92,246,0.03) 0%, #0f0f12 100%); }
        .column.today-col .column-title { color: #8b5cf6; }
        .time-slots { flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .time-slot { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; min-height: 100px; }
        .time-slot.drag-over { border-color: #8b5cf6; background: rgba(139,92,246,0.05); }
        .slot-header { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }
        .slot-title { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .slot-title.morning { color: #f97316; }
        .slot-title.midday { color: #06b6d4; }
        .slot-title.closing { color: #ec4899; }
        .slot-hint { font-size: 10px; color: #52525b; }
        .slot-tasks { padding: 8px; display: flex; flex-direction: column; gap: 6px; min-height: 50px; }
        .slot-empty { text-align: center; padding: 16px; color: #52525b; font-size: 11px; }
        .core-tasks-section { background: linear-gradient(135deg, rgba(234,179,8,0.08), rgba(249,115,22,0.05)); border: 1px solid rgba(234,179,8,0.25); border-radius: 10px; margin-bottom: 12px; }
        .core-tasks-section.drag-over { border-color: #eab308; background: rgba(234,179,8,0.12); }
        .core-tasks-header { padding: 10px 12px; border-bottom: 1px solid rgba(234,179,8,0.15); display: flex; justify-content: space-between; align-items: center; }
        .core-tasks-title { font-size: 12px; font-weight: 600; color: #eab308; display: flex; align-items: center; gap: 6px; }
        .core-tasks-hint { font-size: 10px; color: #52525b; }
        .core-tasks-list { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
        .core-task { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; cursor: grab; display: flex; align-items: center; gap: 10px; }
        .core-task:hover { border-color: #eab308; }
        .core-task-icon { font-size: 18px; }
        .core-task-content { flex: 1; }
        .core-task-label { font-size: 11px; font-weight: 600; color: #fafafa; }
        .core-task-desc { font-size: 10px; color: #52525b; margin-top: 2px; }
        .task { position: relative; background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px; cursor: grab; transition: transform 0.15s, box-shadow 0.15s; }
        .task:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
        .task.pinned { border-color: #eab308; }
        .task.pinned::before { content: "📌"; position: absolute; top: -8px; right: 8px; font-size: 12px; }
        .task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .task-engine { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .engine-product { background: rgba(6,182,212,0.15); color: #06b6d4; }
        .engine-systems { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .engine-growth { background: rgba(236,72,153,0.15); color: #ec4899; }
        .task-points { font-family: "JetBrains Mono", monospace; font-size: 11px; color: #eab308; background: rgba(234,179,8,0.1); padding: 3px 8px; border-radius: 4px; }
        .task-text { font-size: 12px; line-height: 1.4; margin-bottom: 6px; }
        .task-impacts { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 6px; }
        .impact-badge { font-size: 14px; padding: 3px 6px; border-radius: 4px; background: rgba(255,255,255,0.05); }
        .task-actions { display: flex; justify-content: flex-end; gap: 4px; opacity: 0; transition: opacity 0.2s; }
        .task:hover .task-actions { opacity: 1; }
        .task-action { width: 24px; height: 24px; border: none; background: rgba(255,255,255,0.05); border-radius: 4px; color: #52525b; cursor: pointer; font-size: 14px; }
        .task-action:hover { background: rgba(255,255,255,0.1); }
        .task-action.delete:hover { color: #ef4444; }
        .task-action.pin-btn.pinned { color: #eab308; }
        .empty-state { text-align: center; padding: 20px; color: #52525b; font-size: 12px; }
        .column.complete-col .task { opacity: 0.6; }
        .column.complete-col .task-text { text-decoration: line-through; color: #a1a1aa; }
        .column.drag-over .column-tasks { background: rgba(139,92,246,0.05); border-radius: 8px; }
        .daily-notes { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 20px; margin: 16px 20px; }
        .notes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .notes-title { font-size: 14px; font-weight: 600; color: #fafafa; display: flex; align-items: center; gap: 8px; }
        .notes-saved { font-size: 11px; color: #10b981; opacity: 0; transition: opacity 0.3s; }
        .notes-saved.show { opacity: 1; }
        .notes-textarea { width: 100%; min-height: 120px; background: #0a0a0c; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 12px; color: #fafafa; font-size: 13px; font-family: inherit; resize: vertical; outline: none; }
        .notes-textarea:focus { border-color: #8b5cf6; }
        .idea-bank { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 20px; margin: 16px 20px; }
        .idea-bank-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .idea-bank-title { font-size: 16px; font-weight: 600; color: #fafafa; display: flex; align-items: center; gap: 8px; }
        .idea-bank-btn { background: rgba(139,92,246,0.15); border: 1px solid #8b5cf6; color: #8b5cf6; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; }
        .idea-bank-btn:hover { background: rgba(139,92,246,0.25); }
        .idea-categories { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .idea-category-tab { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 6px; font-size: 11px; color: #a1a1aa; cursor: pointer; }
        .idea-category-tab:hover { border-color: #8b5cf6; color: #fafafa; }
        .idea-category-tab.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
        .idea-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; max-height: 600px; overflow-y: auto; }
        .idea-card { background: #0a0a0c; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; position: relative; }
        .idea-card:hover { border-color: #8b5cf6; }
        .idea-card.pinned { border-color: #eab308; }
        .idea-card.pinned::before { content: "📌"; position: absolute; top: -8px; right: 8px; font-size: 12px; }
        .idea-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .idea-series { font-size: 12px; font-weight: 600; color: #ec4899; }
        .idea-difficulty { font-size: 9px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
        .idea-difficulty.easy { background: rgba(16,185,129,0.15); color: #10b981; }
        .idea-difficulty.medium { background: rgba(234,179,8,0.15); color: #eab308; }
        .idea-angle { font-size: 13px; color: #fafafa; margin-bottom: 6px; }
        .idea-trigger { font-size: 11px; color: #52525b; }
        .idea-card-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; opacity: 0; transition: opacity 0.2s; }
        .idea-card:hover .idea-card-actions { opacity: 1; }
        .idea-copy-backlog { background: transparent; border: none; color: #52525b; cursor: pointer; font-size: 12px; }
        .idea-copy-backlog:hover { color: #10b981; }
        .idea-delete, .idea-pin { background: transparent; border: none; color: #52525b; cursor: pointer; font-size: 12px; }
        .idea-delete:hover { color: #ef4444; }
        .idea-pin:hover { color: #eab308; }
        .idea-pin.pinned { color: #eab308; }
        .history-view { padding: 20px; max-width: 900px; margin: 0 auto; }
        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .history-title { font-size: 24px; font-weight: 700; }
        .history-tabs { display: flex; gap: 8px; }
        .history-tab { background: transparent; border: 1px solid rgba(255,255,255,0.06); padding: 8px 16px; border-radius: 8px; color: #a1a1aa; font-size: 13px; cursor: pointer; }
        .history-tab.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; text-align: center; }
        .stat-card .big-num { font-family: "JetBrains Mono", monospace; font-size: 36px; font-weight: 800; background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-card .stat-label { font-size: 12px; color: #52525b; margin-top: 4px; }
        .day-entry { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .day-date { font-weight: 600; }
        .day-score { font-family: "JetBrains Mono", monospace; font-size: 20px; font-weight: 700; color: #eab308; }
        .day-tasks { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .day-task-detail { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15); border-radius: 8px; padding: 10px; }
        .day-task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .day-task-engine { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .day-task-impacts { font-size: 12px; }
        .day-task-text { font-size: 13px; color: #fafafa; }
        .day-journal { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; font-size: 13px; color: #a1a1aa; font-style: italic; border-left: 3px solid #8b5cf6; }
        .no-history { text-align: center; padding: 60px; color: #52525b; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; width: 420px; max-width: 90vw; max-height: 90vh; overflow-y: auto; }
        .modal-title { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
        .modal-section { margin-bottom: 16px; }
        .modal-label { font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
        .modal-input { width: 100%; background: #0a0a0c; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 12px; color: #fafafa; font-size: 14px; font-family: inherit; outline: none; }
        .modal-input:focus { border-color: #8b5cf6; }
        .modal-textarea { width: 100%; background: #0a0a0c; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 12px; color: #fafafa; font-size: 14px; font-family: inherit; outline: none; resize: vertical; min-height: 80px; }
        .option-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .option-btn { padding: 10px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; border: 1px solid transparent; background: rgba(255,255,255,0.05); color: #a1a1aa; }
        .option-btn.selected { border-color: white; }
        .option-btn.engine-product { background: rgba(6,182,212,0.15); color: #06b6d4; }
        .option-btn.engine-systems { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .option-btn.engine-growth { background: rgba(236,72,153,0.15); color: #ec4899; }
        .impact-btn.selected { background: rgba(139,92,246,0.2); color: #8b5cf6; }
        .slot-btn.selected[data-slot="morning"] { background: rgba(249,115,22,0.2); color: #f97316; border-color: white; }
        .slot-btn.selected[data-slot="midday"] { background: rgba(6,182,212,0.2); color: #06b6d4; border-color: white; }
        .slot-btn.selected[data-slot="closing"] { background: rgba(236,72,153,0.2); color: #ec4899; border-color: white; }
        .points-row { display: flex; align-items: center; gap: 12px; }
        .points-input { width: 100px; text-align: center; }
        .points-preview { font-size: 12px; color: #52525b; }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
        .modal-btn { padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
        .modal-btn.cancel { background: transparent; color: #a1a1aa; }
        .modal-btn.save { background: #8b5cf6; color: white; }
      `}</style>

      <div className="productivity-page">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <a href="/admin/command-center" className="back-link">← Command Center</a>
            <div className="logo">
              <div className="logo-icon">⚡</div>
              <div>
                <div className="logo-text">Operator HQ</div>
              </div>
            </div>
            <div className="nav-tabs">
              <button className={`nav-tab ${activeView === "kanban" ? "active" : ""}`} onClick={() => setActiveView("kanban")}>
                📋 Board
              </button>
              <button className={`nav-tab ${activeView === "history" ? "active" : ""}`} onClick={() => setActiveView("history")}>
                📊 History
              </button>
            </div>
          </div>
          <div className="player-stats">
            <div className="stat-pill">
              🔥 <span className="value">{gameData.streak}</span> day streak
            </div>
            <div className="stat-pill">
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${getXpProgress()}%` }} />
              </div>
              <span className="value">{next ? `${gameData.xp} / ${next.xp} XP` : "MAX"}</span>
            </div>
            <div className="level-badge">Level {gameData.level} {curr.title}</div>
          </div>
        </div>

        {/* Kanban View */}
        {activeView === "kanban" && (
          <>
            <div className="daily-score-card">
              <div className="score-left">
                <div className="score-today">
                  <div className="score-label">Today&apos;s Score</div>
                  <div className="score-value">{todayStats.completed * 50 + todayStats.impactPoints}</div>
                </div>
                <div className="score-breakdown">
                  <div className="breakdown-item">✅ <span className="num">{todayStats.completed}</span> completed</div>
                  <div className="breakdown-item">💰 <span className="num">{todayStats.impactPoints}</span> impact pts</div>
                  <div className="breakdown-item">⚡ <span className="num">{todayStats.xpEarned}</span> XP earned</div>
                </div>
              </div>
              <button className="journal-btn" onClick={openJournalModal}>📝 Add journal note</button>
            </div>

            <div className="kanban">
              {/* Backlog */}
              <div className={`column ${backlogCollapsed ? "collapsed" : ""}`}>
                <div className="column-header">
                  <div className="column-title">🧠 Backlog</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="column-count">{tasks.backlog.length}</div>
                    <button className="collapse-btn" onClick={() => { setBacklogCollapsed(!backlogCollapsed); localStorage.setItem(storageKeys.backlogCollapsed, String(!backlogCollapsed)); }}>
                      {backlogCollapsed ? "▶" : "◀"}
                    </button>
                  </div>
                </div>
                <div
                  className="column-tasks"
                  onDragOver={(e) => { e.preventDefault(); setDragOverTarget("backlog"); }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={() => handleDrop("backlog", null)}
                >
                  {sortedBacklog.length ? sortedBacklog.map((t) => renderTask(t, "backlog")) : <div className="empty-state">No tasks</div>}
                </div>
                <div className="column-footer">
                  <button className="add-btn" onClick={() => openTaskModal("backlog")}>+ Add idea</button>
                </div>
              </div>

              {/* Today */}
              <div className="column today-col">
                <div className="column-header">
                  <div className="column-title">⚔️ Today&apos;s Plan</div>
                  <div className={`column-count ${tasks.today.length >= 10 ? "limit" : ""}`}>{tasks.today.length} / 10</div>
                </div>
                <div className="time-slots">
                  {/* Core Tasks */}
                  <div
                    className={`core-tasks-section ${dragOverTarget === "core" ? "drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverTarget("core"); }}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={handleCoreReturn}
                  >
                    <div className="core-tasks-header">
                      <div className="core-tasks-title">⭐ Daily Core Tasks</div>
                      <div className="core-tasks-hint">Drag into time slots</div>
                    </div>
                    <div className="core-tasks-list">
                      {unplacedCore.length > 0 ? (
                        unplacedCore.map((ct) => (
                          <div
                            key={ct.id}
                            className="core-task"
                            draggable
                            onDragStart={() => handleCoreDragStart(ct.id)}
                            onDragEnd={resetDragState}
                          >
                            <div className="core-task-icon">{ct.icon}</div>
                            <div className="core-task-content">
                              <div className="core-task-label">{ct.label}</div>
                              <div className="core-task-desc">{ct.desc}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="slot-empty">All core tasks scheduled! Drag back here to unschedule.</div>
                      )}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {(["morning", "midday", "closing"] as const).map((slot) => (
                    <div
                      key={slot}
                      className={`time-slot ${dragOverTarget === slot ? "drag-over" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOverTarget(slot); }}
                      onDragLeave={() => setDragOverTarget(null)}
                      onDrop={() => handleDrop("today", slot)}
                    >
                      <div className="slot-header">
                        <div className={`slot-title ${slot}`}>
                          {slot === "morning" ? "☀️ Morning" : slot === "midday" ? "🌤️ Midday" : "🌙 Closing"}
                        </div>
                        <div className="slot-hint">{slot === "morning" ? "Start of day" : slot === "midday" ? "Core work" : "Wrap up"}</div>
                      </div>
                      <div className="slot-tasks">
                        {tasks.today.filter((t) => t.slot === slot).length > 0 ? (
                          tasks.today.filter((t) => t.slot === slot).map((t) => renderTask(t, "today"))
                        ) : (
                          <div className="slot-empty">Drop task here</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress */}
              <div className="column">
                <div className="column-header">
                  <div className="column-title">🔥 In Progress</div>
                  <div className={`column-count ${tasks.progress.length >= 2 ? "limit" : ""}`}>{tasks.progress.length} / 2</div>
                </div>
                <div
                  className={`column-tasks ${dragOverTarget === "progress" ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverTarget("progress"); }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={() => handleDrop("progress", null)}
                >
                  {tasks.progress.length ? tasks.progress.map((t) => renderTask(t, "progress")) : <div className="empty-state">No tasks</div>}
                </div>
              </div>

              {/* Complete */}
              <div className="column complete-col">
                <div className="column-header">
                  <div className="column-title">✅ Complete</div>
                  <div className="column-count">{tasks.complete.length}</div>
                </div>
                <div
                  className={`column-tasks ${dragOverTarget === "complete" ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverTarget("complete"); }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={() => handleDrop("complete", null)}
                >
                  {tasks.complete.length ? tasks.complete.map((t) => renderTask(t, "complete")) : <div className="empty-state">No tasks</div>}
                </div>
              </div>
            </div>

            {/* Daily Notes */}
            <div className="daily-notes">
              <div className="notes-header">
                <div className="notes-title">💭 Quick Thoughts</div>
                <span className={`notes-saved ${notesSaved ? "show" : ""}`}>✓ Saved</span>
              </div>
              <textarea
                className="notes-textarea"
                value={dailyNotes}
                onChange={(e) => setDailyNotes(e.target.value)}
                placeholder="Jot down any thoughts, ideas, or notes for today..."
              />
            </div>

            {/* Idea Bank */}
            <div className="idea-bank">
              <div className="idea-bank-header">
                <div className="idea-bank-title">💡 Growth Idea Bank</div>
                <button className="idea-bank-btn" onClick={() => setIdeaModalOpen(true)}>+ Add Idea</button>
              </div>
              <div className="idea-categories">
                {Object.entries(ideaCategories).map(([key, label]) => (
                  <button
                    key={key}
                    className={`idea-category-tab ${selectedIdeaCategory === key ? "active" : ""}`}
                    onClick={() => setSelectedIdeaCategory(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="idea-cards">
                {sortedIdeas.length ? (
                  sortedIdeas.map((idea) => (
                    <div key={idea.id} className={`idea-card ${idea.pinned ? "pinned" : ""}`}>
                      <div className="idea-card-header">
                        <div className="idea-series">{idea.series}</div>
                        <div className={`idea-difficulty ${idea.difficulty}`}>{idea.difficulty}</div>
                      </div>
                      <div className="idea-angle">{idea.angle}</div>
                      <div className="idea-trigger">⏰ {idea.trigger}</div>
                      <div className="idea-card-actions">
                        <button className="idea-copy-backlog" onClick={() => copyIdeaToBacklog(idea)} title="Copy to Backlog">📋</button>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <button className={`idea-pin ${idea.pinned ? "pinned" : ""}`} onClick={() => toggleIdeaPin(idea.id)} title="Pin idea">📌</button>
                          <button className="idea-delete" onClick={() => deleteIdea(idea.id)} title="Delete idea">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No ideas in this category</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* History View */}
        {activeView === "history" && (
          <div className="history-view">
            <div className="history-header">
              <div className="history-title">📊 Performance History</div>
              <div className="history-tabs">
                {(["week", "month", "all"] as const).map((range) => (
                  <button
                    key={range}
                    className={`history-tab ${historyRange === range ? "active" : ""}`}
                    onClick={() => setHistoryRange(range)}
                  >
                    {range === "week" ? "This Week" : range === "month" ? "This Month" : "All Time"}
                  </button>
                ))}
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="big-num">{stats.totalScore}</div><div className="stat-label">Total Score</div></div>
              <div className="stat-card"><div className="big-num">{stats.totalTasks}</div><div className="stat-label">Tasks Completed</div></div>
              <div className="stat-card"><div className="big-num">{stats.avgScore}</div><div className="stat-label">Avg Daily Score</div></div>
              <div className="stat-card"><div className="big-num">{gameData.bestStreak}</div><div className="stat-label">Best Streak</div></div>
            </div>
            <div>
              {filteredHistory().length ? (
                filteredHistory().map((h) => (
                  <div key={h.date} className="day-entry">
                    <div className="day-header">
                      <div className="day-date">{new Date(h.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                      <div className="day-score">{h.score} pts</div>
                    </div>
                    {h.tasks.length > 0 && (
                      <div className="day-tasks">
                        {h.tasks.map((t, i) => (
                          <div key={i} className="day-task-detail">
                            <div className="day-task-header">
                              <span className={`day-task-engine engine-${t.engine}`}>{engineLabels[t.engine] || "🤖 Product"}</span>
                              {t.impacts && t.impacts.length > 0 && (
                                <span className="day-task-impacts">
                                  {t.impacts.map((imp) => impactLabels[imp]).join(" ")}
                                </span>
                              )}
                            </div>
                            <div className="day-task-text">{t.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {h.journal && <div className="day-journal">&quot;{h.journal}&quot;</div>}
                  </div>
                ))
              ) : (
                <div className="no-history">No history yet!</div>
              )}
            </div>
          </div>
        )}

        {/* Task Modal */}
        {taskModalOpen && (
          <div className="modal-overlay" onClick={() => setTaskModalOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">Add Task</div>
              <div className="modal-section">
                <label className="modal-label">Task Description</label>
                <input type="text" className="modal-input" value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="What needs to be done?" autoFocus />
              </div>
              <div className="modal-section">
                <label className="modal-label">Engine (required)</label>
                <div className="option-grid">
                  {["product", "systems", "growth"].map((eng) => (
                    <div key={eng} className={`option-btn engine-${eng} ${selectedEngine === eng ? "selected" : ""}`} onClick={() => setSelectedEngine(eng)}>
                      {eng === "product" ? "🤖 Product" : eng === "systems" ? "⚙️ Systems" : "📈 Growth"}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-section">
                <label className="modal-label">Impact Labels</label>
                <div className="option-grid">
                  {Object.entries(impactLabels).map(([key, emoji]) => (
                    <div key={key} className={`option-btn impact-btn ${selectedImpacts.includes(key) ? "selected" : ""}`} onClick={() => setSelectedImpacts((prev) => prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key])}>
                      {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-section">
                <label className="modal-label">Points</label>
                <div className="points-row">
                  <input type="number" className="modal-input points-input" value={pointsInput} onChange={(e) => setPointsInput(e.target.value)} placeholder="Auto" min="1" max="500" />
                  <span className="points-preview">Suggested: {10 + selectedImpacts.reduce((sum, i) => sum + (impactPointsMap[i] || 0), 0)} pts</span>
                </div>
              </div>
              {currentColumn === "today" && (
                <div className="modal-section">
                  <label className="modal-label">Time Slot</label>
                  <div className="option-grid">
                    {["morning", "midday", "closing"].map((slot) => (
                      <div key={slot} className={`option-btn slot-btn ${selectedSlot === slot ? "selected" : ""}`} data-slot={slot} onClick={() => setSelectedSlot(slot)}>
                        {slot === "morning" ? "☀️ Morning" : slot === "midday" ? "🌤️ Midday" : "🌙 Closing"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setTaskModalOpen(false)}>Cancel</button>
                <button className="modal-btn save" onClick={saveTask}>Add Task</button>
              </div>
            </div>
          </div>
        )}

        {/* Journal Modal */}
        {journalModalOpen && (
          <div className="modal-overlay" onClick={() => setJournalModalOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">📝 Daily Journal</div>
              <div className="modal-section">
                <label className="modal-label">How did today go?</label>
                <textarea className="modal-textarea" value={journalInput} onChange={(e) => setJournalInput(e.target.value)} placeholder="Write your thoughts..." />
              </div>
              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setJournalModalOpen(false)}>Cancel</button>
                <button className="modal-btn save" onClick={saveJournal}>Save Entry</button>
              </div>
            </div>
          </div>
        )}

        {/* Idea Modal */}
        {ideaModalOpen && (
          <div className="modal-overlay" onClick={() => setIdeaModalOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">💡 Add Content Idea</div>
              <div className="modal-section">
                <label className="modal-label">Category</label>
                <select className="modal-input" value={ideaCategoryInput} onChange={(e) => setIdeaCategoryInput(e.target.value)}>
                  <option value="daily">📊 Daily / Intraday Insight</option>
                  <option value="educational">🧠 Educational Authority</option>
                  <option value="analysis">📉 Post-Move Analysis</option>
                  <option value="psychology">🎯 Trading Psychology</option>
                  <option value="proof">🧪 Proof & Transparency</option>
                  <option value="culture">🔥 Culture / Brand Voice</option>
                  <option value="weekly">📆 Weekly Series</option>
                </select>
              </div>
              <div className="modal-section">
                <label className="modal-label">Series Name</label>
                <input type="text" className="modal-input" value={ideaSeriesInput} onChange={(e) => setIdeaSeriesInput(e.target.value)} placeholder="e.g., Level Watch" />
              </div>
              <div className="modal-section">
                <label className="modal-label">Content Angle</label>
                <input type="text" className="modal-input" value={ideaAngleInput} onChange={(e) => setIdeaAngleInput(e.target.value)} placeholder="What's the content about?" />
              </div>
              <div className="modal-section">
                <label className="modal-label">When to Use / Trigger</label>
                <input type="text" className="modal-input" value={ideaTriggerInput} onChange={(e) => setIdeaTriggerInput(e.target.value)} placeholder="e.g., TSLA near key level" />
              </div>
              <div className="modal-section">
                <label className="modal-label">Difficulty</label>
                <div className="option-grid">
                  {["easy", "medium"].map((diff) => (
                    <div key={diff} className={`option-btn slot-btn ${selectedDifficulty === diff ? "selected" : ""}`} onClick={() => setSelectedDifficulty(diff)}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setIdeaModalOpen(false)}>Cancel</button>
                <button className="modal-btn save" onClick={saveIdea}>Add Idea</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
