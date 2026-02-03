import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ModeCard } from "@/components/learn/ModeCard";
import { Button } from "@/components/ui/button";
import { getLearnContent, getLearnSlugs } from "@/lib/learn/getContent";

const modeCards = [
  {
    label: "GREEN MODE — Full send",
    cap: "up to 25%",
    description: "Market conditions favor aggressive positioning and continuation.",
    color: "#22c55e",
  },
  {
    label: "YELLOW MODE — Proceed with caution",
    cap: "15% or less",
    description: "Mixed signals. Be selective and wait for cleaner setups.",
    color: "#eab308",
  },
  {
    label: "ORANGE MODE — Elevated caution",
    cap: "10% or less",
    description: "Unfavorable conditions. Only high‑conviction plays.",
    color: "#f97316",
  },
  {
    label: "RED MODE — Defensive",
    cap: "5% or less",
    description: "Protect capital. Nibbles only, if anything.",
    color: "#ef4444",
  },
];

export function generateStaticParams() {
  return getLearnSlugs().map((slug) => ({ slug }));
}

export default function LearnTopicPage({ params }: { params: { slug: string } }) {
  const topic = getLearnContent(params.slug);

  if (!topic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Flacko AI Education</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold">{topic.title}</h1>
            {topic.description ? (
              <p className="mt-3 text-lg text-muted-foreground">{topic.description}</p>
            ) : null}
            {topic.readingTime ? (
              <p className="mt-2 text-sm text-muted-foreground">{topic.readingTime} read</p>
            ) : null}
          </div>
          <Button asChild variant="outline">
            <Link href="/learn">Back to Hub</Link>
          </Button>
        </div>

        {params.slug === "modes" ? (
          <div className="mb-10 grid gap-4 md:grid-cols-2">
            {modeCards.map((card) => (
              <ModeCard key={card.label} {...card} />
            ))}
          </div>
        ) : null}

        <div className="max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h2: ({ children }) => (
                <h2 className="mt-8 text-2xl font-semibold text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-6 text-xl font-semibold text-foreground/90">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mt-4 text-base leading-relaxed text-foreground/80">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground/80">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mt-4 list-decimal space-y-2 pl-6 text-foreground/80">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-base">{children}</li>
              ),
              a: ({ children, href }) => (
                <a className="text-primary underline" href={href}>
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="text-foreground">{children}</strong>
              ),
            }}
          >
            {topic.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
