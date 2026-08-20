"use client";
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus } from "lucide-react";

export function CommunityClubsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [creating, setCreating] = useState(false);

  const labels = {
    title: ar ? "النوادي" : "Clubs",
    myClubs: ar ? "نوادي" : "My Clubs",
    joinClub: ar ? "الانضمام" : "Join Club",
    createClub: ar ? "إنشاء نادي" : "Create Club",
    name: ar ? "الاسم" : "Name",
    description: ar ? "الوصف" : "Description",
    submit: ar ? "إنشاء" : "Create",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      apiEndpoint="/api/v1/student/community/clubs"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: labels.title, href: "/student/community/clubs" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{labels.myClubs}</h2>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />{labels.createClub}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{labels.createClub}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder={labels.name} />
                  <Textarea placeholder={labels.description} rows={3} />
                  <Button onClick={() => setCreating(false)}>{labels.submit}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {data?.myClubs?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.myClubs.map((club: any) => (
                    <div key={club.id} className="p-4 border border-border rounded-lg">
                      <h4 className="font-semibold mb-1">{club.name}</h4>
                      <Badge variant="secondary" className="text-xs mb-3">{club.role}</Badge>
                      <p className="text-sm text-muted-foreground">{new Date(club.joinedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Browse Clubs */}
          <Card>
            <CardHeader>
              <CardTitle>Browse Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {data?.clubs?.map((club: any) => (
                  <div key={club.id} className="p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold flex-1">{club.name}</h4>
                      <Badge variant="outline">{club.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{club.description?.substring(0, 100)}...</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />{club.memberCount}
                      </span>
                      <Button size="sm" variant={club.isMember ? "secondary" : "default"}>
                        {club.isMember ? "Joined" : labels.joinClub}
                      </Button>
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
