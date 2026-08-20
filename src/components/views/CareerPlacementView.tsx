"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Briefcase, TrendingUp, MapPin, Calendar } from "lucide-react";

export function CareerPlacementView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employer: "",
    position: "",
    startDate: "",
    endDate: "",
    salary: 0,
    employmentType: "full-time",
    location: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/career/placement");
        if (!response.ok) throw new Error("Failed to fetch placement data");
        const result = await response.json();
        setData(result.data);

        if (result.data?.placement) {
          setFormData({
            employer: result.data.placement.employer || "",
            position: result.data.placement.position || "",
            startDate: result.data.placement.startDate?.split("T")[0] || "",
            endDate: result.data.placement.endDate?.split("T")[0] || "",
            salary: result.data.placement.salary || 0,
            employmentType: result.data.placement.employmentType || "full-time",
            location: result.data.placement.location || "",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "salary" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/career/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to save placement");
      const result = await response.json();
      setData(prev => ({ ...prev, placement: result.data }));
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "الوظيفة الحالية" : "Current Placement"} />
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "الوظيفة الحالية" : "Current Placement"} />
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
        title={ar ? "الوظيفة الحالية" : "Current Placement"}
        description={ar ? "عرض وإدارة معلومات وظيفتك الحالية" : "View and manage your current employment details"}
      />

      {data?.placement && !isEditing ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      {data.placement.position}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{data.placement.employer}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    {ar ? "تعديل" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {ar ? "نوع التوظيف" : "Employment Type"}
                  </div>
                  <p className="text-sm font-medium capitalize">{data.placement.employmentType}</p>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {ar ? "المراتب الشهرية" : "Annual Salary"}
                  </div>
                  <p className="text-sm font-medium">
                    {data.placement.salary ? `${data.placement.salary.toLocaleString()} SAR` : "Not specified"}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {ar ? "تاريخ البدء" : "Start Date"}
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(data.placement.startDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {ar ? "الموقع" : "Location"}
                  </div>
                  <p className="text-sm font-medium">{data.placement.location || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {ar ? "نظرة عامة" : "Overview"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {ar ? "الحالة" : "Status"}
                  </div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    {data.placement.status === "active" ? (ar ? "نشط" : "Active") : data.placement.status}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {ar ? "مدة العقد" : "Duration"}
                  </div>
                  <p className="text-xs">
                    {new Date(data.placement.startDate).toLocaleDateString()}
                    {data.placement.endDate && ` - ${new Date(data.placement.endDate).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <Button variant="outline" size="sm" className="w-full">
                    {ar ? "عرض التفاصيل الكاملة" : "View Full Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : data?.placement && isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>{ar ? "تعديل بيانات الوظيفة" : "Edit Placement Details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {ar ? "اسم الشركة" : "Employer"}
                  </label>
                  <Input
                    name="employer"
                    value={formData.employer}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {ar ? "المسمى الوظيفي" : "Position"}
                  </label>
                  <Input
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {ar ? "تاريخ البدء" : "Start Date"}
                  </label>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {ar ? "تاريخ الانتهاء" : "End Date"}
                  </label>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {ar ? "المراتب الشهرية" : "Annual Salary"}
                  </label>
                  <Input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {ar ? "نوع التوظيف" : "Employment Type"}
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="full-time">{ar ? "دوام كامل" : "Full-time"}</option>
                    <option value="part-time">{ar ? "دوام جزئي" : "Part-time"}</option>
                    <option value="contract">{ar ? "عقد" : "Contract"}</option>
                    <option value="freelance">{ar ? "عمل حر" : "Freelance"}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    {ar ? "الموقع" : "Location"}
                  </label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {ar ? "حفظ" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {ar ? "لم تقم بإدخال بيانات وظيفتك الحالية" : "No placement information yet"}
            </p>
            <Button onClick={() => setIsEditing(true)}>
              {ar ? "إضافة وظيفة" : "Add Placement"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
