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
      className="group block h-full rounded-xl sm:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <Card className="h-full border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-all duration-300 group-hover:-translate-y-0.5 sm:group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-[0_10px_30px_rgba(15,23,42,0.3)] sm:group-hover:shadow-[0_20px_40px_rgba(15,23,42,0.4)]">
        <CardHeader className="space-y-2 sm:space-y-4 p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/15 text-primary shrink-0">
              {icon}
            </div>
            {badge ? <Badge variant="outline" className="text-xs shrink-0">{badge}</Badge> : null}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-5 pt-0 sm:px-5 sm:pb-6 lg:px-6">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
          <div className="mt-3 sm:mt-4 flex items-center text-xs font-medium text-primary">
            Read lesson <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
