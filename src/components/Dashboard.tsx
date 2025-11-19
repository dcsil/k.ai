"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Calendar from "./Calendar";
import ReleaseTimeline from "./ReleaseTimeline";
import SocialMedia from "./SocialMedia";
import AIChatbot from "./AIChatbot";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: Status;
  dueDate?: string | null;
  releaseId: string;
  position: number;
  expanded?: boolean;
};

type Section = "tasks" | "calendar" | "releases" | "social" | "chat";

export default function Dashboard() {
  const { user, logout, getAccessToken } = useAuth();
  const [currentSection, setCurrentSection] = useState<Section>("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>("");

  // Fetch releases on mount
  useEffect(() => {
    fetchReleases();
  }, []);

  // Fetch tasks when release is selected
  useEffect(() => {
    if (selectedReleaseId) {
      fetchTasks(selectedReleaseId);
    }
  }, [selectedReleaseId]);

  async function fetchReleases() {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const res = await fetch("/api/releases", {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setReleases(data.items || []);
        // Auto-select first release
        if (data.items?.length > 0 && !selectedReleaseId) {
          setSelectedReleaseId(data.items[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTasks(releaseId: string) {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const res = await fetch(`/api/releases/${releaseId}/tasks`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }

  async function addTask(title: string) {
    if (!title.trim() || !selectedReleaseId) return;
    
    const token = getAccessToken();
    if (!token) return;
    
    try {
      const res = await fetch(`/api/releases/${selectedReleaseId}/tasks`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ 
          title: title.trim(),
          status: "NOT_STARTED"
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, { ...newTask, expanded: true }]);
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  }

  async function deleteTask(id: string) {
    const token = getAccessToken();
    if (!token) return;
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  function toggleExpand(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t))
    );
  }

  async function toggleComplete(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const token = getAccessToken();
    if (!token) return;

    const endpoint = task.status === "COMPLETED" 
      ? `/api/tasks/${id}/uncomplete`
      : `/api/tasks/${id}/complete`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
        );
      }
    } catch (error) {
      console.error("Failed to toggle complete:", error);
    }
  }

  async function updateTaskStatus(id: string, status: Status) {
    const token = getAccessToken();
    if (!token) return;
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  async function updateNotes(id: string, description: string) {
    const token = getAccessToken();
    if (!token) return;
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ description }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update notes:", error);
    }
  }

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 flex-1">
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
              label="AI Assistant"
              active={currentSection === "chat"}
              onClick={() => setCurrentSection("chat")}
            />
          </nav>
        </div>
        
        <div className="p-6 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-3 py-2 text-sm border border-border rounded-md hover:bg-accent"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {currentSection === "tasks" && (
          <TasksSection
            tasks={tasks}
            progress={progress}
            releases={releases}
            selectedReleaseId={selectedReleaseId}
            onSelectRelease={setSelectedReleaseId}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
            onToggleExpand={toggleExpand}
            onToggleComplete={toggleComplete}
            onUpdateStatus={updateTaskStatus}
            onUpdateNotes={updateNotes}
            loading={loading}
          />
        )}
        {currentSection === "calendar" && <Calendar />}
        {currentSection === "releases" && (
          <ReleaseTimeline onReleasesChange={fetchReleases} />
        )}
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
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      }`}
    >
      <span className="font-medium">{label}</span>
    </button>
  );
}

function TasksSection({
  tasks,
  progress,
  releases,
  selectedReleaseId,
  onSelectRelease,
  onAddTask,
  onDeleteTask,
  onToggleExpand,
  onToggleComplete,
  onUpdateStatus,
  onUpdateNotes,
  loading,
}: {
  tasks: Task[];
  progress: number;
  releases: any[];
  selectedReleaseId: string;
  onSelectRelease: (id: string) => void;
  onAddTask: (title: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  loading: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tasks</h2>
        {releases.length > 0 && (
          <select
            value={selectedReleaseId}
            onChange={(e) => onSelectRelease(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-card"
          >
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-accent/20 inline-block">
          <span className="font-semibold">{progress}% complete</span>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <AddTask onAdd={onAddTask} disabled={!selectedReleaseId} />
        <input
          className="flex-1 px-3 py-2 border border-border rounded-md bg-card"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {releases.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-lg text-muted-foreground mb-2">No releases yet</p>
          <p className="text-sm text-muted-foreground">
            Create a release first to start adding tasks
          </p>
        </div>
      )}

      {releases.length > 0 && filteredTasks.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-lg text-muted-foreground">
            {searchQuery ? "No tasks match your search" : "No tasks yet. Add one to get started!"}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleExpand={onToggleExpand}
            onToggleComplete={onToggleComplete}
            onUpdateStatus={onUpdateStatus}
            onUpdateNotes={onUpdateNotes}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggleExpand,
  onToggleComplete,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
}: {
  task: Task;
  onToggleExpand: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}) {
  const [notes, setNotes] = useState(task.description || "");

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/5"
        onClick={() => onToggleExpand(task.id)}
      >
        <div className="text-sm text-muted-foreground">
          {task.expanded ? "▼" : "▶"}
        </div>
        <input
          type="checkbox"
          checked={task.status === "COMPLETED"}
          onChange={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className="w-4 h-4"
        />
        {task.dueDate && (
          <div className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
        <div className="flex-1 font-medium">{task.title}</div>
        <StatusBadge status={task.status} />
      </div>

      {task.expanded && (
        <div className="p-4 border-t border-border space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">Status</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  onUpdateStatus(
                    task.id,
                    task.status === "NOT_STARTED" ? "IN_PROGRESS" : "NOT_STARTED"
                  )
                }
                className="text-sm px-3 py-1 border border-border rounded-md hover:bg-accent"
              >
                <StatusBadge status={task.status} />
              </button>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.status === "COMPLETED"}
                  onChange={() => onToggleComplete(task.id)}
                />
                <span className="text-sm">Mark complete</span>
              </label>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdateNotes(task.id, notes)}
              className="w-full min-h-[80px] p-2 border border-border rounded-md bg-background"
              placeholder="Add notes about this task..."
            />
          </div>

          <button
            onClick={() => onDelete(task.id)}
            className="px-3 py-1 border border-red-600 text-red-600 rounded text-sm hover:bg-red-50"
          >
            Delete Task
          </button>
        </div>
      )}
    </div>
  );
}

function AddTask({
  onAdd,
  disabled,
}: {
  onAdd: (title: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onAdd(value);
          setValue("");
        }
      }}
      className="flex gap-2"
    >
      <input
        className="px-3 py-2 border border-border rounded-md bg-card w-80"
        placeholder={disabled ? "Select a release first" : "New task title..."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <button
        className="px-3 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        type="submit"
        disabled={disabled}
      >
        Add
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "COMPLETED")
    return (
      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-sm font-semibold">
        Completed
      </span>
    );
  if (status === "IN_PROGRESS")
    return (
      <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-sm font-semibold">
        In Progress
      </span>
    );
  return (
    <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm font-semibold">
      Not Started
    </span>
  );
}