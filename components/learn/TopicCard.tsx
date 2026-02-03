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
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:border-primary/60 hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{time}</p>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description}
        </CardContent>
      </Card>
    </Link>
  );
}
