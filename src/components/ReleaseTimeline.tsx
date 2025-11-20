"use client";

import React, { useState, useEffect } from "react";

type ReleaseStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED";

type Release = {
  id: string;
  name: string;
  targetReleaseDate?: string | null;
  status: ReleaseStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

import { useAuth } from "@/components/AuthContext";

export default function ReleaseTimeline({
  onReleasesChange,
}: {
  onReleasesChange?: () => void;
}) {
  const { getAccessToken } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRelease, setShowAddRelease] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  async function fetchReleases() {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const res = await fetch("/api/releases", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReleases(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch releases:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addRelease(name: string, targetDate?: string) {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          targetReleaseDate: targetDate || null,
          createDefaultTasks: true,
        }),
      });

      if (res.ok) {
        const newRelease = await res.json();
        setReleases((prev) => [...prev, newRelease]);
        setShowAddRelease(false);
        onReleasesChange?.();
      }
    } catch (error) {
      console.error("Failed to add release:", error);
    }
  }

  async function updateRelease(id: string, updates: Partial<Release>) {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const res = await fetch(`/api/releases/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setReleases((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
        );
        if (selectedRelease?.id === id) {
          setSelectedRelease({ ...selectedRelease, ...updated });
        }
      }
    } catch (error) {
      console.error("Failed to update release:", error);
    }
  }

  async function deleteRelease(id: string) {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const res = await fetch(`/api/releases/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setReleases((prev) => prev.filter((r) => r.id !== id));
        setSelectedRelease(null);
        onReleasesChange?.();
      }
    } catch (error) {
      console.error("Failed to delete release:", error);
    }
  }

  const sortedReleases = [...releases].sort((a, b) => {
    if (!a.targetReleaseDate) return 1;
    if (!b.targetReleaseDate) return -1;
    return a.targetReleaseDate.localeCompare(b.targetReleaseDate);
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading releases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Release Timeline</h2>
        <button
          onClick={() => setShowAddRelease(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Release
        </button>
      </div>

      {releases.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-lg text-muted-foreground mb-2">
            No releases planned yet
          </p>
          <p className="text-sm text-muted-foreground">
            Start planning your next release to organize tasks and track progress
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {sortedReleases.map((release) => (
            <ReleaseCard
              key={release.id}
              release={release}
              isSelected={selectedRelease?.id === release.id}
              onClick={() => setSelectedRelease(release)}
            />
          ))}
        </div>

        {selectedRelease && (
          <div className="lg:sticky lg:top-6 h-fit">
            <ReleaseDetails
              release={selectedRelease}
              onUpdate={updateRelease}
              onDelete={deleteRelease}
            />
          </div>
        )}
      </div>

      {showAddRelease && (
        <AddReleaseModal
          onClose={() => setShowAddRelease(false)}
          onAdd={addRelease}
        />
      )}
    </div>
  );
}

function ReleaseCard({
  release,
  isSelected,
  onClick,
}: {
  release: Release;
  isSelected: boolean;
  onClick: () => void;
}) {
  const daysUntilRelease = release.targetReleaseDate
    ? Math.ceil(
        (new Date(release.targetReleaseDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div
      onClick={onClick}
      className={`bg-card border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded flex items-center justify-center text-2xl font-bold text-primary">
          {release.name[0]?.toUpperCase() || "R"}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-lg">{release.name}</div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={release.status} />
            {daysUntilRelease !== null && (
              <span className="text-xs text-muted-foreground">
                {daysUntilRelease > 0
                  ? `${daysUntilRelease} days away`
                  : daysUntilRelease === 0
                  ? "Today!"
                  : "Released"}
              </span>
            )}
          </div>
          {release.targetReleaseDate && (
            <div className="mt-2 text-sm text-muted-foreground">
              Target: {new Date(release.targetReleaseDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReleaseDetails({
  release,
  onUpdate,
  onDelete,
}: {
  release: Release;
  onUpdate: (id: string, updates: Partial<Release>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(release.name);
  const [targetDate, setTargetDate] = useState(
    release.targetReleaseDate || ""
  );

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold">Release Details</h3>
        <button
          onClick={() => onDelete(release.id)}
          className="text-red-600 text-sm px-2 py-1 hover:bg-red-50 rounded"
        >
          Delete
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onUpdate(release.id, { name })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Target Release Date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => {
              setTargetDate(e.target.value);
              onUpdate(release.id, { targetReleaseDate: e.target.value || null });
            }}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Status</label>
          <select
            value={release.status}
            onChange={(e) =>
              onUpdate(release.id, { status: e.target.value as ReleaseStatus })
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Created: {new Date(release.createdAt).toLocaleDateString()}
          </div>
          <div className="text-sm text-muted-foreground">
            Updated: {new Date(release.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReleaseStatus }) {
  if (status === "COMPLETED")
    return (
      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">
        Completed
      </span>
    );
  if (status === "IN_PROGRESS")
    return (
      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
        In Progress
      </span>
    );
  return (
    <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold">
      Planning
    </span>
  );
}

function AddReleaseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, targetDate?: string) => void;
}) {
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), targetDate || undefined);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">New Release</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Release Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              placeholder="e.g., Summer EP 2024"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Target Release Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Create Release
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}