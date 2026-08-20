"use client";
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Zap } from "lucide-react";

export function CommunityEventsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const labels = {
    title: ar ? "الأحداث" : "Events",
    description: ar ? "احضر الأحداث والندوات المجتمعية" : "Attend community events and webinars",
    upcoming: ar ? "الأحداث القادمة" : "Upcoming Events",
    upcomingCount: ar ? "أحداث قادمة" : "Upcoming Events",
    registeredCount: ar ? "أحداث مسجلة" : "Registered Events",
    totalCapacity: ar ? "السعة الإجمالية" : "Total Capacity",
    registered: ar ? "مسجل" : "Registered",
    register: ar ? "التسجيل" : "Register",
    type: ar ? "النوع" : "Type",
    filterByType: ar ? "تصفية حسب النوع" : "Filter by Type",
    noEvents: ar ? "لا توجد أحداث متاحة" : "No events available",
    all: ar ? "الكل" : "All",
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "workshop":
        return "bg-blue-50 text-blue-700";
      case "webinar":
        return "bg-green-50 text-green-700";
      case "conference":
        return "bg-purple-50 text-purple-700";
      case "networking":
        return "bg-orange-50 text-orange-700";
      case "meetup":
        return "bg-pink-50 text-pink-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      description={labels.description}
      descriptionAr={labels.description}
      apiEndpoint="/api/v1/student/community/events"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المجتمع" : "Community", href: "/student/community" },
        { label: labels.title, href: "/student/community/events" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {/* Stats Cards */}
          {data?.stats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{labels.upcomingCount}</p>
                      <p className="text-3xl font-bold">{data.stats.upcomingCount || 0}</p>
                    </div>
                    <Zap className="h-8 w-8 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{labels.registeredCount}</p>
                      <p className="text-3xl font-bold">{data.stats.registeredCount || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{labels.totalCapacity}</p>
                      <p className="text-3xl font-bold">{data.stats.totalCapacity || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Type Filter */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm font-medium text-muted-foreground">{labels.filterByType}:</span>
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              {labels.all}
            </Button>
            {["Workshop", "Webinar", "Conference", "Networking", "Meetup"].map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Button>
            ))}
          </div>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>{labels.upcoming}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.events && data.events.length > 0 ? (
                  data.events
                    .filter(
                      (event: any) =>
                        selectedType === null ||
                        event.eventType?.toLowerCase() === selectedType.toLowerCase()
                    )
                    .map((event: any) => (
                      <div
                        key={event.id}
                        className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-base">{event.title}</h4>
                              <Badge className={getTypeColor(event.eventType)}>
                                {event.eventType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description?.substring(0, 120)}
                              {event.description?.length > 120 ? "..." : ""}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-3 border-y text-sm mb-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(event.startTime).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(event.startTime).toLocaleTimeString(ar ? "ar-SA" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          {event.capacity && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.capacity} {ar ? "الحضور" : "attendees"}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant={event.registered ? "secondary" : "default"}
                          >
                            {event.registered ? labels.registered : labels.register}
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground">{labels.noEvents}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
