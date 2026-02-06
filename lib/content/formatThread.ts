/**
 * Weekly Thread Formatter
 *
 * Converts weekly aggregate data into an array of tweets for X posting.
 * Each tweet is under 280 characters.
 */

import { WeeklyAggregate, DayScore } from "@/lib/accuracy/aggregateWeekly";
import { format, parseISO } from "date-fns";

export interface Tweet {
  index: number;
  text: string;
  isHeader: boolean;
  charCount: number;
}

const MODE_EMOJI: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  orange: "🟠",
  red: "🔴",
};

/**
 * Format a percentage with appropriate precision
 */
function formatPct(value: number): string {
  if (value === 100) return "100%";
  if (value >= 10) return `${Math.round(value)}%`;
  return `${value.toFixed(1)}%`;
}

/**
 * Format date as "Mon 1/27"
 */
function formatShortDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "EEE M/d");
}

/**
 * Get grade emoji based on score
 */
function getGradeEmoji(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

/**
 * Get overall sentiment based on weekly score
 */
function getSentiment(score: number): string {
  if (score >= 90) return "Exceptional week";
  if (score >= 80) return "Strong week";
  if (score >= 70) return "Solid week";
  if (score >= 60) return "Mixed week";
  return "Challenging week";
}

/**
 * Generate "What Worked" bullet points
 */
function generateWhatWorked(data: WeeklyAggregate): string[] {
  const points: string[] = [];

  // Level accuracy highlight
  if (data.overallLevelAccuracy >= 80) {
    points.push(`Level accuracy at ${formatPct(data.overallLevelAccuracy)}`);
  } else if (data.totalLevelsHit >= 3) {
    points.push(`${data.totalLevelsHit} key levels held`);
  }

  // Mode distribution insight
  const modes = data.modeBreakdown;
  if (modes.green.days > 0 && modes.green.avgScore >= 75) {
    points.push(`GREEN days averaged ${formatPct(modes.green.avgScore)}`);
  }
  if (modes.yellow.days >= 2 && modes.yellow.avgScore >= 70) {
    points.push(`YELLOW mode execution on point`);
  }

  // Best day callout
  if (data.bestDay && data.bestDay.score >= 85) {
    const bestDate = formatShortDate(data.bestDay.date);
    points.push(`${bestDate} standout at ${formatPct(data.bestDay.score)}`);
  }

  // Consistency
  if (data.tradingDays >= 4 && data.weeklyScore >= 70) {
    points.push(`Consistent execution across ${data.tradingDays} trading days`);
  }

  return points.slice(0, 3); // Max 3 points
}

/**
 * Generate "What Didn't Work" bullet points
 */
function generateWhatDidntWork(data: WeeklyAggregate): string[] {
  const points: string[] = [];

  // Broken levels
  if (data.totalLevelsBroken > 0) {
    points.push(`${data.totalLevelsBroken} levels broken`);
  }

  // Weak mode days
  const modes = data.modeBreakdown;
  if (modes.red.days > 0 && modes.red.avgScore < 60) {
    points.push(`RED mode days underperformed`);
  }
  if (modes.orange.days > 0 && modes.orange.avgScore < 50) {
    points.push(`ORANGE day execution needs work`);
  }

  // Worst day callout
  if (data.worstDay && data.worstDay.score < 50) {
    const worstDate = formatShortDate(data.worstDay.date);
    points.push(`${worstDate} at ${formatPct(data.worstDay.score)} - room to improve`);
  }

  // Low trading days
  if (data.tradingDays < 4) {
    points.push(`Only ${data.tradingDays} trading days captured`);
  }

  return points.slice(0, 2); // Max 2 points
}

/**
 * Format the weekly scorecard thread as an array of tweets
 */
export function formatWeeklyThread(data: WeeklyAggregate): Tweet[] {
  const tweets: Tweet[] = [];
  let index = 1;

  // Tweet 1: Header with headline stat
  const gradeEmoji = getGradeEmoji(data.weeklyScore);
  const sentiment = getSentiment(data.weeklyScore);
  const header = `FLACKO AI WEEKLY SCORECARD\n${data.weekLabel}\n\n${data.weeklyScore}% accuracy | Grade: ${gradeEmoji}\n\n${sentiment}. Here's the breakdown:\n\nTHREAD`;

  tweets.push({
    index: index++,
    text: header,
    isHeader: true,
    charCount: header.length,
  });

  // Tweet 2: Mode breakdown
  const modeLines: string[] = [];
  const modes = data.modeBreakdown;

  if (modes.green.days > 0) {
    modeLines.push(`${MODE_EMOJI.green} GREEN: ${modes.green.days}d @ ${formatPct(modes.green.avgScore)}`);
  }
  if (modes.yellow.days > 0) {
    modeLines.push(`${MODE_EMOJI.yellow} YELLOW: ${modes.yellow.days}d @ ${formatPct(modes.yellow.avgScore)}`);
  }
  if (modes.orange.days > 0) {
    modeLines.push(`${MODE_EMOJI.orange} ORANGE: ${modes.orange.days}d @ ${formatPct(modes.orange.avgScore)}`);
  }
  if (modes.red.days > 0) {
    modeLines.push(`${MODE_EMOJI.red} RED: ${modes.red.days}d @ ${formatPct(modes.red.avgScore)}`);
  }

  if (modeLines.length > 0) {
    const modeTweet = `MODE BREAKDOWN\n\n${modeLines.join("\n")}\n\n${data.tradingDays} trading days analyzed.`;
    tweets.push({
      index: index++,
      text: modeTweet,
      isHeader: false,
      charCount: modeTweet.length,
    });
  }

  // Tweet 3-4: Daily highlights (pick notable days)
  const notableDays = selectNotableDays(data.dayScores);

  if (notableDays.length > 0) {
    const dayLines = notableDays.map(day => {
      const emoji = MODE_EMOJI[day.mode];
      const dateLabel = formatShortDate(day.date);
      const changePct = day.ohlc.change_pct;
      const changeStr = changePct >= 0 ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`;
      return `${emoji} ${dateLabel}: ${formatPct(day.accuracy)} (TSLA ${changeStr})`;
    });

    const dayTweet = `DAILY SCORES\n\n${dayLines.join("\n")}`;
    tweets.push({
      index: index++,
      text: dayTweet,
      isHeader: false,
      charCount: dayTweet.length,
    });
  }

  // Tweet 5: Level accuracy stats
  const levelTweet = `LEVEL ACCURACY\n\n${data.totalLevelsHit} levels hit\n${data.totalLevelsBroken} levels broken\n${data.totalLevelsNotTested} not tested\n\nOverall: ${formatPct(data.overallLevelAccuracy)}`;
  tweets.push({
    index: index++,
    text: levelTweet,
    isHeader: false,
    charCount: levelTweet.length,
  });

  // Tweet 6: What worked / What didn't
  const whatWorked = generateWhatWorked(data);
  const whatDidnt = generateWhatDidntWork(data);

  let analysisTweet = "ANALYSIS\n\n";
  if (whatWorked.length > 0) {
    analysisTweet += "What worked:\n";
    whatWorked.forEach(point => {
      analysisTweet += `+ ${point}\n`;
    });
  }
  if (whatDidnt.length > 0) {
    analysisTweet += "\nRoom to improve:\n";
    whatDidnt.forEach(point => {
      analysisTweet += `- ${point}\n`;
    });
  }

  // Trim if too long
  if (analysisTweet.length > 280) {
    analysisTweet = analysisTweet.slice(0, 277) + "...";
  }

  tweets.push({
    index: index++,
    text: analysisTweet.trim(),
    isHeader: false,
    charCount: analysisTweet.trim().length,
  });

  // Tweet 7: CTA
  const ctaTweet = `Full transparency. This is how we improve.\n\nTrack record + accuracy dashboard:\nflacko.ai/accuracy\n\nJoin the gang.`;
  tweets.push({
    index: index++,
    text: ctaTweet,
    isHeader: false,
    charCount: ctaTweet.length,
  });

  // Validate all tweets are under 280 chars
  tweets.forEach(tweet => {
    if (tweet.charCount > 280) {
      console.warn(`Tweet ${tweet.index} exceeds 280 chars: ${tweet.charCount}`);
    }
  });

  return tweets;
}

/**
 * Select most notable days for highlights
 * Returns 3-5 days based on best, worst, and interesting data
 */
function selectNotableDays(dayScores: DayScore[]): DayScore[] {
  if (dayScores.length <= 5) {
    return dayScores;
  }

  // Sort by accuracy
  const sorted = [...dayScores].sort((a, b) => b.accuracy - a.accuracy);

  // Get best, worst, and middle
  const selected: DayScore[] = [];

  // Best day
  if (sorted.length > 0) {
    selected.push(sorted[0]);
  }

  // Worst day
  if (sorted.length > 1) {
    selected.push(sorted[sorted.length - 1]);
  }

  // Most volatile day (biggest price move)
  const byVolatility = [...dayScores].sort(
    (a, b) => Math.abs(b.ohlc.change_pct) - Math.abs(a.ohlc.change_pct)
  );
  if (byVolatility.length > 0 && !selected.includes(byVolatility[0])) {
    selected.push(byVolatility[0]);
  }

  // Fill remaining spots with median performers
  const remaining = dayScores.filter(d => !selected.includes(d));
  while (selected.length < 5 && remaining.length > 0) {
    const middleIdx = Math.floor(remaining.length / 2);
    selected.push(remaining[middleIdx]);
    remaining.splice(middleIdx, 1);
  }

  // Sort by date for display
  return selected.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Format thread for clipboard copy (concatenated with separators)
 */
export function formatThreadForCopy(tweets: Tweet[]): string {
  return tweets
    .map(tweet => `[${tweet.index}/${tweets.length}]\n${tweet.text}`)
    .join("\n\n---\n\n");
}
