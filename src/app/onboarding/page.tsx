"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";

// Multi-select options for help needed
const HELP_OPTIONS = [
  { id: "project_planning", label: "Project planning or organization" },
  { id: "time_management", label: "Time management" },
  { id: "social_media_promotion", label: "Social media promotion" },
  { id: "networking", label: "Networking with peers" },
];

// Progress stages
const PROGRESS_OPTIONS = [
  { id: "not_started", label: "Not Started" },
  { id: "planning", label: "Planning" },
  { id: "in_progress", label: "In Progress" },
  { id: "ready_to_launch", label: "Ready to Launch" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [hasReleasePlan, setHasReleasePlan] = useState<boolean | null>(null);
  const [releaseProgress, setReleaseProgress] = useState("");
  const [helpNeeded, setHelpNeeded] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Toggle help option selection
  function toggleHelpOption(optionId: string) {
    setHelpNeeded(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  }

  // Submit onboarding data
  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const token = getAccessToken();
      if (!token) {
        setError("Authentication required. Please try logging in again.");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          hasReleasePlan,
          releaseProgress,
          helpNeeded,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save onboarding data");
      }

      // Redirect to dashboard after successful onboarding
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Check if current step is valid
  function canProceed() {
    if (currentStep === 1) return hasReleasePlan !== null;
    if (currentStep === 2) return releaseProgress !== "";
    if (currentStep === 3) return helpNeeded.length > 0;
    return false;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to k.ai
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let&apos;s personalize your experience
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step <= currentStep
                  ? "bg-indigo-600 w-16"
                  : "bg-gray-200 dark:bg-gray-700 w-8"
              }`}
            />
          ))}
        </div>

        {/* Main card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Release Plan */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Do you currently have a release plan?
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setHasReleasePlan(true)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    hasReleasePlan === true
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Yes</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    I have a plan for my upcoming release
                  </div>
                </button>
                <button
                  onClick={() => setHasReleasePlan(false)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    hasReleasePlan === false
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">No</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    I need help creating a release plan
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Progress Stage */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                What stage are you at with your release?
              </h2>
              <div className="space-y-3">
                {PROGRESS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setReleaseProgress(option.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      releaseProgress === option.id
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Help Needed */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                What help do you need most?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select all that apply
              </p>
              <div className="space-y-3">
                {HELP_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleHelpOption(option.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                      helpNeeded.includes(option.id)
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      helpNeeded.includes(option.id)
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {helpNeeded.includes(option.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Back
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
          © 2025 k.ai. All rights reserved.
        </p>
      </div>
    </div>
  );
}