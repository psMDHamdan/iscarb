"use client";

import { HubNav } from "@/components/iscarb/HubNav";
import { BookOpen, Route, Layers, BrainCircuit, PenTool, Activity, Target } from "lucide-react";

export function LearningHubNav() {
  return (
    <HubNav items={[
      { label: "My Learning", labelAr: "تعلمي", href: "/student/learning/dashboard", icon: BookOpen },
      { label: "Learning Paths", labelAr: "مسارات التعلم", href: "/student/learning-paths", icon: Route },
      { label: "Skill Tree", labelAr: "شجرة المهارات", href: "/student/skill-tree", icon: Layers },
      { label: "Study Planner", labelAr: "مخطط الدراسة", href: "/student/study-coach", icon: BrainCircuit },
      { label: "Notes", labelAr: "الملاحظات", href: "/student/notes", icon: PenTool },
      { label: "Flashcards", labelAr: "البطاقات", href: "/student/flashcards", icon: Layers },
      { label: "Study Habits", labelAr: "عادات الدراسة", href: "/student/habits", icon: Activity },
      { label: "Focus Mode", labelAr: "وضع التركيز", href: "/student/focus", icon: Target },
    ]} />
  );
}
