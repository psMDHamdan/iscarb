"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Plus, ThumbsUp, MessageCircle, TrendingUp, Lightbulb } from "lucide-react";

export function ResearchInnovationView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "technology",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/research/innovation");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load innovation ideas");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitIdea = async (e: any) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    try {
      setFormLoading(true);
      const response = await fetch("/api/v1/student/research/innovation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to submit idea");

      const newIdea = await response.json();
      setData((prev: any) => ({
        ...prev,
        ideas: [newIdea.data, ...prev.ideas],
        stats: {
          ...prev.stats,
          totalIdeas: prev.stats.totalIdeas + 1,
        },
      }));

      setFormData({ title: "", description: "", category: "technology" });
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit idea");
    } finally {
      setFormLoading(false);
    }
  };

  const handleVote = async (ideaId: string) => {
    try {
      const response = await fetch(`/api/v1/student/research/innovation/${ideaId}/vote`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to vote");

      setData((prev: any) => ({
        ...prev,
        ideas: prev.ideas.map((idea: any) =>
          idea.id === ideaId ? { ...idea, votes: idea.votes + 1, userVoted: true } : idea
        ),
      }));
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const filteredIdeas = !data?.ideas
    ? []
    : filter === "all"
    ? data.ideas
    : data.ideas.filter((idea: any) => idea.category === filter);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "الابتكار والمشاريع الجديدة" : "Innovation & New Projects"}
          description={ar ? "شارك أفكارك المبتكرة والمشاريع الجديدة" : "Share your innovative ideas and new projects"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <PageHeader
          title={ar ? "الابتكار والمشاريع الجديدة" : "Innovation & New Projects"}
          description={ar ? "شارك أفكارك المبتكرة والمشاريع الجديدة" : "Share your innovative ideas and new projects"}
        />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const categories = [
    { id: "all", label: ar ? "الكل" : "All" },
    { id: "technology", label: ar ? "التكنولوجيا" : "Technology" },
    { id: "methodology", label: ar ? "المنهجية" : "Methodology" },
    { id: "collaboration", label: ar ? "التعاون" : "Collaboration" },
    { id: "resource", label: ar ? "الموارد" : "Resources" },
  ];

  return (
    <>
      <PageHeader
        title={ar ? "الابتكار والمشاريع الجديدة" : "Innovation & New Projects"}
        description={ar ? "شارك أفكارك المبتكرة والمشاريع الجديدة" : "Share your innovative ideas and new projects"}
      />

      <div className="space-y-8 pb-12">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي الأفكار" : "Total Ideas"}</p>
              <p className="text-2xl font-bold mt-1">{data?.stats?.totalIdeas || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "الأفكار المقبولة" : "Approved Ideas"}</p>
              <p className="text-2xl font-bold mt-1 text-iscarb-green">{data?.stats?.approvedIdeas || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي الأصوات" : "Total Votes"}</p>
              <p className="text-2xl font-bold mt-1">{data?.stats?.totalVotes || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{ar ? "أفكارك المقبولة" : "Your Approved Ideas"}</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{data?.stats?.myApprovedIdeas || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Submit Idea Button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            {ar ? "إضافة فكرة جديدة" : "Submit New Idea"}
          </Button>
        )}

        {/* Submit Idea Form */}
        {showForm && (
          <Card className="bg-gradient-to-r from-iscarb-green/5 to-blue-500/5 border-iscarb-green/20">
            <CardHeader>
              <CardTitle>{ar ? "شارك فكرتك" : "Share Your Idea"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitIdea} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{ar ? "العنوان" : "Title"}</label>
                  <Input
                    placeholder={ar ? "عنوان الفكرة..." : "Idea title..."}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{ar ? "الفئة" : "Category"}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={formLoading}
                  >
                    <option value="technology">{ar ? "التكنولوجيا" : "Technology"}</option>
                    <option value="methodology">{ar ? "المنهجية" : "Methodology"}</option>
                    <option value="collaboration">{ar ? "التعاون" : "Collaboration"}</option>
                    <option value="resource">{ar ? "الموارد" : "Resources"}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">{ar ? "الوصف" : "Description"}</label>
                  <Textarea
                    placeholder={ar ? "وصف فكرتك بالتفصيل..." : "Describe your idea in detail..."}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-24"
                    disabled={formLoading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={formLoading || !formData.title.trim() || !formData.description.trim()}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {ar ? "جاري الإرسال..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        {ar ? "إرسال الفكرة" : "Submit Idea"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ title: "", description: "", category: "technology" });
                    }}
                    disabled={formLoading}
                  >
                    {ar ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={filter === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Ideas List */}
        {filteredIdeas.length === 0 ? (
          <Card className="text-center p-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">{ar ? "لا توجد أفكار في هذه الفئة" : "No ideas in this category"}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredIdeas.map((idea: any) => (
              <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base">{idea.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ar ? "مقدم من:" : "Submitted by:"} {idea.submitter?.name || "Anonymous"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={idea.status === "approved" ? "default" : "outline"}>
                        {idea.status?.replace("_", " ").charAt(0).toUpperCase() + idea.status?.slice(1).replace("_", " ")}
                      </Badge>
                      <Badge variant="secondary">{idea.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{idea.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(idea.id)}
                        disabled={idea.userVoted}
                        className={idea.userVoted ? "text-iscarb-green" : ""}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {idea.votes || 0}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {idea.comments || 0}
                      </Button>
                    </div>

                    {idea.status === "approved" && (
                      <div className="flex items-center text-iscarb-green text-sm font-semibold">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {ar ? "مقبول" : "Approved"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
