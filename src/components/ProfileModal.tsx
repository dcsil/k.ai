"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";

type UserProfile = {
  userId: string;
  hasReleasePlan: boolean;
  releaseProgress: string;
  helpNeeded: string | string[]; // Can be JSON string or parsed array
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { getAccessToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  async function loadProfile() {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Has Release Plan
              </label>
              <p className="text-gray-900 dark:text-white">
                {profile.hasReleasePlan ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Release Progress
              </label>
              <p className="text-gray-900 dark:text-white capitalize">
                {profile.releaseProgress?.replace(/_/g, " ") || "Not set"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Help Needed
              </label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const helpNeededArray = typeof profile.helpNeeded === 'string' 
                    ? JSON.parse(profile.helpNeeded) 
                    : profile.helpNeeded;
                  return helpNeededArray && helpNeededArray.length > 0 ? (
                    helpNeededArray.map((item: string) => (
                      <span
                        key={item}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-sm"
                      >
                        {item.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">None specified</p>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No profile data found</p>
        )}
      </div>
    </div>
  );
}