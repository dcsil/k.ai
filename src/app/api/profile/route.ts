/**
 * GET /api/profile
 * Returns user profile information including onboarding status
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    const userId = payload.sub;

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse helpNeeded JSON string back to array
    const helpNeeded = profile.helpNeeded ? JSON.parse(profile.helpNeeded) : [];

    return NextResponse.json({
      ...profile,
      helpNeeded, // Override with parsed array
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}