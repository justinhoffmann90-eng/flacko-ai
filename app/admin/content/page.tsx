function QuoteImageGenerator({ modeAccent }: { modeAccent: { badge: string; glow: string; text: string; ring: string } }) {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("Flacko AI");
  const [style, setStyle] = useState<"neutral" | "red" | "orange" | "yellow" | "green">("neutral");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const styleOptions = [
    { value: "neutral", label: "Neutral", color: "bg-white" },
    { value: "green", label: "Green", color: "bg-green-500" },
    { value: "yellow", label: "Yellow", color: "bg-yellow-500" },
    { value: "orange", label: "Orange", color: "bg-orange-500" },
    { value: "red", label: "Red", color: "bg-red-500" },
  ];

  const handleGenerate = async () => {
    if (!quote.trim()) return;
    setGenerating(true);
    setPreviewUrl(null);
    setGenError(null);

    try {
      const response = await fetch("/api/content/quote-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, author, style }),
      });

      if (!response.ok) throw new Error("Failed to generate image");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `flacko-quote-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
      <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">Quote Image Generator</h2>
          <div className="text-sm text-zinc-500 mt-1">Create branded quote images for X</div>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Quote Text</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter your quote..."
              rows={3}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Author</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Style</label>
              <div className="flex gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStyle(opt.value as typeof style)}
                    className={`w-9 h-9 rounded-lg border-2 transition-all ${opt.color} ${
                      style === opt.value ? "border-white scale-110" : "border-zinc-700 opacity-60"
                    }`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!quote.trim() || generating}
              className={`min-h-[44px] px-6 py-2 rounded-xl text-sm font-medium ${
                generating ? "bg-zinc-800 text-zinc-500" : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {generating ? "Generating..." : "Generate Image"}
            </button>
          </div>
          {genError && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">{genError}</div>
          )}
          {previewUrl && (
            <div className="space-y-3">
              <img src={previewUrl} alt="Quote preview" className="w-full rounded-xl border border-zinc-800" />
              <div className="flex justify-end">
                <button
                  onClick={handleDownload}
                  className="min-h-[44px] px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium"
                >
                  Download PNG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function XArticleBuilder() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Convert Discord format to X article-friendly format
  const convertToArticle = (text: string): string => {
    let result = text;
    
    // Remove markdown headers (### ## #) - keep the text, add newline after
    result = result.replace(/^#{1,6}\s*(.+)$/gm, "$1\n");
    
    // Convert **bold** to plain text (X articles don't support markdown)
    result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
    
    // Convert __underline__ to plain text
    result = result.replace(/__([^_]+)__/g, "$1");
    
    // Convert *italic* to plain text
    result = result.replace(/\*([^*]+)\*/g, "$1");
    
    // Convert _italic_ to plain text
    result = result.replace(/_([^_]+)_/g, "$1");
    
    // Convert ~~strikethrough~~ to plain text
    result = result.replace(/~~([^~]+)~~/g, "$1");
    
    // Remove Discord separators (━━━━ lines)
    result = result.replace(/[━─═]{3,}/g, "---");
    
    // Clean up bullet points (• → -)
    result = result.replace(/•/g, "-");
    
    // Remove code block markers
    result = result.replace(/```[a-z]*\n?/g, "");
    result = result.replace(/`([^`]+)`/g, "$1");
    
    // Clean up Discord emoji format :emoji_name:
    // Keep common ones, remove custom server emojis
    result = result.replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, "");
    
    // Clean up multiple newlines (more than 2 → 2)
    result = result.replace(/\n{3,}/g, "\n\n");
    
    // Clean up multiple dashes/separators in a row
    result = result.replace(/(-{3,}\n?){2,}/g, "---\n\n");
    
    // Trim whitespace from each line
    result = result.split("\n").map(line => line.trim()).join("\n");
    
    // Trim overall
    result = result.trim();
    
    return result;
  };

  const articleOutput = convertToArticle(input);

  const handleCopy = () => {
    navigator.clipboard.writeText(articleOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
      <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span>📝</span> X Article Builder
              </h2>
              <div className="text-sm text-zinc-500 mt-1">Convert Discord posts to X article format</div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Paste Discord Content</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your Morning Brief, EOD Wrap, or any Discord-formatted content here..."
              rows={8}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none font-mono text-sm"
            />
            <div className="text-xs text-zinc-500 mt-1">{input.length} characters</div>
          </div>

          {/* Output Preview */}
          {input && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-400">Article Preview</label>
                <button
                  onClick={handleCopy}
                  className={`min-h-[36px] px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    copied
                      ? "bg-green-600 text-white border-green-500"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
                >
                  {copied ? "✓ Copied!" : "Copy Article"}
                </button>
              </div>
              <div className="bg-black border border-zinc-800 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans leading-relaxed">{articleOutput}</pre>
              </div>
              <div className="text-xs text-zinc-500 mt-1">{articleOutput.length} characters</div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm text-zinc-400">
              <strong className="text-zinc-300">What this converts:</strong>
              <ul className="mt-2 space-y-1 text-zinc-500">
                <li>• Headers (## Title) → plain text</li>
                <li>• Bold (**text**) → plain text</li>
                <li>• Italic (*text* or _text_) → plain text</li>
                <li>• Underline (__text__) → plain text</li>
                <li>• Strikethrough (~~text~~) → plain text</li>
                <li>• Code blocks and inline code → plain text</li>
                <li>• Separator lines (━━━) → ---</li>
                <li>• Bullets (•) → dashes (-)</li>
                <li>• Custom Discord emojis → removed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildThreadTweets(data: ContentHubData, template: TemplateStyle): string[] {
  const dateLabel = format(parseISO(data.date), "MMM d, yyyy");
  const levels = data.morningCard.levels || {};
  const modeLine = `${data.modeEmoji} ${data.mode.toUpperCase()} MODE — ${dateLabel}`;
  const levelLine = `Key levels: R1 ${formatLevelValue(levels.R1)}, R2 ${formatLevelValue(levels.R2)}, S1 ${formatLevelValue(levels.S1)}, S2 ${formatLevelValue(levels.S2)}`;

  const base = {
    minimal: [
      `${modeLine}\n\nDaily cap in effect. Map your risk accordingly. ⚔️`,
      `${levelLine}\n\nRespect the levels.`,
      `Focus: clean reactions at key levels + protect capital.`,
      `Get the full daily brief + accuracy track record → flacko.ai ⚔️`,
    ],
    detailed: [
      `${modeLine}\n\nToday's plan is live. Daily cap + posture pulled from the report.`,
      `${levelLine}\n\nThese are the highest-impact levels for today's tape.`,
      `What to watch: wait for clean reactions at levels, size by mode, and avoid forcing trades.`,
      `Want the full breakdown + alerts? Join the gang → flacko.ai ⚔️`,
    ],
    hype: [
      `${modeLine}\n\nWe've got a plan. Levels locked. Risk capped. ⚡️`,
      `${levelLine}\n\nThese are the battlegrounds.`,
      `Stay sharp: let price come to you and execute the playbook. ⚔️`,
      `Full report + live alerts → flacko.ai ⚔️`,
    ],
    defensive: [
      `${modeLine}\n\nRisk tight today. Size down and stay defensive.`,
      `${levelLine}\n\nProtect capital first.`,
      `What matters: patience, clean reactions, no hero trades.`,
      `Track the system + accuracy → flacko.ai ⚔️`,
    ],
  } as const;

  return base[template];
}


function AIContentStudio({
  activeDate,
  discordChannels,
  selectedDiscordChannel,
  postToDiscord,
  discordPosting,
}: {
  activeDate: string | null;
  discordChannels: DiscordChannel[];
  selectedDiscordChannel: string;
  postToDiscord: (content: string, context: string) => Promise<void>;
  discordPosting: string | null;
}) {
  const [contentType, setContentType] = useState<string>("tweet");
  const [audience, setAudience] = useState<"public" | "subscriber">("public");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedResult, setEditedResult] = useState("");

  const contentTypes = [
    { value: "tweet", label: "Tweet Variations", desc: "3 tweet options from today's data" },
    { value: "thread", label: "X Thread", desc: "3-5 tweet thread on a topic" },
    { value: "morning-brief", label: "Morning Brief", desc: "Discord #morning-brief post" },
    { value: "eod-wrap", label: "EOD Wrap", desc: "Discord #market-pulse EOD post" },
    { value: "educational", label: "Educational Thread", desc: "Public educational content" },
    { value: "custom", label: "Custom", desc: "Free-form with your own prompt" },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    setEditMode(false);

    try {
      const response = await fetch("/api/content/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contentType,
          context: customPrompt || undefined,
          date: activeDate,
          audience,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();
      setResult(data.content);
      setEditedResult(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const displayText = editMode ? editedResult : result;

  const handleCopy = () => {
    if (!displayText) return;
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToDiscord = () => {
    if (!displayText) return;
    postToDiscord(displayText, "ai-studio");
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-800/30 via-indigo-500/20 to-purple-800/30 rounded-3xl blur opacity-70" />
      <div className="relative bg-zinc-950/80 rounded-3xl border border-purple-500/30 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                AI Content Studio
              </h2>
              <div className="text-sm text-zinc-500 mt-1">
                Generate content from today's report data using AI
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as "public" | "subscriber")}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm"
              >
                <option value="public">Public (tease, no specifics)</option>
                <option value="subscriber">Subscriber (specific levels)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Content Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {contentTypes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  contentType === ct.value
                    ? "border-purple-500/50 bg-purple-500/10"
                    : "border-zinc-800 bg-black/40 hover:border-zinc-700"
                }`}
              >
                <div className="text-sm font-medium text-zinc-200">{ct.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{ct.desc}</div>
              </button>
            ))}
          </div>

          {/* Context/Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              {contentType === "custom" ? "Your Prompt" : "Additional Context (optional)"}
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                contentType === "educational"
                  ? "e.g., how gamma exposure creates support and resistance..."
                  : contentType === "eod-wrap"
                  ? "e.g., TSLA broke below put wall at 2pm, recovered into close..."
                  : contentType === "custom"
                  ? "Describe what you want to generate..."
                  : "Leave blank to auto-generate from report data, or add a specific angle..."
              }
              rows={3}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || (contentType === "custom" && !customPrompt.trim())}
            className={`w-full min-h-[48px] px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              generating
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {generating ? "Generating..." : "Generate Content"}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Generated Content</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditMode(!editMode);
                      if (!editMode) setEditedResult(result);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      editMode
                        ? "bg-amber-600 text-white border-amber-500"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}
                  >
                    {editMode ? "Editing" : "Edit"}
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      copied
                        ? "bg-green-600 text-white border-green-500"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handlePostToDiscord}
                    disabled={!selectedDiscordChannel || discordPosting === "ai-studio"}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 border border-indigo-500/40"
                  >
                    {discordPosting === "ai-studio" ? "Posting..." : "Post to Discord"}
                  </button>
                </div>
              </div>
              {editMode ? (
                <textarea
                  value={editedResult}
                  onChange={(e) => setEditedResult(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 bg-black border border-amber-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-mono text-sm"
                />
              ) : (
                <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-mono">{result}</pre>
                </div>
              )}
              <div className="text-xs text-zinc-500">
                {(displayText || "").length} characters
                {(displayText || "").length > 280 && " (over standard tweet limit)"}
                {(displayText || "").length > 4000 && " (over X premium limit!)"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface WeeklyThreadData {
  week: string;
  weekLabel: string;
  tweets: Array<{
    index: number;
    text: string;
    isHeader: boolean;
    charCount: number;
  }>;
  threadForCopy: string;
  imageUrl: string;
  summary: {
    tradingDays: number;
    weeklyScore: number;
    overallLevelAccuracy: number;
    bestDay: { date: string; score: number; mode: string } | null;
    worstDay: { date: string; score: number; mode: string } | null;
  };
}

function WeeklyScorecardSection() {
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadData, setThreadData] = useState<WeeklyThreadData | null>(null);
  const [copiedThread, setCopiedThread] = useState(false);

  // Initialize with current week
  useEffect(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    const year = startOfWeek.getFullYear();
    const weekNum = getISOWeek(startOfWeek);
    setSelectedWeek(`${year}-${String(weekNum).padStart(2, "0")}`);
  }, []);

  const getISOWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const handleGenerateThread = async () => {
    if (!selectedWeek) return;

    setLoading(true);
    setError(null);
    setThreadData(null);

    try {
      const response = await fetch(`/api/content/weekly-thread?week=${selectedWeek}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate thread");
      }
      const data = await response.json();
      setThreadData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyThread = () => {
    if (!threadData) return;
    navigator.clipboard.writeText(threadData.threadForCopy);
    setCopiedThread(true);
    setTimeout(() => setCopiedThread(false), 2000);
  };

  // Generate week options for the past 8 weeks
  const weekOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    const now = new Date();

    for (let i = 0; i < 8; i++) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - (i * 7));
      const startOfWeek = new Date(weekDate);
      startOfWeek.setDate(weekDate.getDate() - weekDate.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const year = startOfWeek.getFullYear();
      const weekNum = getISOWeek(startOfWeek);
      const value = `${year}-${String(weekNum).padStart(2, "0")}`;
      const label = `Week ${weekNum}: ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      options.push({ value, label });
    }

    return options;
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-800/30 via-teal-500/20 to-emerald-800/30 rounded-3xl blur opacity-70" />
      <div className="relative bg-zinc-950/80 rounded-3xl border border-emerald-500/30 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Weekly Scorecard Thread
              </h2>
              <div className="text-sm text-zinc-500 mt-1">
                Generate X thread from weekly accuracy data
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="min-h-[44px] px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
              >
                {weekOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateThread}
                disabled={loading || !selectedWeek}
                className={`min-h-[44px] px-6 py-2 rounded-lg text-sm font-medium ${
                  loading
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {loading ? "Generating..." : "Generate Thread"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {threadData && (
            <>
              {/* Header Image Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Header Image
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={threadData.imageUrl}
                      download={`weekly-scorecard-${threadData.week}.png`}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-black"
                    >
                      Download PNG
                    </a>
                  </div>
                </div>
                <div className="bg-black/60 border border-zinc-800 rounded-2xl overflow-hidden">
                  <img
                    src={threadData.imageUrl}
                    alt="Weekly Scorecard Header"
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {threadData.summary.weeklyScore}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Weekly Score</div>
                </div>
                <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-zinc-100">
                    {threadData.summary.tradingDays}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Trading Days</div>
                </div>
                <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {threadData.summary.overallLevelAccuracy}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Level Accuracy</div>
                </div>
                <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-zinc-100">
                    {threadData.tweets.length}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Tweets in Thread</div>
                </div>
              </div>

              {/* Consolidated Thread Text Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Full Thread ({threadData.tweets.length} tweets)
                  </div>
                  <button
                    onClick={handleCopyThread}
                    className={`min-h-[36px] px-4 py-1.5 rounded-lg text-xs font-medium border ${
                      copiedThread
                        ? "bg-green-600 text-white border-green-500"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}
                  >
                    {copiedThread ? "Copied!" : "Copy Thread"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={threadData.threadForCopy}
                  rows={15}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-zinc-200 font-mono text-sm resize-none"
                />
              </div>
            </>
          )}

          {!threadData && !loading && !error && (
            <div className="text-center py-12 text-zinc-500">
              Select a week and click "Generate Thread" to create your weekly scorecard.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
