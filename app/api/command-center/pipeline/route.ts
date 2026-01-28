import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET() {
  try {
    const homeDir = os.homedir();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const steps = [];

    // Step 1: Screenshots Captured (3:00p CT)
    const screenshotDir = path.join(homeDir, "Desktop", "Clawd Screenshots", today);
    let screenshotStatus = "pending";
    let screenshotDetails = "";
    let screenshotTimestamp = null;

    if (fs.existsSync(screenshotDir)) {
      const files = fs.readdirSync(screenshotDir);
      const count = files.length;
      screenshotStatus = count >= 10 ? "complete" : "incomplete";
      screenshotDetails = `${count} files captured (expected: 10-11)`;
      
      // Get most recent file timestamp
      if (files.length > 0) {
        const stats = fs.statSync(path.join(screenshotDir, files[0]));
        screenshotTimestamp = stats.mtime.toISOString();
      }
    } else {
      screenshotDetails = "Directory not found";
    }

    steps.push({
      id: "screenshots",
      name: "Screenshots Captured",
      status: screenshotStatus,
      timestamp: screenshotTimestamp,
      details: screenshotDetails,
      expectedTime: "3:00p CT"
    });

    // Step 2 & 3: Report Generated & MD File Saved
    const dailyReportsDir = path.join(homeDir, "trading_inputs", "daily-reports");
    let reportStatus = "pending";
    let reportDetails = "";
    let reportTimestamp = null;
    let latestReportDate = null;

    if (fs.existsSync(dailyReportsDir)) {
      const files = fs.readdirSync(dailyReportsDir)
        .filter(f => f.startsWith("TSLA_Daily_Report_") && f.endsWith(".md"))
        .map(f => {
          const filePath = path.join(dailyReportsDir, f);
          const stats = fs.statSync(filePath);
          const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/);
          return {
            filename: f,
            date: dateMatch ? dateMatch[1] : null,
            modified: stats.mtime.toISOString(),
            modifiedMs: stats.mtimeMs
          };
        })
        .sort((a, b) => b.modifiedMs - a.modifiedMs);

      if (files.length > 0) {
        const latest = files[0];
        latestReportDate = latest.date;
        
        // Check if report is from today or yesterday (reports generated after market close)
        const reportDate = new Date(latest.date + "T00:00:00");
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (latest.date === today || latest.date === yesterdayStr) {
          reportStatus = "complete";
          reportDetails = `${latest.filename} (${latest.date})`;
          reportTimestamp = latest.modified;
        } else {
          reportStatus = "stale";
          reportDetails = `Latest: ${latest.filename} (${latest.date})`;
          reportTimestamp = latest.modified;
        }
      } else {
        reportDetails = "No reports found";
      }
    } else {
      reportDetails = "Directory not found";
    }

    steps.push({
      id: "report-saved",
      name: "MD File Saved",
      status: reportStatus,
      timestamp: reportTimestamp,
      details: reportDetails,
      expectedTime: "After Claude generates"
    });

    // Step 4: Key Levels Extracted
    const keyLevelsPath = path.join(homeDir, "trading_inputs", "key_levels.json");
    let keyLevelsStatus = "pending";
    let keyLevelsDetails = "";
    let keyLevelsTimestamp = null;

    if (fs.existsSync(keyLevelsPath)) {
      const stats = fs.statSync(keyLevelsPath);
      keyLevelsTimestamp = stats.mtime.toISOString();
      
      const content = fs.readFileSync(keyLevelsPath, "utf-8");
      const data = JSON.parse(content);
      
      const reportDate = data.reportDate;
      const levelCount = data.levels?.length || 0;
      const masterEject = data.quickReference?.masterEject || data.tsla?.masterEject;
      
      // Check if key levels match latest report
      if (reportDate === latestReportDate) {
        keyLevelsStatus = "complete";
        keyLevelsDetails = `${levelCount} levels, Master Eject: $${masterEject}, Report: ${reportDate}`;
      } else if (reportDate) {
        keyLevelsStatus = "out-of-sync";
        keyLevelsDetails = `Levels from ${reportDate}, but report is ${latestReportDate}`;
      } else {
        keyLevelsStatus = "incomplete";
        keyLevelsDetails = "Missing reportDate field";
      }
    } else {
      keyLevelsDetails = "File not found";
    }

    steps.push({
      id: "key-levels",
      name: "Key Levels Extracted",
      status: keyLevelsStatus,
      timestamp: keyLevelsTimestamp,
      details: keyLevelsDetails,
      expectedTime: "After MD upload"
    });

    // Step 5: Price Alerts Active
    let priceAlertsStatus = "pending";
    let priceAlertsDetails = "";
    let priceAlertsTimestamp = null;

    try {
      const supabaseUrl = "https://rctbqtemkahdbifxrqom.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseKey) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/system_config?key=eq.alert_system_status&select=*`,
          {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data[0] && data[0].value) {
            const lastRun = data[0].value.last_run;
            const lastPrice = data[0].value.last_price;
            priceAlertsTimestamp = lastRun;
            
            // Check if last run was within 5 minutes (for 1-min checks)
            const lastRunDate = new Date(lastRun);
            const minutesAgo = Math.floor((now.getTime() - lastRunDate.getTime()) / 1000 / 60);
            
            // Market hours: 8am-4pm CT (14:00-22:00 UTC)
            const hour = now.getUTCHours();
            const isMarketHours = hour >= 14 && hour < 22 && now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
            
            if (minutesAgo <= 5) {
              priceAlertsStatus = "complete";
              priceAlertsDetails = `Active - Last: ${minutesAgo}m ago, Price: $${lastPrice}`;
            } else if (isMarketHours) {
              priceAlertsStatus = "stale";
              priceAlertsDetails = `⚠️ STALE - Last run: ${minutesAgo}m ago`;
            } else {
              priceAlertsStatus = "complete";
              priceAlertsDetails = `Outside market hours - Last: ${minutesAgo}m ago`;
            }
          }
        }
      }
    } catch (error) {
      priceAlertsDetails = "Failed to check Supabase";
    }

    steps.push({
      id: "price-alerts",
      name: "Price Alerts Active",
      status: priceAlertsStatus,
      timestamp: priceAlertsTimestamp,
      details: priceAlertsDetails,
      expectedTime: "Every 1 min (market hours)"
    });

    // Step 6: Ready for Morning Brief
    const allComplete = steps.every(s => s.status === "complete");
    const anyFailed = steps.some(s => s.status === "incomplete" || s.status === "stale" || s.status === "out-of-sync");
    
    let readyStatus = "pending";
    if (allComplete) {
      readyStatus = "complete";
    } else if (anyFailed) {
      readyStatus = "blocked";
    }

    steps.push({
      id: "ready",
      name: "Ready for Morning Brief",
      status: readyStatus,
      timestamp: allComplete ? new Date().toISOString() : null,
      details: allComplete ? "All prerequisites met" : "Waiting on upstream steps",
      expectedTime: "Before 8:00a CT"
    });

    // Get current report and key levels for verification display
    let verificationData = null;
    if (fs.existsSync(keyLevelsPath)) {
      const klContent = fs.readFileSync(keyLevelsPath, "utf-8");
      const klData = JSON.parse(klContent);
      verificationData = {
        reportDate: klData.reportDate,
        reportFile: latestReportDate ? `TSLA_Daily_Report_${latestReportDate}.md` : null,
        masterEject: klData.quickReference?.masterEject || klData.tsla?.masterEject,
        callWall: klData.quickReference?.callWall || klData.tsla?.callWall,
        keyGammaStrike: klData.quickReference?.keyGammaStrike || klData.tsla?.keyGammaStrike,
        hedgeWall: klData.quickReference?.hedgeWall || klData.tsla?.hedgeWall,
        levelCount: klData.levels?.length || 0,
        lastUpdated: klData.lastUpdated,
        source: klData.source
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      steps: steps,
      summary: {
        total: steps.length,
        complete: steps.filter(s => s.status === "complete").length,
        pending: steps.filter(s => s.status === "pending").length,
        blocked: steps.filter(s => s.status === "blocked" || s.status === "incomplete" || s.status === "stale" || s.status === "out-of-sync").length
      },
      verification: verificationData
    });

  } catch (error: any) {
    console.error("Pipeline API error:", error);
    return NextResponse.json(
      { error: "Failed to check pipeline status", details: error.message },
      { status: 500 }
    );
  }
}
