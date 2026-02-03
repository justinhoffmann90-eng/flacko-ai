/**
 * Daily Mode Card Generator
 * 
 * Generates the Daily Mode Card visual asset for X posting.
 * Uses existing daily-chart tool from ~/clawd/tools/daily-chart/
 * 
 * Output: Image URL (stored in Supabase storage)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

interface DailyModeCardResult {
  text?: string;
  imageUrl?: string;
  error?: string;
}

export async function generateDailyModeCard(date: string): Promise<DailyModeCardResult> {
  try {
    const supabase = await createServiceClient();

    // Get the report for this date
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("report_date", date)
      .single();

    if (reportError || !report) {
      return { error: "Report not found for this date" };
    }

    // Path to daily chart tool
    const chartToolPath = path.join(os.homedir(), "clawd", "tools", "daily-chart");
    const reportPath = path.join(
      os.homedir(),
      "trading_inputs",
      "daily-reports",
      `TSLA_Daily_Report_${date}.md`
    );

    // Check if report file exists
    try {
      await fs.access(reportPath);
    } catch {
      return { error: `Report file not found at ${reportPath}` };
    }

    // Generate the chart HTML
    const { stdout, stderr } = await execAsync(
      `cd ${chartToolPath} && node generate-chart.js ${reportPath}`,
      { maxBuffer: 1024 * 1024 * 10 }
    );

    if (stderr) {
      console.error("Chart generation stderr:", stderr);
    }

    // Read the generated HTML
    const chartHtmlPath = path.join(chartToolPath, "chart-output.html");
    const htmlContent = await fs.readFile(chartHtmlPath, "utf-8");

    // For now, return the HTML content and a placeholder for image generation
    // In production, this would use Puppeteer to generate an image
    // and upload to Supabase storage
    
    // TODO: Implement Puppeteer screenshot + Supabase storage upload
    const imageUrl = await generateImageFromHtml(htmlContent, date);

    return {
      imageUrl,
      text: `Daily Mode Card generated for ${date}`,
    };
  } catch (error) {
    console.error("Daily mode card generation error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function generateImageFromHtml(htmlContent: string, date: string): Promise<string> {
  // This is a placeholder implementation
  // In production, use Puppeteer to screenshot and upload to Supabase storage
  
  // For now, we'll save the HTML to a temporary location
  // and return a file:// URL
  const tempDir = path.join(os.homedir(), "clawd", "temp");
  await fs.mkdir(tempDir, { recursive: true });
  
  const tempHtmlPath = path.join(tempDir, `daily-mode-card-${date}.html`);
  await fs.writeFile(tempHtmlPath, htmlContent);
  
  // Return the file path for local preview
  // TODO: Replace with actual image URL from Supabase storage
  return `file://${tempHtmlPath}`;
}
