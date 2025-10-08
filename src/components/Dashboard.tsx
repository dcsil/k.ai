"use client";

import React, { useEffect, useMemo, useState } from "react";

type Status = "not_started" | "in_progress" | "completed";

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: Status;
  expanded?: boolean;
  date?: string;
};

const STORAGE_KEY = "k_ai_tasks_v1";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) return JSON.parse(raw) as Task[];
    } catch (e) {
      /* ignore */
    }
    return [];
  });

  // Persist tasks to localStorage whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
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

  // Toggle if completed
  function toggleComplete(id: string) {
    setTasks((s) =>
      s.map((t) => {
        if (t.id !== id) return t;
        if (t.status === "completed") return { ...t, status: "not_started" };
        return { ...t, status: "completed" };
      })
    );
  }

  // Toggle between Not Started and In Progress
  function toggleInProgress(id: string) {
    setTasks((s) =>
      s.map((t) => {
        if (t.id !== id) return t;
        if (t.status === "completed") return t; // don't change completed via this action
        return { ...t, status: t.status === "not_started" ? "in_progress" : "not_started" };
      })
    );
  }

  // Save notes text for task
  function updateNotes(id: string, notes: string) {
    setTasks((s) => s.map((t) => (t.id === id ? { ...t, notes } : t)));
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <h1 className="text-2xl font-semibold">k.ai Dashboard</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
              Placeholder1
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
              Placeholder2
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tasks</h2>
            {tasks.length > 0 && (
              <div className="px-3 py-1 rounded-md bg-accent-foreground/10 text-accent-foreground font-semibold">
                {progress}% complete
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-6">
            <AddTask onAdd={addTask} />
            <input className="flex-1 px-3 py-2 border border-border rounded-md bg-card-foreground/5" placeholder="Search tasks..." aria-label="Search tasks" />
          </div>

          <div className="space-y-4">
            {tasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-lg text-muted-foreground">Welcome to k.ai Dashboard! Add a task above.</p>
              </div>
            )}

            {tasks.map((task) => (
              <div key={task.id} className={`border border-border rounded-md bg-card overflow-hidden ${task.expanded ? "" : ""}`}>
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleExpand(task.id)}>
                  <div className="text-sm text-muted">{task.expanded ? "▼" : "▶"}</div>
                  <input
                    aria-label={`Complete ${task.title}`}
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleComplete(task.id);
                    }}
                    className="w-4 h-4"
                  />
                  <div className="text-xs px-2 py-0.5 rounded bg-card-foreground/5 text-muted">{task.date ?? "—"}</div>
                  <div className="flex-1 font-medium">{task.title}</div>
                  <div className="text-sm text-muted">⋯</div>
                </div>

                {task.expanded && (
                  <div className="p-4 border-t border-border bg-popover">
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
                              toggleInProgress(task.id);
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
                              toggleComplete(task.id);
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
                        onChange={(e) => updateNotes(task.id, e.target.value)}
                        className="w-full min-h-[80px] mt-2 p-2 border border-border rounded-md bg-card-foreground/5"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        className="px-3 py-1 border border-border rounded text-sm text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
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
        className="px-3 py-2 border border-border rounded-md bg-card-foreground/5 w-80"
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