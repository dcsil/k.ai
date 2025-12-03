/**
 * POST /api/profile/onboarding
 * Handles user onboarding completion, creates profile and generates default tasks
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

// Task templates based on user progress
const TASK_TEMPLATES = {
  not_started: [
    { title: "Define your release goals", priority: "HIGH" },
    { title: "Set target release date", priority: "HIGH" },
    { title: "Create release timeline", priority: "MEDIUM" },
    { title: "Plan promotional strategy", priority: "MEDIUM" },
    { title: "Identify target audience", priority: "MEDIUM" },
  ],
  planning: [
    { title: "Finalize track list", priority: "HIGH" },
    { title: "Create release artwork", priority: "HIGH" },
    { title: "Write press release", priority: "MEDIUM" },
    { title: "Plan social media content", priority: "MEDIUM" },
    { title: "Research playlist curators", priority: "LOW" },
  ],
  in_progress: [
    { title: "Schedule social media posts", priority: "HIGH" },
    { title: "Create promotional graphics", priority: "HIGH" },
    { title: "Reach out to playlist curators", priority: "MEDIUM" },
    { title: "Prepare press kit", priority: "MEDIUM" },
    { title: "Set up pre-save campaign", priority: "LOW" },
  ],
  ready_to_launch: [
    { title: "Final review of all assets", priority: "HIGH" },
    { title: "Schedule launch day posts", priority: "HIGH" },
    { title: "Send to distribution platform", priority: "HIGH" },
    { title: "Notify email list", priority: "MEDIUM" },
    { title: "Celebrate your release!", priority: "LOW" },
  ],
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload?.sub) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = payload.sub;

    // Parse request body
    const body = await request.json();
    const { hasReleasePlan, releaseProgress, helpNeeded } = body;

    // Validate required fields
    if (typeof hasReleasePlan !== "boolean" || !releaseProgress || !Array.isArray(helpNeeded)) {
      return NextResponse.json(
        { error: "Invalid onboarding data" },
        { status: 400 }
      );
    }

    // Create or update user profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        hasReleasePlan,
        releaseProgress,
        helpNeeded: JSON.stringify(helpNeeded),
        onboardingCompleted: true,
      },
      update: {
        hasReleasePlan,
        releaseProgress,
        helpNeeded: JSON.stringify(helpNeeded),
        onboardingCompleted: true,
      },
    });

    // Create default release strategy
    const existingStrategy = await prisma.releaseStrategy.findFirst({
      where: { userId },
    });

    let releaseStrategy;
    if (!existingStrategy) {
      releaseStrategy = await prisma.releaseStrategy.create({
        data: {
          userId,
          name: "My First Release",
        },
      });
    } else {
      releaseStrategy = existingStrategy;
    }

    // Generate default tasks based on progress
    const taskTemplates = TASK_TEMPLATES[releaseProgress as keyof typeof TASK_TEMPLATES] || TASK_TEMPLATES.not_started;
    
    // Check if tasks already exist for this release
    const existingTasks = await prisma.task.findMany({
      where: { releaseStrategyId: releaseStrategy.id },
    });

    // Only create tasks if none exist
    if (existingTasks.length === 0) {
      await prisma.task.createMany({
        data: taskTemplates.map((template, index) => ({
          userId,
          releaseStrategyId: releaseStrategy.id,
          title: template.title,
          priority: template.priority as "LOW" | "MEDIUM" | "HIGH",
          status: "NOT_STARTED",
          position: index,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      profile,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}