"use client";

import { useState, useEffect } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Save, Loader2, Camera } from "lucide-react";

interface ProfileSettingsViewProps {
  ar: boolean;
}

export function ProfileSettingsView({ ar }: ProfileSettingsViewProps) {
  const { data: rawRes, isLoading: loading, refetch } = useApiQuery<any>(
    ["profile"],
    "/api/v1/profile",
  );
  const profileData = rawRes?.data;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profileData) {
      setName(profileData.name || "");
      setEmail(profileData.email || "");
      setPhone(profileData.phone || "");
      setBio(profileData.bio || "");
    }
  }, [profileData]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, bio }),
      });
      if (res.ok) {
        setSuccess(true);
        refetch();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-card border rounded-xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
              {name.charAt(0) || email.charAt(0) || "?"}
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-background border rounded-full hover:bg-muted">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h3 className="font-semibold">{name || "User"}</h3>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الاسم" : "Name"}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "البريد الإلكتروني" : "Email"}</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-muted text-sm opacity-60"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {ar ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الهاتف" : "Phone"}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "النبذة التعريفية" : "Bio"}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E6C3C] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {ar ? "حفظ" : "Save"}
          </button>
          {success && (
            <span className="text-sm text-emerald-600">
              {ar ? "تم الحفظ بنجاح" : "Saved successfully"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
