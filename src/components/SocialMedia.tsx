"use client";

import React, { useState, useEffect } from "react";

type Platform = "instagram" | "facebook" | "x" | "tiktok" | "youtube";

type PostStatus = "draft" | "scheduled" | "published" | "pending";

type SocialPost = {
  id: string;
  content: string;
  platforms: Platform[];
  scheduledFor?: string;
  status: PostStatus;
  mediaUrl?: string;
  videoUrl?: string;
  title?: string;
  createdAt: string;
};

const STORAGE_KEY = "k_ai_social_posts_v1";

export default function SocialMedia() {
  const [posts, setPosts] = useState<SocialPost[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) return JSON.parse(raw) as SocialPost[];
    } catch {
      /* ignore */
    }
    return [];
  });

  const [showComposer, setShowComposer] = useState(false);
  const [filter, setFilter] = useState<PostStatus | "all">("all");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      // ignore
    }
  }, [posts]);

  function addPost(post: Omit<SocialPost, "id" | "createdAt">) {
    const newPost: SocialPost = {
      ...post,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setShowComposer(false);
  }

  function deletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePostStatus(id: string, status: PostStatus) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const stats = {
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Social Media</h2>
        <button
          onClick={() => setShowComposer(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Create Post
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Drafts" value={stats.draft} color="gray" />
        <StatCard label="Scheduled" value={stats.scheduled} color="blue" />
        <StatCard label="Published" value={stats.published} color="green" />
      </div>

      <div className="mb-6 flex gap-2">
        <FilterButton
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterButton
          label="Drafts"
          active={filter === "draft"}
          onClick={() => setFilter("draft")}
        />
        <FilterButton
          label="Scheduled"
          active={filter === "scheduled"}
          onClick={() => setFilter("scheduled")}
        />
        <FilterButton
          label="Published"
          active={filter === "published"}
          onClick={() => setFilter("published")}
        />
      </div>

      <div className="space-y-4">
        {filteredPosts.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-lg text-muted-foreground">No posts found</p>
          </div>
        )}

        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={deletePost}
            onUpdateStatus={updatePostStatus}
          />
        ))}
      </div>

      {showComposer && (
        <PostComposer onClose={() => setShowComposer(false)} onAdd={addPost} />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function FilterButton({
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
      className={`px-4 py-2 rounded-md text-sm ${
        active ? "bg-primary text-primary-foreground" : "border border-border"
      }`}
    >
      {label}
    </button>
  );
}

function PostCard({
  post,
  onDelete,
  onUpdateStatus,
}: {
  post: SocialPost;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: PostStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={post.status} />
              {post.scheduledFor && (
                <span className="text-xs text-muted-foreground">
                  {new Date(post.scheduledFor).toLocaleDateString()} at{" "}
                  {new Date(post.scheduledFor).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <p className="text-sm line-clamp-2">{post.content}</p>
            <div className="flex gap-2 mt-2">
              {post.platforms.map((platform) => (
                <PlatformIcon key={platform} platform={platform} />
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground ml-4">
            {expanded ? "▼" : "▶"}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 bg-popover">
          <div className="space-y-3">
            {post.title && (
              <div>
                <div className="text-sm font-semibold mb-1">Title</div>
                <p className="text-sm">{post.title}</p>
              </div>
            )}

            {post.content && (
              <div>
                <div className="text-sm font-semibold mb-1">Content</div>
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              </div>
            )}

            {post.mediaUrl && (
              <div>
                <div className="text-sm font-semibold mb-1">Media</div>
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                  Image attached
                </div>
              </div>
            )}

            {post.videoUrl && (
              <div>
                <div className="text-sm font-semibold mb-1">Video URL</div>
                <p className="text-sm text-blue-600 break-all">{post.videoUrl}</p>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold mb-1">Platforms</div>
              <div className="flex gap-2">
                {post.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-2 py-1 bg-accent/20 rounded text-xs"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {post.status === "draft" && (
                <button
                  onClick={() => onUpdateStatus(post.id, "scheduled")}
                  className="px-3 py-1 text-sm border border-border rounded-md"
                >
                  Schedule
                </button>
              )}
              {post.status === "scheduled" && (
                <button
                  onClick={() => onUpdateStatus(post.id, "draft")}
                  className="px-3 py-1 text-sm border border-border rounded-md"
                >
                  Unschedule
                </button>
              )}
              <button
                onClick={() => onDelete(post.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === "published")
    return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">Published</span>;
  if (status === "scheduled")
    return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">Scheduled</span>;
  return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold">Draft</span>;
}

function PlatformIcon({ platform }: { platform: Platform }) {
  const icons = {
    instagram: "IG",
    facebook: "FB",
    x: "X",
    tiktok: "TT",
    youtube: "YT",
  };

  return (
    <span className="text-sm" title={platform}>
      {icons[platform]}
    </span>
  );
}

function PostComposer({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (post: Omit<SocialPost, "id" | "createdAt">) => void;
}) {
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [mediaUrl, setMediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function togglePlatform(platform: Platform) {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    // Validation
    if (!content.trim() && !videoUrl.trim()) {
      setSubmitError("Please provide content or a video URL");
      return;
    }
    if (platforms.length === 0) {
      setSubmitError("Select at least one platform");
      return;
    }
    if (platforms.includes("youtube") && !videoUrl.trim()) {
      setSubmitError("YouTube requires a video URL");
      return;
    }
    if (platforms.includes("youtube") && !title.trim()) {
      setSubmitError("YouTube requires a title");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to backend for each platform
      for (const platform of platforms) {
        const payload =
          platform === "youtube"
            ? {
                platform: "youtube",
                videoUrl,
                title,
                privacyType: "private",
                scheduledAt: scheduledFor || undefined,
              }
            : {
                platform: "instagram",
                text: content.trim(),
                imageUrl: mediaUrl || undefined,
                scheduledAt: scheduledFor || undefined,
              };

        const response = await fetch("/api/social/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to post to ${platform}`);
        }
      }

      // Add to local state after successful submission
      onAdd({
        content: content.trim() || title,
        platforms,
        scheduledFor: scheduledFor || undefined,
        status,
        mediaUrl: mediaUrl || undefined,
        videoUrl: videoUrl || undefined,
        title: title || undefined,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit post"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isYouTubeSelected = platforms.includes("youtube");
  const isInstagramSelected = platforms.some(
    (p) => p !== "youtube"
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Create Post</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
              {submitError}
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-2">Platforms</label>
            <div className="grid grid-cols-5 gap-2">
              {(["instagram", "facebook", "x", "tiktok", "youtube"] as Platform[]).map(
                (platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`px-3 py-2 rounded-md text-sm capitalize ${
                      platforms.includes(platform)
                        ? "bg-primary text-primary-foreground"
                        : "border border-border"
                    }`}
                  >
                    {platform}
                  </button>
                )
              )}
            </div>
          </div>

          {isYouTubeSelected && (
            <>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Video URL *
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="https://example.com/video.mp4"
                  required={isYouTubeSelected}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="My awesome video title"
                  required={isYouTubeSelected}
                />
              </div>
            </>
          )}

          {isInstagramSelected && (
            <>
              <div>
                <label className="text-sm font-medium block mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px]"
                  placeholder="Write your post content..."
                  required={isInstagramSelected}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {content.length} characters
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => {
                setScheduledFor(e.target.value);
                if (e.target.value) {
                  setStatus("scheduled");
                } else {
                  setStatus("draft");
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : status === "scheduled"
                ? "Schedule Post"
                : "Save Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}