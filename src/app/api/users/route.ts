import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Malformed JSON in request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

    const errors: string[] = [];
    if (!name) {
      errors.push("User name is required.");
    } else if (name.length > 100) {
      errors.push("User name must not exceed 100 characters.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.push("User email is required.");
    } else if (!emailRegex.test(email)) {
      errors.push("A valid email address is required.");
    } else if (email.length > 150) {
      errors.push("Email must not exceed 150 characters.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { message: "Validation failed.", errors },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { message: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { message: "Failed to create user." },
      { status: 500 }
    );
  }
}
