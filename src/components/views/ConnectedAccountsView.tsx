"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Link2, Unlink, Loader2, Check, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectedAccount {
  id: string;
  provider: string;
  providerDisplayName: string;
  email: string;
  connectedAt: string;
  lastUsedAt: string;
  active: boolean;
}

interface ConnectedAccountsViewProps {
  ar: boolean;
}

export function ConnectedAccountsView({ ar }: ConnectedAccountsViewProps) {
  const { data: rawRes, isLoading: loading, refetch } = useApiQuery<any>(
    ["auth", "connected-accounts"],
    "/api/v1/auth/connected-accounts",
  );
  const accounts = rawRes?.success ? rawRes.data : rawRes?.data ?? [];

  const disconnectAccount = async (accountId: string) => {
    if (!confirm(ar ? "هل تريد فصل هذا الحساب؟" : "Disconnect this account?")) return;
    try {
      await fetch(`/api/v1/auth/connected-accounts/${accountId}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      console.error("Failed to disconnect account:", err);
    }
  };

  const providerIcons: Record<string, string> = {
    google: "G",
    microsoft: "M",
    github: "GH",
    linkedin: "LI",
    apple: "A",
    twitter: "X",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold">{ar ? "الحسابات المتصلة" : "Connected Accounts"}</h3>
          <p className="text-sm text-muted-foreground">
            {ar
              ? "قم بتوصيل حسابات خارجية لتسجيل الدخول بسرعة"
              : "Connect external accounts for quick login"}
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{ar ? "لا توجد حسابات متصلة" : "No connected accounts"}</p>
            <p className="text-xs mt-2">
              {ar
                ? "قم بتوصيل حساب Google أو Microsoft أو GitHub لتسجيل الدخول بسرعة"
                : "Connect Google, Microsoft, or GitHub for faster login"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {accounts.map((account) => (
              <div key={account.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {providerIcons[account.provider] || account.provider.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{account.providerDisplayName}</p>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ar ? "متصل منذ" : "Connected"}: {new Date(account.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                      account.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {account.active ? (
                      <>
                        <Check className="h-3 w-3" /> {ar ? "متصّل" : "Connected"}
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" /> {ar ? "مقطوع" : "Disconnected"}
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => disconnectAccount(account.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg"
                    title={ar ? "فصل" : "Disconnect"}
                  >
                    <Unlink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available providers */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">{ar ? "إضافة حساب" : "Add Account"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "google", name: "Google", desc: "Gmail, Google Workspace" },
            { id: "microsoft", name: "Microsoft", desc: "Outlook, Office 365" },
            { id: "github", name: "GitHub", desc: "GitHub account" },
            { id: "linkedin", name: "LinkedIn", desc: "Professional network" },
          ].map((provider) => (
            <button
              key={provider.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {provider.id.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.desc}</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
