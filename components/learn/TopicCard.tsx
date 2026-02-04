import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface TopicCardProps {
  title: string;
  description: string;
  time: string;
  href: string;
  icon: ReactNode;
  badge?: string;
}

export function TopicCard({ title, description, time, href, icon, badge }: TopicCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <Card className="h-full border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-[0_20px_40px_rgba(15,23,42,0.4)]">
        <CardHeader className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              {icon}
            </div>
            {badge ? <Badge variant="outline">{badge}</Badge> : null}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-6 pt-0 sm:px-6">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-4 flex items-center text-xs font-medium text-primary">
            Read lesson <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
