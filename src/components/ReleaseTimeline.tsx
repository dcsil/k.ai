"use client";

import React, { useState, useEffect } from "react";

type ReleaseStatus = "planning" | "in_progress" | "completed";

type Release = {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  status: ReleaseStatus;
  milestones: Milestone[];
  notes?: string;
  coverArtUrl?: string;
};

type Milestone = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

const STORAGE_KEY = "k_ai_releases_v1";

export default function ReleaseTimeline() {
  const [releases, setReleases] = useState<Release[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) return JSON.parse(raw) as Release[];
    } catch {
      /* ignore */
    }
    return [];
  });

  const [showAddRelease, setShowAddRelease] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(releases));
    } catch {
      // ignore
    }
  }, [releases]);

  function addRelease(release: Omit<Release, "id">) {
    const newRelease: Release = {
      ...release,
      id: Date.now().toString(),
    };
    setReleases((prev) => [...prev, newRelease]);
    setShowAddRelease(false);
  }

  function updateRelease(id: string, updates: Partial<Release>) {
    setReleases((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function deleteRelease(id: string) {
    setReleases((prev) => prev.filter((r) => r.id !== id));
    setSelectedRelease(null);
  }

  function addMilestone(releaseId: string, milestone: Omit<Milestone, "id">) {
    setReleases((prev) =>
      prev.map((r) => {
        if (r.id !== releaseId) return r;
        return {
          ...r,
          milestones: [
            ...r.milestones,
            { ...milestone, id: Date.now().toString() },
          ],
        };
      })
    );
  }

  function toggleMilestone(releaseId: string, milestoneId: string) {
    setReleases((prev) =>
      prev.map((r) => {
        if (r.id !== releaseId) return r;
        return {
          ...r,
          milestones: r.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ),
        };
      })
    );
  }

  function deleteMilestone(releaseId: string, milestoneId: string) {
    setReleases((prev) =>
      prev.map((r) => {
        if (r.id !== releaseId) return r;
        return {
          ...r,
          milestones: r.milestones.filter((m) => m.id !== milestoneId),
        };
      })
    );
  }

  const sortedReleases = [...releases].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Release Timeline</h2>
        <button
          onClick={() => setShowAddRelease(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          New Release
        </button>
      </div>

      {releases.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-lg text-muted-foreground mb-2">No releases planned yet</p>
          <p className="text-sm text-muted-foreground">Start planning your next release to organize milestones and track progress</p>
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
              onAddMilestone={addMilestone}
              onToggleMilestone={toggleMilestone}
              onDeleteMilestone={deleteMilestone}
            />
          </div>
        )}
      </div>

      {showAddRelease && (
        <AddReleaseModal onClose={() => setShowAddRelease(false)} onAdd={addRelease} />
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
  const completedMilestones = release.milestones.filter((m) => m.completed).length;
  const totalMilestones = release.milestones.length;
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const daysUntilRelease = Math.ceil(
    (new Date(release.releaseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      onClick={onClick}
      className={`bg-card border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-2xl">
          Cover
        </div>
        <div className="flex-1">
          <div className="font-semibold text-lg">{release.title}</div>
          <div className="text-sm text-muted-foreground">{release.artist}</div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={release.status} />
            <span className="text-xs text-muted-foreground">
              {daysUntilRelease > 0 ? `${daysUntilRelease} days away` : daysUntilRelease === 0 ? "Today!" : "Released"}
            </span>
          </div>
          <div className="mt-2 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReleaseDetails({
  release,
  onUpdate,
  onDelete,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
}: {
  release: Release;
  onUpdate: (id: string, updates: Partial<Release>) => void;
  onDelete: (id: string) => void;
  onAddMilestone: (releaseId: string, milestone: Omit<Milestone, "id">) => void;
  onToggleMilestone: (releaseId: string, milestoneId: string) => void;
  onDeleteMilestone: (releaseId: string, milestoneId: string) => void;
}) {
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");
  const [notes, setNotes] = useState(release.notes || "");

  function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneTitle.trim() || !milestoneDueDate) return;

    onAddMilestone(release.id, {
      title: milestoneTitle.trim(),
      dueDate: milestoneDueDate,
      completed: false,
    });

    setMilestoneTitle("");
    setMilestoneDueDate("");
    setShowAddMilestone(false);
  }

  const sortedMilestones = [...release.milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">{release.title}</h3>
          <p className="text-muted-foreground">{release.artist}</p>
        </div>
        <button
          onClick={() => onDelete(release.id)}
          className="text-red-600 text-sm px-2 py-1 hover:bg-red-50 rounded"
        >
          Delete
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-1">Release Date</div>
        <input
          type="date"
          value={release.releaseDate}
          onChange={(e) => onUpdate(release.id, { releaseDate: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background"
        />
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-1">Status</div>
        <select
          value={release.status}
          onChange={(e) => onUpdate(release.id, { status: e.target.value as ReleaseStatus })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Milestones</div>
          <button
            onClick={() => setShowAddMilestone(!showAddMilestone)}
            className="text-sm text-primary"
          >
            + Add
          </button>
        </div>

        {showAddMilestone && (
          <form onSubmit={handleAddMilestone} className="mb-3 p-3 border border-border rounded-md">
            <input
              type="text"
              placeholder="Milestone title"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background mb-2"
            />
            <input
              type="date"
              value={milestoneDueDate}
              onChange={(e) => setMilestoneDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background mb-2"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddMilestone(false)}
                className="flex-1 px-3 py-1 border border-border rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
              >
                Add
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {sortedMilestones.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No milestones yet</p>
          )}
          {sortedMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-start gap-2 p-2 border border-border rounded-md"
            >
              <input
                type="checkbox"
                checked={milestone.completed}
                onChange={() => onToggleMilestone(release.id, milestone.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className={`text-sm ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
                  {milestone.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(milestone.dueDate).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => onDeleteMilestone(release.id, milestone.id)}
                className="text-red-600 text-xs px-2 py-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Notes</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onUpdate(release.id, { notes })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px]"
          placeholder="Add notes about this release..."
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReleaseStatus }) {
  if (status === "completed")
    return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">Completed</span>;
  if (status === "in_progress")
    return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">In Progress</span>;
  return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold">Planning</span>;
}

function AddReleaseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (release: Omit<Release, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [releaseDate, setReleaseDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !releaseDate) return;

    onAdd({
      title: title.trim(),
      artist: artist.trim(),
      releaseDate,
      status: "planning",
      milestones: [],
      notes: "",
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">New Release</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Release Date</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Create Release
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}