"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
      const response = await fetch("/api/templates");
      
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      
      const data = await response.json();
      setTemplates(data.templates);
      
      // Select first template by default
      if (data.templates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data.templates[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
          content,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save template");
      }
      
      setSuccess("Template saved successfully");
      setOriginalContent(content);
      setHasChanges(false);
      
      // Refresh templates to get updated timestamp
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedTemplateId) return;
    
    if (!confirm("Are you sure you want to reset this template to default? All custom changes will be lost.")) {
      return;
    }
    
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
      
      setContent(data.content);
      setOriginalContent(data.content);
      setSuccess("Template reset to default");
      setHasChanges(false);
      
      // Refresh templates
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
    
    // Restore focus and cursor position
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
          <label className="text-sm font-medium">Select Template</label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a template to edit" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <span>{template.name}</span>
                    {template.isCustom && (
                      <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplate && (
            <p className="text-sm text-muted-foreground">
              {selectedTemplate.description}
            </p>
          )}
        </div>

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

            {/* Editor Tabs */}
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="gap-2">
                  <Code className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-4">
                <textarea
                  id="template-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[400px] p-4 font-mono text-sm bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                  spellCheck={false}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <ScrollArea className="h-[400px] rounded-lg border bg-zinc-950 p-4">
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
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Status and Actions */}
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {hasChanges ? (
                  <span className="text-yellow-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Unsaved changes
                  </span>
                ) : selectedTemplate.isCustom ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Saved{selectedTemplate.updatedAt && ` • ${new Date(selectedTemplate.updatedAt).toLocaleString()}`}
                  </span>
                ) : (
                  <span>Using default template</span>
                )}
              </div>

              <div className="flex gap-2">
                {selectedTemplate.isCustom && (
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={saving}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Default
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
