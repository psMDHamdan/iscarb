"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, Plus, User, Calendar, Trash2 } from "lucide-react";

export function CareerNetworkingView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("contacts");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactRole: "",
    company: "",
    connectionType: "colleague",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    eventType: "networking",
    date: "",
    location: "",
    organizer: "",
    attended: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/student/career/networking");
      if (!response.ok) throw new Error("Failed to fetch networking data");
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/career/networking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-contact", ...contactForm }),
      });

      if (!response.ok) throw new Error("Failed to add contact");
      setContactForm({
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        contactRole: "",
        company: "",
        connectionType: "colleague",
      });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/career/networking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-event", ...eventForm }),
      });

      if (!response.ok) throw new Error("Failed to add event");
      setEventForm({
        title: "",
        description: "",
        eventType: "networking",
        date: "",
        location: "",
        organizer: "",
        attended: false,
      });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "التواصل المهني" : "Networking"} />
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "التواصل المهني" : "Networking"} />
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "التواصل المهني" : "Networking"}
        description={ar ? "أدِر جهات الاتصال الخاصة بك وتابع أحداث التواصل" : "Manage your contacts and network events"}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="contacts">
            {ar ? "جهات الاتصال" : "Contacts"} ({data?.contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="events">
            {ar ? "الأحداث" : "Events"} ({data?.events?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setActiveTab("contacts");
                setShowForm(!showForm);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {ar ? "إضافة جهة اتصال" : "Add Contact"}
            </Button>
          </div>

          {showForm && activeTab === "contacts" && (
            <Card>
              <CardHeader>
                <CardTitle>{ar ? "جهة اتصال جديدة" : "New Contact"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "الاسم" : "Name"} *
                      </label>
                      <Input
                        value={contactForm.contactName}
                        onChange={e => setContactForm({ ...contactForm, contactName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "البريد الإلكتروني" : "Email"}
                      </label>
                      <Input
                        type="email"
                        value={contactForm.contactEmail}
                        onChange={e => setContactForm({ ...contactForm, contactEmail: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "الهاتف" : "Phone"}
                      </label>
                      <Input
                        value={contactForm.contactPhone}
                        onChange={e => setContactForm({ ...contactForm, contactPhone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "الوظيفة" : "Role"}
                      </label>
                      <Input
                        value={contactForm.contactRole}
                        onChange={e => setContactForm({ ...contactForm, contactRole: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "الشركة" : "Company"}
                      </label>
                      <Input
                        value={contactForm.company}
                        onChange={e => setContactForm({ ...contactForm, company: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "نوع العلاقة" : "Connection Type"}
                      </label>
                      <select
                        value={contactForm.connectionType}
                        onChange={e => setContactForm({ ...contactForm, connectionType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="colleague">{ar ? "زميل" : "Colleague"}</option>
                        <option value="mentor">{ar ? "مرشد" : "Mentor"}</option>
                        <option value="recruiter">{ar ? "موظف توظيف" : "Recruiter"}</option>
                        <option value="alumni">{ar ? "خريج" : "Alumni"}</option>
                        <option value="friend">{ar ? "صديق" : "Friend"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      {ar ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {ar ? "إضافة" : "Add"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {data?.contacts && data.contacts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.contacts.map((contact: any) => (
                <Card key={contact.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.role}</p>
                        </div>
                      </div>
                    </div>

                    {contact.company && (
                      <p className="text-xs text-muted-foreground mb-2">{contact.company}</p>
                    )}

                    {contact.email && (
                      <p className="text-xs text-blue-600 mb-1">{contact.email}</p>
                    )}

                    {contact.phone && (
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {ar ? "لا توجد جهات اتصال حتى الآن" : "No contacts yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setActiveTab("events");
                setShowForm(!showForm);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {ar ? "إضافة حدث" : "Add Event"}
            </Button>
          </div>

          {showForm && activeTab === "events" && (
            <Card>
              <CardHeader>
                <CardTitle>{ar ? "حدث جديد" : "New Event"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {ar ? "عنوان الحدث" : "Event Title"} *
                    </label>
                    <Input
                      value={eventForm.title}
                      onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {ar ? "الوصف" : "Description"}
                    </label>
                    <textarea
                      value={eventForm.description}
                      onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm min-h-24"
                      placeholder={ar ? "أدخل وصف الحدث..." : "Enter event description..."}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "نوع الحدث" : "Event Type"} *
                      </label>
                      <select
                        value={eventForm.eventType}
                        onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        required
                      >
                        <option value="webinar">{ar ? "ويبينار" : "Webinar"}</option>
                        <option value="conference">{ar ? "مؤتمر" : "Conference"}</option>
                        <option value="meetup">{ar ? "لقاء" : "Meetup"}</option>
                        <option value="workshop">{ar ? "ورشة عمل" : "Workshop"}</option>
                        <option value="interview">{ar ? "مقابلة" : "Interview"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "التاريخ" : "Date"} *
                      </label>
                      <Input
                        type="datetime-local"
                        value={eventForm.date}
                        onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "الموقع" : "Location"}
                      </label>
                      <Input
                        value={eventForm.location}
                        onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {ar ? "المنظم" : "Organizer"}
                      </label>
                      <Input
                        value={eventForm.organizer}
                        onChange={e => setEventForm({ ...eventForm, organizer: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="attended"
                      checked={eventForm.attended}
                      onChange={e => setEventForm({ ...eventForm, attended: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="attended" className="text-sm font-medium">
                      {ar ? "لقد حضرت هذا الحدث" : "I attended this event"}
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      {ar ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {ar ? "إضافة" : "Add"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {data?.events && data.events.length > 0 ? (
            <div className="space-y-3">
              {data.events.map((event: any) => (
                <Card key={event.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                      {event.attended && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          {ar ? "تم الحضور" : "Attended"}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <p className="text-xs text-muted-foreground">{event.location}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {ar ? "لا توجد أحداث مسجلة" : "No events recorded"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
