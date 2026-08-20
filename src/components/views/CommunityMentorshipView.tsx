"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Star } from "lucide-react";

export function CommunityMentorshipView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const labels = {
    title: ar ? "الإرشاد والتوجيه" : "Mentorship",
    yourSessions: ar ? "جلساتك" : "Your Sessions",
    browseMentors: ar ? "استعرض المرشدين" : "Browse Mentors",
    bookSession: ar ? "احجز جلسة" : "Book Session",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      apiEndpoint="/api/v1/student/community/mentorship"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: labels.title, href: "/student/community/mentorship" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {data?.sessions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{labels.yourSessions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.sessions.map((session: any) => (
                    <div key={session.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{session.mentorName}</h4>
                        <Badge>{session.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{session.topic}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span><Calendar className="h-4 w-4 inline mr-1" />{new Date(session.scheduledAt).toLocaleDateString()}</span>
                        {session.rating && <span className="font-medium"><Star className="h-4 w-4 inline mr-1" />{session.rating}/5</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{labels.browseMentors}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {data?.mentors?.map((mentor: any) => (
                  <div key={mentor.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{mentor.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{mentor.title} at {mentor.company}</span>
                        </div>
                      </div>
                    </div>
                    {mentor.bio && <p className="text-sm text-muted-foreground mb-3">{mentor.bio.substring(0, 80)}...</p>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mentor.expertise?.slice(0, 3).map((exp: string) => (
                        <Badge key={exp} variant="outline" className="text-xs">{exp}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["career-advice", "technical", "interview-prep"].map((topic) => (
                        <Button key={topic} size="sm" variant="outline" className="h-7 text-xs">
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
