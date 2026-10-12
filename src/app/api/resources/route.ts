import { NextResponse } from "next/server";
import {
  createResource,
  listResources,
  ServiceError,
} from "@/services/resource.service";
import {
  validateCreateResourceInput,
  validateResourceFilter,
} from "@/validators/resource";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawFilter = {
      type: searchParams.get("type") ?? undefined,
      isActive: searchParams.get("isActive") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const filterResult = validateResourceFilter(rawFilter);
    if (!filterResult.success) {
      return NextResponse.json(
        { message: "Invalid filter parameters", errors: filterResult.errors },
        { status: 400 }
      );
    }

    const resources = await listResources(filterResult.data);
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve resources." },
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

    const validation = validateCreateResourceInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.errors },
        { status: 400 }
      );
    }

    const resource = await createResource(validation.data);
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    if (error instanceof ServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ message: error.message }, { status });
    }

    console.error("POST /api/resources error:", error);
    return NextResponse.json(
      { message: "Failed to create resource." },
      { status: 500 }
    );
  }
}