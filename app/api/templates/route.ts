import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Template definitions with metadata
const TEMPLATE_DEFINITIONS = {
  "discord-alert": {
    id: "discord-alert",
    name: "Discord Alert Message",
    description: "Template for price alert notifications sent to Discord",
    category: "discord",
    variables: [
      { name: "mode", description: "Traffic light mode (green/yellow/orange/red)", example: "green" },
      { name: "positioning", description: "Positioning text", example: "Lean Bullish" },
      { name: "alerts", description: "Array of triggered alerts", example: "[{type: 'upside', price: 250, level_name: 'Call Wall', action: 'Trim 25%'}]" },
    ],
  },
  "discord-report": {
    id: "discord-report",
    name: "Discord New Report Message",
    description: "Template for new daily report notifications sent to Discord",
    category: "discord",
    variables: [
      { name: "mode", description: "Traffic light mode", example: "green" },
      { name: "reportDate", description: "Report date string", example: "Tue, Jan 28" },
      { name: "closePrice", description: "TSLA closing price", example: "250.50" },
      { name: "changePct", description: "Price change percentage", example: "2.5" },
      { name: "alerts", description: "Array of alert levels", example: "[]" },
      { name: "positioning", description: "Positioning guidance", example: "{daily_cap: '15%', vehicle: 'LEAPs', posture: 'Cautious'}" },
      { name: "tiers", description: "Tier signals", example: "{regime: 'green', trend: 'yellow', timing: 'green', flow: 'green'}" },
      { name: "masterEject", description: "Master eject price level", example: "220.00" },
    ],
  },
  "email-alert": {
    id: "email-alert",
    name: "Email Alert Message",
    description: "HTML template for price alert emails",
    category: "email",
    variables: [
      { name: "userName", description: "User's name", example: "John" },
      { name: "alerts", description: "Array of triggered alerts", example: "[]" },
      { name: "currentPrice", description: "Current TSLA price", example: "250.50" },
      { name: "mode", description: "Traffic light mode", example: "green" },
      { name: "reportDate", description: "Report date", example: "Tue, Jan 28" },
    ],
  },
  "email-report": {
    id: "email-report",
    name: "Email New Report Message",
    description: "HTML template for new report notification emails",
    category: "email",
    variables: [
      { name: "userName", description: "User's name", example: "John" },
      { name: "mode", description: "Traffic light mode", example: "green" },
      { name: "reportDate", description: "Report date", example: "Tue, Jan 28" },
      { name: "closePrice", description: "TSLA closing price", example: "250.50" },
      { name: "changePct", description: "Price change percentage", example: "2.5" },
    ],
  },
};

// Default templates (stored in code, can be customized via database)
const DEFAULT_TEMPLATES: Record<string, string> = {
  "discord-alert": `⚡ TSLA Price Alert Triggered!

## {{modeEmoji}} {{mode}} MODE{{#if positioning}} ({{positioning}}){{/if}}

{{#each alerts}}
{{#if (eq type "upside")}}🟢{{else}}🔴{{/if}} **{{price}}** - {{level_name}}
{{#if (eq type "upside")}}📈{{else}}💰{{/if}} {{action}}
{{#if reason}}
_{{reason}}_
{{/if}}
{{/each}}

Flacko AI • Check app for full details`,

  "discord-report": `📊 New TSLA Daily Report

## {{modeEmoji}} {{mode}} MODE
**{{reportDate}}**

{{#if tiers}}
**Tiers:** {{tierEmoji tiers.regime}} Regime | {{tierEmoji tiers.trend}} Trend | {{tierEmoji tiers.timing}} Timing | {{tierEmoji tiers.flow}} Flow
{{/if}}

{{#if positioning}}
**Today's Positioning**
{{#if positioning.daily_cap}}• Daily Cap: {{positioning.daily_cap}}{{/if}}
{{#if positioning.vehicle}}• Vehicle: {{positioning.vehicle}}{{/if}}
{{#if positioning.posture}}• Posture: {{positioning.posture}}{{/if}}
{{/if}}

{{#if upsideAlerts}}
**📈 Take Profit Levels**
{{#each upsideAlerts}}🟢 **{{price}}** — {{level_name}} → {{action}}
{{/each}}
{{/if}}

{{#if downsideAlerts}}
**💰 Buy the Dip Levels**
{{#each downsideAlerts}}🔴 **{{price}}** — {{level_name}} → {{action}}
{{/each}}
{{/if}}

{{#if masterEject}}
**⚠️ Master Eject: {{masterEject}}**
_Daily close below = exit all positions_
{{/if}}`,

  "email-alert": `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <h1 style="color: #f9fafb; margin: 0 0 8px 0; font-size: 24px;">
        TSLA Alert Triggered
      </h1>
      <p style="color: #9ca3af; margin: 0; font-size: 14px;">
        {{reportDate}}
      </p>
    </div>

    <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Current Price</p>
          <p style="color: #f9fafb; margin: 0; font-size: 28px; font-weight: bold;">{{currentPrice}}</p>
        </div>
        <div style="background-color: {{modeColor}}20; border: 1px solid {{modeColor}}; border-radius: 6px; padding: 8px 16px;">
          <span style="color: {{modeColor}}; font-weight: bold; text-transform: uppercase;">{{mode}} MODE</span>
        </div>
      </div>
    </div>

    <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <h2 style="color: #f9fafb; margin: 0 0 16px 0; font-size: 18px;">Triggered Alerts</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #374151;">
            <th style="padding: 12px; text-align: left; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Level</th>
            <th style="padding: 12px; text-align: right; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Price</th>
            <th style="padding: 12px; text-align: left; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Action</th>
          </tr>
        </thead>
        <tbody style="color: #f9fafb;">
          {{#each alerts}}
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #374151;">
              <span style="color: {{typeColor}}; font-weight: bold;">
                {{typeIcon}} {{level_name}}
              </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #374151; text-align: right;">
              {{price}}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #374151;">
              {{action}}
            </td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <div style="text-align: center; padding: 20px;">
      <a href="{{appUrl}}/report" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
        View Full Report
      </a>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        This is an automated alert from Flacko AI.
      </p>
      <p style="margin: 0;">
        <a href="{{appUrl}}/settings" style="color: #9ca3af;">Manage alert settings</a>
      </p>
    </div>
  </div>
</body>
</html>`,

  "email-report": `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <h1 style="color: #f9fafb; margin: 0 0 8px 0; font-size: 24px;">
        New TSLA Report Available
      </h1>
      <p style="color: #9ca3af; margin: 0; font-size: 14px;">
        {{reportDate}}
      </p>
    </div>

    <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background-color: {{modeColor}}20; border: 2px solid {{modeColor}}; border-radius: 8px; padding: 16px 32px;">
          <span style="color: {{modeColor}}; font-weight: bold; font-size: 24px; text-transform: uppercase;">{{mode}} MODE</span>
        </div>
      </div>

      <div style="text-align: center;">
        <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">TSLA Close</p>
        <p style="color: #f9fafb; margin: 0; font-size: 32px; font-weight: bold;">
          {{closePrice}}
          <span style="color: {{changeColor}}; font-size: 18px; margin-left: 8px;">
            {{changePct}}%
          </span>
        </p>
      </div>
    </div>

    <div style="text-align: center; padding: 20px;">
      <a href="{{appUrl}}/report" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Read Today's Report
      </a>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">
        <a href="{{appUrl}}/settings" style="color: #9ca3af;">Unsubscribe from report emails</a>
      </p>
    </div>
  </div>
</body>
</html>`,
};

// Verify admin authentication
async function verifyAdmin(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }
  
  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  
  if (userError || !userData?.is_admin) {
    return { error: "Forbidden - Admin access required", status: 403 };
  }
  
  return { user, supabase };
}

// GET /api/templates - List all templates
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  
  const { supabase } = auth;
  
  try {
    // Fetch any custom templates from database
    const { data: customTemplates, error } = await supabase
      .from("templates")
      .select("id, content, updated_at")
      .order("id");
    
    if (error) {
      console.error("Error fetching templates:", error);
    }
    
    // Build response with metadata and content
    const templates = Object.values(TEMPLATE_DEFINITIONS).map((def) => {
      const custom = customTemplates?.find((t) => t.id === def.id);
      return {
        ...def,
        content: custom?.content || DEFAULT_TEMPLATES[def.id] || "",
        isCustom: !!custom,
        updatedAt: custom?.updated_at || null,
      };
    });
    
    return NextResponse.json({ templates });
  } catch (err) {
    console.error("Error in templates GET:", err);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/templates - Update a template
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  
  const { supabase } = auth;
  
  try {
    const body = await request.json();
    const { id, content, resetToDefault } = body;
    
    // Validate template ID
    if (!id || !TEMPLATE_DEFINITIONS[id as keyof typeof TEMPLATE_DEFINITIONS]) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }
    
    // If reset to default, delete the custom template
    if (resetToDefault) {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error resetting template:", error);
        return NextResponse.json(
          { error: "Failed to reset template" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: "Template reset to default",
        content: DEFAULT_TEMPLATES[id],
      });
    }
    
    // Validate content
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }
    
    // Upsert the template
    const { data, error } = await supabase
      .from("templates")
      .upsert({
        id,
        content,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving template:", error);
      return NextResponse.json(
        { error: "Failed to save template" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Template saved successfully",
      template: {
        ...TEMPLATE_DEFINITIONS[id as keyof typeof TEMPLATE_DEFINITIONS],
        content: data.content,
        isCustom: true,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error("Error in templates POST:", err);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}
