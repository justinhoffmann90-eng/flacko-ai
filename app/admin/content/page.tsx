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
