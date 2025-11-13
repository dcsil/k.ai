"use client";

import React, { useEffect, useMemo, useState } from "react";
import Calendar from "./Calendar";
import ReleaseTimeline from "./ReleaseTimeline";
import SocialMedia from "./SocialMedia";
import AIChatbot from "./AIChatbot";

type Status = "not_started" | "in_progress" | "completed";

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: Status;
  expanded?: boolean;
  date?: string;
};

type Section = "tasks" | "calendar" | "releases" | "social"| "chat";

const STORAGE_KEY = "k_ai_tasks_v1";

export default function Dashboard() {
  const [currentSection, setCurrentSection] = useState<Section>("tasks");
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) return JSON.parse(raw) as Task[];
    } catch {
      /* ignore */
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  const completedCount = useMemo(() => tasks.filter((t) => t.status === "completed").length, [tasks]);
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  function addTask(title: string) {
    if (!title.trim()) return;
    const t: Task = { 
      id: Date.now().toString(), 
      title: title.trim(), 
      notes: "", 
      status: "not_started", 
      expanded: true, 
      date: new Date().toLocaleDateString() 
    };
    setTasks((s) => [t, ...s]);
  }

  function deleteTask(id: string) {
    setTasks((s) => s.filter((t) => t.id !== id));
  }

  function toggleExpand(id: string) {
    setTasks((s) => s.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)));
  }

  function toggleComplete(id: string) {
    setTasks((s) =>
      s.map((t) => {
        if (t.id !== id) return t;
        if (t.status === "completed") return { ...t, status: "not_started" };
        return { ...t, status: "completed" };
      })
    );
  }

  function toggleInProgress(id: string) {
    setTasks((s) =>
      s.map((t) => {
        if (t.id !== id) return t;
        if (t.status === "completed") return t;
        return { ...t, status: t.status === "not_started" ? "in_progress" : "not_started" };
      })
    );
  }

  function updateNotes(id: string, notes: string) {
    setTasks((s) => s.map((t) => (t.id === id ? { ...t, notes } : t)));
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 bg-card border-r border-border">
          <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">k.ai</h1>
          <nav className="space-y-2">
            <NavItem
              label="Tasks"
              active={currentSection === "tasks"}
              onClick={() => setCurrentSection("tasks")}
            />
            <NavItem
              label="Calendar"
              active={currentSection === "calendar"}
              onClick={() => setCurrentSection("calendar")}
            />
            <NavItem
              label="Releases"
              active={currentSection === "releases"}
              onClick={() => setCurrentSection("releases")}
            />
            <NavItem
              label="Social Media"
              active={currentSection === "social"}
              onClick={() => setCurrentSection("social")}
            />
            <NavItem
              label="AI"
              active={currentSection === "chat"}
              onClick={() => setCurrentSection("chat")}
            />
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {currentSection === "tasks" && (
          <TasksSection
            tasks={tasks}
            progress={progress}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
            onToggleExpand={toggleExpand}
            onToggleComplete={toggleComplete}
            onToggleInProgress={toggleInProgress}
            onUpdateNotes={updateNotes}
          />
        )}
        {currentSection === "calendar" && <Calendar />}
        {currentSection === "releases" && <ReleaseTimeline />}
        {currentSection === "social" && <SocialMedia />}
        {currentSection === "chat" && <AIChatbot />}
      </main>
    </div>
  );
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent"
      }`}
    >
      <span className="font-medium">{label}</span>
    </button>
  );
}

function TasksSection({
  tasks,
  progress,
  onAddTask,
  onDeleteTask,
  onToggleExpand,
  onToggleComplete,
  onToggleInProgress,
  onUpdateNotes,
}: {
  tasks: Task[];
  progress: number;
  onAddTask: (title: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleInProgress: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
        {tasks.length > 0 && (
          <div className="px-4 py-2 rounded-lg bg-accent/20 inline-block">
            <span className="font-semibold">{progress}% complete</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <AddTask onAdd={onAddTask} />
        <input
          className="flex-1 px-3 py-2 border border-border rounded-md bg-card"
          placeholder="Search tasks..."
          aria-label="Search tasks"
        />
      </div>

      <div className="space-y-4">
        {tasks.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-lg text-muted-foreground">No tasks yet. Add one to get started!</p>
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            <div
              className="flex items-center gap-3 p-4 cursor-pointer"
              onClick={() => onToggleExpand(task.id)}
            >
              <div className="text-sm text-muted">{task.expanded ? "▼" : "▶"}</div>
              <input
                aria-label={`Complete ${task.title}`}
                type="checkbox"
                checked={task.status === "completed"}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task.id);
                }}
                className="w-4 h-4"
              />
              <div className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {task.date ?? "—"}
              </div>
              <div className="flex-1 font-medium">{task.title}</div>
              <div className="text-sm text-muted">⋯</div>
            </div>

            {task.expanded && (
              <div className="p-4 border-t border-border">
                <div className="mb-3">
                  <div className="text-sm font-semibold">Title</div>
                  <div className="mt-1">{task.title}</div>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-semibold">Status</div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      aria-label={`Toggle ${task.title} Not Started / In Progress`}
                      className="focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleInProgress(task.id);
                      }}
                    >
                      <StatusBadge status={task.status} />
                    </button>
                    <label className="flex items-center gap-2 ml-2">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleComplete(task.id);
                        }}
                      />
                      <span className="text-sm">Mark complete</span>
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-semibold">Notes</div>
                  <textarea
                    value={task.notes ?? ""}
                    onChange={(e) => onUpdateNotes(task.id, e.target.value)}
                    className="w-full min-h-[80px] mt-2 p-2 border border-border rounded-md bg-background"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    className="px-3 py-1 border border-border rounded text-sm text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                  >
                    Delete Task
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(value);
        setValue("");
      }}
      className="flex gap-2"
    >
      <input
        className="px-3 py-2 border border-border rounded-md bg-card w-80"
        placeholder="New task title..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="New task title"
      />
      <button className="px-3 py-2 bg-primary text-primary-foreground rounded-md" type="submit">
        Add
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "completed")
    return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-sm font-semibold">Completed</span>;
  if (status === "in_progress")
    return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-sm font-semibold">In Progress</span>;
  return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm font-semibold">Not Started</span>;
}