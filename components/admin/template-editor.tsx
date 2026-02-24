"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Using native select to avoid Radix dependency issues
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Save, 
  RotateCcw, 
  Code, 
  Eye, 
  Variable, 
  CheckCircle2, 
  AlertTriangle,
  FileEdit,
  Mail,
  MessageSquare
} from "lucide-react";

interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: "discord" | "email";
  variables: TemplateVariable[];
  content: string;
  isCustom: boolean;
  updatedAt: string | null;
}

export function TemplateEditor() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update content when template selection changes
  useEffect(() => {
    if (selectedTemplate) {
      setContent(selectedTemplate.content);
      setOriginalContent(selectedTemplate.content);
      setHasChanges(false);
      setError(null);
      setSuccess(null);
    }
  }, [selectedTemplateId, selectedTemplate]);

  // Track changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/templates");
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.templates || !Array.isArray(data.templates)) {
        throw new Error("Invalid response format");
      }
      
      setTemplates(data.templates);
      
      // Select first template by default
      if (data.templates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data.templates[0].id);
      }
    } catch (err) {
      console.error("Template fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplateId || !content) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplateId,
          content,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }
      
      setOriginalContent(content);
      setSuccess("Template saved successfully");
      setHasChanges(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedTemplateId) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplateId,
          resetToDefault: true,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset template");
      }
      
      setContent(data.content || "");
      setOriginalContent(data.content || "");
      setSuccess("Template reset to default");
      setHasChanges(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset template");
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.getElementById("template-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + `{{${variableName}}}` + content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableName.length + 4, start + variableName.length + 4);
    }, 0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "discord":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <FileEdit className="h-4 w-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading templates...</span>
        </CardContent>
      </Card>
    );
  }

  // Error state with no templates
  if (error && templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            AI Template Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchTemplates} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              AI Template Editor
            </CardTitle>
            <CardDescription>
              Customize message templates for Discord and Email notifications
            </CardDescription>
          </div>
          {selectedTemplate?.isCustom && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Custom
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selector */}
        <div className="space-y-2">
          <label htmlFor="template-select" className="text-sm font-medium">Select Template</label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="" disabled>Choose a template to edit</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.category === "discord" ? "📱 " : "📧 "}
                {template.name}
                {template.isCustom ? " (Custom)" : ""}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="text-sm text-muted-foreground">
              {selectedTemplate.description}
            </p>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Editor - only show when template is selected */}
        {selectedTemplate && (
          <>
            {/* Variables Panel */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Variable className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Available Variables</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.variables.map((variable) => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable.name)}
                    title={`${variable.description} (e.g., ${variable.example})`}
                    className="text-xs"
                  >
                    {`{{${variable.name}}}`}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click any variable to insert it at cursor position
              </p>
            </div>

            {/* Simple Tab Buttons */}
            <div className="flex gap-2 border-b pb-2">
              <Button
                variant={activeTab === "edit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("edit")}
                className="gap-2"
              >
                <Code className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant={activeTab === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("preview")}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>

            {/* Editor Content */}
            {activeTab === "edit" ? (
              <textarea
                id="template-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[400px] p-4 font-mono text-sm bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                spellCheck={false}
              />
            ) : (
              <div className="h-[400px] rounded-lg border bg-zinc-950 p-4 overflow-auto">
                {selectedTemplate.category === "email" ? (
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                    {content}
                  </pre>
                )}
              </div>
            )}

            {/* Status and Actions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {hasChanges ? (
                    <span className="text-yellow-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Unsaved changes
                    </span>
                  ) : selectedTemplate.isCustom ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved
                      {selectedTemplate.updatedAt && ` • ${new Date(selectedTemplate.updatedAt).toLocaleString()}`}
                    </span>
                  ) : (
                    <span>Using default template</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedTemplate.isCustom && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={saving}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset to Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Template
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
