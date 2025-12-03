"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

/**
 * Component that checks if user has completed onboarding
 * Redirects to /onboarding if not completed
 */
export default function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, getAccessToken } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Skip check if not authenticated or already on onboarding page
    if (!user || pathname === "/onboarding") {
      setChecking(false);
      return;
    }

    checkOnboardingStatus();
  }, [user, pathname]);

  async function checkOnboardingStatus() {
    try {
      const token = getAccessToken();
      if (!token) {
        setChecking(false);
        return;
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        
        // Redirect to onboarding if not completed
        if (!data.onboardingCompleted) {
          router.push("/onboarding");
          return;
        }
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    } finally {
      setChecking(false);
    }
  }

  // Show loading state while checking
  if (checking && user && pathname !== "/onboarding") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}