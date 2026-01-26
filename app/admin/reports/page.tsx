"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Upload, FileText } from "lucide-react";

export default function AdminReportsPage() {
  const [markdown, setMarkdown] = useState("");
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    warnings: string[];
    data?: {
      mode: string;
      close: number;
      masterEject: number;
      alertsCount: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setError("Please upload a .md or .txt file");
      return;
    }

    try {
      const text = await file.text();
      setMarkdown(text);
      setError(null);
      setParseResult(null);
    } catch (err) {
      setError("Failed to read file");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleParse = async () => {
    if (!markdown.trim()) return;

    setParsing(true);
    setError(null);
    setParseResult(null);

    try {
      const res = await fetch("/api/reports/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setParseResult(data);
      }
    } catch (err) {
      setError("Failed to parse report");
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!parseResult?.success && parseResult?.warnings && parseResult.warnings.length > 3) {
      setError("Too many warnings to publish. Please fix the report format.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // Go to dashboard to see the published report
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Failed to upload report");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Report</h1>
        <p className="text-muted-foreground mt-2">
          Upload a markdown file or paste the daily report content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Content</CardTitle>
          <CardDescription>
            Upload a .md file or paste the full report markdown below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Button */}
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".md,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose .md File
            </Button>
            {markdown && (
              <span className="text-sm text-muted-foreground">
                {markdown.length.toLocaleString()} characters loaded
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or paste markdown
              </span>
            </div>
          </div>

          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# TSLA Daily Report..."
            className="min-h-[400px] font-mono text-sm"
          />

          <div className="flex space-x-4">
            <Button onClick={handleParse} loading={parsing} disabled={!markdown.trim()}>
              Parse Report
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMarkdown("");
                setParseResult(null);
                setError(null);
              }}
              disabled={!markdown}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {parseResult.success || (parseResult.warnings?.length || 0) <= 2 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Parse Successful</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Parse Completed with Warnings</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Extracted Data Preview */}
            {parseResult.data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <Badge
                    variant={
                      parseResult.data.mode as "green" | "yellow" | "red"
                    }
                    className="mt-1"
                  >
                    {parseResult.data.mode.toUpperCase()}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Close Price</p>
                  <p className="text-xl font-bold">${parseResult.data.close}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Master Eject</p>
                  <p className="text-xl font-bold">
                    ${parseResult.data.masterEject}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Alerts</p>
                  <p className="text-xl font-bold">
                    {parseResult.data.alertsCount}
                  </p>
                </div>
              </div>
            )}

            {/* Warnings */}
            {parseResult.warnings && parseResult.warnings.length > 0 && (
              <div>
                <p className="font-medium mb-2">Warnings:</p>
                <ul className="list-disc list-inside space-y-1">
                  {parseResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 dark:text-yellow-500">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              loading={uploading}
              className="w-full"
              size="lg"
              disabled={!parseResult.data?.close || !parseResult.data?.masterEject}
            >
              <Upload className="h-4 w-4 mr-2" />
              Publish Report
            </Button>

            {(!parseResult.data?.close || !parseResult.data?.masterEject) && (
              <p className="text-sm text-red-500 text-center">
                Cannot publish: missing required data (price or master eject)
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
