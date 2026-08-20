import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Info, ChevronRight, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface InboxItem {
  id: string;
  type: "JAHEZIAH_MAPPING" | "UNSUPPORTED_CLAIM" | "SOURCE_OMISSION";
  title: string;
  description: string;
  confidence: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export function DecisionInboxView({ projectId }: { projectId: string }) {
  // Mock data for the MVP Phase 2
  const [items, setItems] = useState<InboxItem[]>([
    {
      id: "1",
      type: "JAHEZIAH_MAPPING",
      title: "Jaheziah Standard Mapping",
      description: "AI proposes mapping CLO-2 to Software Engineering SKU 8.2: Fundamentals of Software Security.",
      confidence: 0.85,
      status: "PENDING",
    },
    {
      id: "2",
      type: "UNSUPPORTED_CLAIM",
      title: "Unsupported Domain Claim",
      description: "Slide 10 claims '99% of cyber attacks are phishing'. No source document supports this exact figure.",
      confidence: 0.4,
      status: "PENDING",
    },
    {
      id: "3",
      type: "SOURCE_OMISSION",
      title: "Critical Source Block Omitted",
      description: "The block 'NCAAA Standard 4.1 Assessment Strategies' was marked critical but not included in any slide plan.",
      confidence: 0.95,
      status: "PENDING",
    }
  ]);

  const handleAction = (id: string, action: "APPROVED" | "REJECTED") => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  const pendingCount = items.filter(i => i.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header with Glassmorphism */}
        <header className="relative overflow-hidden rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-200/50 dark:border-emerald-800/50">
                <AlertCircle className="w-4 h-4" />
                Action Required
              </div>
              <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                Decision Inbox
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Review AI-generated mappings and quality gate exceptions before publishing.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400">{pendingCount}</span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending</span>
            </div>
          </div>
        </header>

        {/* Inbox Items */}
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
                  item.status === "PENDING" 
                    ? "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-slate-800/80" 
                    : item.status === "APPROVED"
                      ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 opacity-75"
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale"
                )}
              >
                <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
                  
                  {/* Icon Indicator */}
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border",
                    item.type === "JAHEZIAH_MAPPING" ? "bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400" :
                    item.type === "UNSUPPORTED_CLAIM" ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400" :
                    "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400"
                  )}>
                    {item.type === "JAHEZIAH_MAPPING" ? <FileText className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {item.title}
                      {item.confidence > 0.8 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          High Confidence
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions */}
                  {item.status === "PENDING" ? (
                    <div className="flex items-center gap-3 md:border-l md:border-slate-200 dark:md:border-slate-700 md:pl-6 pt-4 md:pt-0">
                      <button 
                        onClick={() => handleAction(item.id, "REJECTED")}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                      <button 
                        onClick={() => handleAction(item.id, "APPROVED")}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-md transition-all active:scale-95"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 md:border-l md:border-slate-200 dark:md:border-slate-700 md:pl-6 pt-4 md:pt-0">
                      {item.status === "APPROVED" ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                          <X className="w-5 h-5" /> Rejected
                        </span>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {pendingCount === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/30 dark:bg-slate-900/30"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All caught up!</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">You've resolved all pending AI decisions.</p>
              
              <Link 
                href={`/faculty/lecture/${projectId}/publish`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Continue to Publish <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
