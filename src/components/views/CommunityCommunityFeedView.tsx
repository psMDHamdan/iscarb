"use client";
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThumbsUp, MessageSquare, Plus, Clock } from "lucide-react";

export function CommunityCommunityFeedView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [posting, setPosting] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  const labels = {
    title: ar ? "التدفق" : "Community Feed",
    newPost: ar ? "منشور جديد" : "New Post",
    allCategories: ar ? "الكل" : "All",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      apiEndpoint="/api/v1/student/community/feed"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: labels.title, href: "/student/community/feed" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === null ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(null)}
            >
              {labels.allCategories}
            </Button>
            {data?.categories?.map((cat: string) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
            <Dialog open={posting} onOpenChange={setPosting}>
              <DialogTrigger asChild>
                <Button className="ml-auto"><Plus className="mr-2 h-4 w-4" />{labels.newPost}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{labels.newPost}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Title" />
                  <Textarea placeholder="What's on your mind?" rows={4} />
                  <select className="w-full px-3 py-2 border rounded-md">
                    {data?.categories?.map((cat: string) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Button onClick={() => setPosting(false)}>Post</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {data?.posts?.map((post: any) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{post.author}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{post.content}</p>
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 pt-2">
                    <Button variant="ghost" size="sm" className="h-8">
                      <ThumbsUp className="h-4 w-4 mr-1" />{post.upvotes}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8">
                      <MessageSquare className="h-4 w-4 mr-1" />{post.replyCount}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </StudentPageTemplate>
  );
}
