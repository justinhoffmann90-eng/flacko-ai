import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET() {
  try {
    const homeDir = os.homedir();
    const dailyReportsDir = path.join(homeDir, "trading_inputs", "daily-reports");
    const keyLevelsPath = path.join(homeDir, "trading_inputs", "key_levels.json");

    // Get latest report
    let reportData = {
      filename: "none",
      date: "none",
      modified: 0
    };

    if (fs.existsSync(dailyReportsDir)) {
      const files = fs.readdirSync(dailyReportsDir)
        .filter(f => f.startsWith("TSLA_Daily_Report_") && f.endsWith(".md"))
        .map(f => {
          const filePath = path.join(dailyReportsDir, f);
          const stats = fs.statSync(filePath);
          return {
            filename: f,
            modified: Math.floor(stats.mtimeMs / 1000)
          };
        })
        .sort((a, b) => b.modified - a.modified);

      if (files.length > 0) {
        reportData.filename = files[0].filename;
        reportData.modified = files[0].modified;
        
        // Extract date from filename (TSLA_Daily_Report_YYYY-MM-DD.md)
        const dateMatch = files[0].filename.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          reportData.date = dateMatch[1];
        }
      }
    }

    // Get key_levels.json
    let keyLevelsData = {
      exists: false,
      modified: 0,
      data: {
        reportDate: "none",
        levels: [],
        quickReference: {
          masterEject: 0,
          callWall: 0,
          keyGammaStrike: 0,
          hedgeWall: 0
        },
        source: "unknown",
        lastUpdated: "unknown"
      }
    };

    if (fs.existsSync(keyLevelsPath)) {
      const stats = fs.statSync(keyLevelsPath);
      keyLevelsData.exists = true;
      keyLevelsData.modified = Math.floor(stats.mtimeMs / 1000);
      
      const content = fs.readFileSync(keyLevelsPath, "utf-8");
      const parsed = JSON.parse(content);
      keyLevelsData.data = {
        reportDate: parsed.reportDate || "none",
        levels: parsed.levels || [],
        quickReference: parsed.quickReference || {
          masterEject: 0,
          callWall: 0,
          keyGammaStrike: 0,
          hedgeWall: 0
        },
        source: parsed.source || "unknown",
        lastUpdated: parsed.lastUpdated || "unknown"
      };
    }

    return NextResponse.json({
      report: reportData,
      keyLevels: keyLevelsData,
      timestamp: Math.floor(Date.now() / 1000)
    });

  } catch (error: any) {
    console.error("Verification API error:", error);
    return NextResponse.json(
      { error: "Failed to load verification data", details: error.message },
      { status: 500 }
    );
  }
}
