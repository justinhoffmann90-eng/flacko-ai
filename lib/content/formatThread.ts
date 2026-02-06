/**
 * Weekly Thread Formatter
 *
 * LORD PRETTY FLACKO PERSONA
 * Converts weekly aggregate data into battlefield-style thread for X posting.
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
 * Get grade based on score
 */
function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

/**
 * Get battlefield sentiment based on weekly score
 */
function getBattlefieldSentiment(score: number): string {
  if (score >= 90) return "exceptional week. the war room was locked in.";
  if (score >= 80) return "strong week. structure provided edge.";
  if (score >= 70) return "solid week. defended key positions.";
  if (score >= 60) return "mixed week. some battles won, some lessons learned.";
  return "challenging week. survived to fight again.";
}

/**
 * Generate "What Worked" insights with battlefield context
 */
function generateWhatWorked(data: WeeklyAggregate): string[] {
  const points: string[] = [];

  // Level accuracy highlight
  if (data.overallLevelAccuracy >= 80) {
    points.push(`level accuracy at ${formatPct(data.overallLevelAccuracy)} — dealer positioning provided reliable edge`);
  } else if (data.totalLevelsHit >= 3) {
    points.push(`${data.totalLevelsHit} key defensive lines held — structure worked`);
  }

  // Mode distribution insight
  const modes = data.modeBreakdown;
  if (modes.green.days > 0 && modes.green.avgScore >= 75) {
    points.push(`green mode days averaged ${formatPct(modes.green.avgScore)} — tailwinds delivered`);
  }
  if (modes.yellow.days >= 2 && modes.yellow.avgScore >= 70) {
    points.push(`yellow mode execution on point — patient positioning paid`);
  }

  // Best day callout
  if (data.bestDay && data.bestDay.score >= 85) {
    const bestDate = formatShortDate(data.bestDay.date);
    points.push(`${bestDate} standout at ${formatPct(data.bestDay.score)} — textbook execution`);
  }

  // Consistency
  if (data.tradingDays >= 4 && data.weeklyScore >= 70) {
    points.push(`consistent execution across ${data.tradingDays} trading days`);
  }

  return points.slice(0, 3);
}

/**
 * Generate "What Didn't Work" insights
 */
function generateWhatDidntWork(data: WeeklyAggregate): string[] {
  const points: string[] = [];

  // Broken levels
  if (data.totalLevelsBroken > 0) {
    points.push(`${data.totalLevelsBroken} defensive lines breached — volatility exceeded structure`);
  }

  // Weak mode days
  const modes = data.modeBreakdown;
  if (modes.red.days > 0 && modes.red.avgScore < 60) {
    points.push(`red mode days underperformed — risk management critical in chaos`);
  }
  if (modes.orange.days > 0 && modes.orange.avgScore < 50) {
    points.push(`orange day execution needs work — size down when uncertain`);
  }

  // Worst day callout
  if (data.worstDay && data.worstDay.score < 50) {
    const worstDate = formatShortDate(data.worstDay.date);
    points.push(`${worstDate} at ${formatPct(data.worstDay.score)} — study the losses`);
  }

  // Low trading days
  if (data.tradingDays < 4) {
    points.push(`only ${data.tradingDays} trading days captured — incomplete data`);
  }

  return points.slice(0, 2);
}

/**
 * Format the weekly scorecard thread as an array of tweets
 * LORD PRETTY FLACKO PERSONA — battlefield debrief
 */
export function formatWeeklyThread(data: WeeklyAggregate): Tweet[] {
  const tweets: Tweet[] = [];
  let index = 1;

  // Tweet 1: Header with battlefield briefing style
  const grade = getGrade(data.weeklyScore);
  const sentiment = getBattlefieldSentiment(data.weeklyScore);
  const header = `weekly scorecard: ${data.weekLabel}\n\n` +
    `${data.weeklyScore}% accuracy | grade: ${grade}\n\n` +
    `${sentiment}\n\n` +
    `battlefield report — thread:`;

  tweets.push({
    index: index++,
    text: header.toLowerCase(),
    isHeader: true,
    charCount: header.length,
  });

  // Tweet 2: Mode breakdown — tactical overview
  const modeLines: string[] = [];
  const modes = data.modeBreakdown;

  if (modes.green.days > 0) {
    modeLines.push(`${MODE_EMOJI.green} green: ${modes.green.days}d @ ${formatPct(modes.green.avgScore)} — tailwind days`);
  }
  if (modes.yellow.days > 0) {
    modeLines.push(`${MODE_EMOJI.yellow} yellow: ${modes.yellow.days}d @ ${formatPct(modes.yellow.avgScore)} — mixed conditions`);
  }
  if (modes.orange.days > 0) {
    modeLines.push(`${MODE_EMOJI.orange} orange: ${modes.orange.days}d @ ${formatPct(modes.orange.avgScore)} — headwind building`);
  }
  if (modes.red.days > 0) {
    modeLines.push(`${MODE_EMOJI.red} red: ${modes.red.days}d @ ${formatPct(modes.red.avgScore)} — defensive mode`);
  }

  if (modeLines.length > 0) {
    const modeTweet = `tactical breakdown:\n\n${modeLines.join("\n")}\n\n${data.tradingDays} trading days analyzed.`;
    tweets.push({
      index: index++,
      text: modeTweet.toLowerCase(),
      isHeader: false,
      charCount: modeTweet.length,
    });
  }

  // Tweet 3: Daily highlights — key battles
  const notableDays = selectNotableDays(data.dayScores);

  if (notableDays.length > 0) {
    const dayLines = notableDays.map(day => {
      const emoji = MODE_EMOJI[day.mode];
      const dateLabel = formatShortDate(day.date);
      const changePct = day.ohlc.change_pct;
      const changeStr = changePct >= 0 ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`;
      return `${emoji} ${dateLabel}: ${formatPct(day.accuracy)} (tsla ${changeStr})`;
    });

    const dayTweet = `key battles:\n\n${dayLines.join("\n")}`;
    tweets.push({
      index: index++,
      text: dayTweet.toLowerCase(),
      isHeader: false,
      charCount: dayTweet.length,
    });
  }

  // Tweet 4: Level accuracy stats with explanation
  const levelTweet = `defensive line performance:\n\n` +
    `${data.totalLevelsHit} levels held — dealer positioning provided edge\n` +
    `${data.totalLevelsBroken} levels breached — volatility exceeded structure\n` +
    `${data.totalLevelsNotTested} not tested — range stayed contained\n\n` +
    `overall: ${formatPct(data.overallLevelAccuracy)}`;
  
  tweets.push({
    index: index++,
    text: levelTweet.toLowerCase(),
    isHeader: false,
    charCount: levelTweet.length,
  });

  // Tweet 5: Analysis — what worked, what didn't
  const whatWorked = generateWhatWorked(data);
  const whatDidnt = generateWhatDidntWork(data);

  let analysisTweet = `after-action review:\n\n`;
  
  if (whatWorked.length > 0) {
    analysisTweet += "what worked:\n";
    whatWorked.forEach(point => {
      analysisTweet += `+ ${point}\n`;
    });
  }
  
  if (whatDidnt.length > 0) {
    analysisTweet += "\nlessons:\n";
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
    text: analysisTweet.toLowerCase().trim(),
    isHeader: false,
    charCount: analysisTweet.trim().length,
  });

  // Tweet 6: CTA — soldier reminder
  const ctaTweet = `full transparency. this is how we improve.\n\n` +
    `track record + accuracy dashboard:\n` +
    `flacko.ai/accuracy\n\n` +
    `join the war room.`;
  
  tweets.push({
    index: index++,
    text: ctaTweet.toLowerCase(),
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
