"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock, Play, Pause, Square, BookOpen, Target, Loader2, ListTodo,
  Brain, Timer, Coffee, CheckCircle2, Plus, Trash2, NotebookPen,
} from "lucide-react";

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;

export function LearningStudyView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [minutes, setMinutes] = useState(POMODORO_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [todos, setTodos] = useState<{ text: string; done: boolean }[]>([]);
  const [todoInput, setTodoInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/v1/student/learning/study-workspace")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setTodos(d.todos || []); setSessions(d.sessions || 0);
          setNotes(d.notes || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    setActive(true);
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev === 0) {
          setMinutes(m => {
            if (m === 0) {
              clearInterval(timerRef.current!);
              setActive(false);
              if (!onBreak) { setSessions(s => s + 1); setOnBreak(true); setMinutes(BREAK_MINUTES); }
              else { setOnBreak(false); setMinutes(POMODORO_MINUTES); }
              return 0;
            }
            return m - 1;
          });
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => { setActive(false); if (timerRef.current) clearInterval(timerRef.current); };
  const resetTimer = () => { pauseTimer(); setMinutes(onBreak ? BREAK_MINUTES : POMODORO_MINUTES); setSeconds(0); };

  const addTodo = () => {
    if (!todoInput.trim()) return;
    setTodos(prev => [...prev, { text: todoInput.trim(), done: false }]);
    setTodoInput("");
  };

  const toggleTodo = (i: number) => setTodos(prev => prev.map((t, j) => j === i ? { ...t, done: !t.done } : t));
  const removeTodo = (i: number) => setTodos(prev => prev.filter((_, j) => j !== i));

  const totalSeconds = minutes * 60 + seconds;
  const totalPomSeconds = (onBreak ? BREAK_MINUTES : POMODORO_MINUTES) * 60;
  const progress = ((totalPomSeconds - totalSeconds) / totalPomSeconds) * 100;

  if (loading) {
    return <StudentPageTemplate title={ar ? "مساحة الدراسة" : "Study Workspace"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "مساحة الدراسة" : "Workspace" }]}>
      <Skeleton className="h-[400px] rounded-xl" />
    </StudentPageTemplate>;
  }

  return (
    <StudentPageTemplate title={ar ? "مساحة الدراسة" : "Study Workspace"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "مساحة الدراسة" : "Workspace" }]}>
      <div className="grid gap-6 lg:grid-cols-3 pb-12">
        {/* Timer & Focus */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="text-center py-8">
            <CardContent className="space-y-4">
              <Badge variant={onBreak ? "secondary" : "default"} className={`${onBreak ? "" : "bg-iscarb-cyan"}`}>
                {onBreak ? (ar ? "استراحة" : "Break") : (ar ? "جلسة تركيز" : "Focus Session")}
              </Badge>
              <div className="text-6xl font-bold tracking-tight tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <Progress value={progress} className="h-2 max-w-xs mx-auto" />
              <div className="flex items-center justify-center gap-3">
                {!active ? (
                  <Button onClick={startTimer} className="gap-2 bg-iscarb-green hover:bg-iscarb-green-dark"><Play className="h-4 w-4" />{ar ? "ابدأ" : "Start"}</Button>
                ) : (
                  <Button onClick={pauseTimer} variant="outline" className="gap-2"><Pause className="h-4 w-4" />{ar ? "إيقاف مؤقت" : "Pause"}</Button>
                )}
                <Button onClick={resetTimer} variant="ghost" size="sm"><Square className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">{ar ? `الجلسات المكتملة: ${sessions}` : `Sessions completed: ${sessions}`}</p>
            </CardContent>
          </Card>

          {/* Quick Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><NotebookPen className="h-4 w-4 text-iscarb-cyan" />{ar ? "ملاحظات سريعة" : "Quick Notes"}</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full h-24 rounded-lg border bg-card p-3 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-iscarb-cyan"
                placeholder={ar ? "اكتب ملاحظاتك هنا..." : "Write your notes here..."} />
            </CardContent>
          </Card>
        </div>

        {/* Todo Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><ListTodo className="h-4 w-4 text-iscarb-cyan" />{ar ? "قائمة المهام" : "Todo List"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input value={todoInput} onChange={e => setTodoInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTodo()}
                  placeholder={ar ? "أضف مهمة..." : "Add task..."} className="h-8 text-xs" />
                <Button size="sm" onClick={addTodo} className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
              </div>
              {todos.length > 0 ? todos.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/50 group">
                  <button onClick={() => toggleTodo(i)} className={`p-0.5 rounded-full ${t.done ? "bg-emerald-500 text-white" : "border border-muted-foreground/30"}`}>
                    {t.done && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                  <span className={`flex-1 ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.text}</span>
                  <button onClick={() => removeTodo(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">{ar ? "لا توجد مهام" : "No tasks yet"}</p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-gradient-to-br from-amber-50/30 to-transparent">
            <CardContent className="p-4 text-center">
              <Timer className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{sessions}</p>
              <p className="text-xs text-muted-foreground">{ar ? "جلسة مكتملة" : "Sessions Done"}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{ar ? `${sessions * POMODORO_MINUTES} دقيقة من التركيز` : `${sessions * POMODORO_MINUTES} mins of focus`}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentPageTemplate>
  );
}
