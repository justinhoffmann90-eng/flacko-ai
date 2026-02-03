import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TopicCardProps {
  title: string;
  description: string;
  time: string;
  href: string;
  icon: ReactNode;
}

export function TopicCard({ title, description, time, href, icon }: TopicCardProps) {
  return (
    <Link href={href} className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
      <Card className="h-full transition-all hover:border-primary/60 hover:shadow-md">
        <CardHeader className="space-y-3 p-4 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{time}</p>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground px-4 pb-5 sm:px-6 sm:pb-6 pt-0">
          {description}
        </CardContent>
      </Card>
    </Link>
  );
}
