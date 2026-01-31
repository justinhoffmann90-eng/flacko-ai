"use client";

import { WeeklyLessons } from "@/types/weekly-review";

interface LessonsGridProps {
  lessons: WeeklyLessons;
}

export function LessonsGrid({ lessons }: LessonsGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* What Worked */}
        <div className="bg-muted rounded-xl p-4">
          <h4 className="text-sm font-medium text-green-500 mb-3 flex items-center gap-2">
            ✅ What Worked
          </h4>
          <ul className="space-y-2 text-sm text-foreground">
            {lessons.what_worked.length > 0 ? (
              lessons.what_worked.map((item, i) => (
                <li key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0">
                  {item}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground/50 italic">No items recorded</li>
            )}
          </ul>
        </div>

        {/* What Didn't Work */}
        <div className="bg-muted rounded-xl p-4">
          <h4 className="text-sm font-medium text-red-500 mb-3 flex items-center gap-2">
            ❌ What Didn&apos;t
          </h4>
          <ul className="space-y-2 text-sm text-foreground">
            {lessons.what_didnt.length > 0 ? (
              lessons.what_didnt.map((item, i) => (
                <li key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0">
                  {item}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground/50 italic">No items recorded</li>
            )}
          </ul>
        </div>
      </div>

      {/* Lessons to Carry Forward */}
      {lessons.lessons_forward.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-500 mb-3 flex items-center gap-2">
            💡 Lessons to Carry Forward
          </h4>
          <ul className="space-y-2 text-sm text-foreground">
            {lessons.lessons_forward.map((item, i) => (
              <li key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0">
                {item.split(/\*\*([^*]+)\*\*/).map((part, j) =>
                  j % 2 === 1 ? (
                    <strong key={j} className="text-foreground font-medium">
                      {part}
                    </strong>
                  ) : (
                    part
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
