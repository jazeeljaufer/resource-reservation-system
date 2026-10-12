import { NextResponse } from "next/server";
import {
  deactivateResource,
  getResourceById,
  ServiceError,
  updateResource,
} from "@/services/resource.service";
import {
  validateResourceId,
  validateUpdateResourceInput,
} from "@/validators/resource";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = validateResourceId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { message: "Invalid resource ID.", errors: idValidation.errors },
        { status: 400 }
      );
    }

    const resource = await getResourceById(idValidation.data);
    if (!resource) {
      return NextResponse.json(
        { message: `Resource with ID ${idValidation.data} was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(resource, { status: 200 });
  } catch (error) {
    console.error("GET /api/resources/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve resource." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = validateResourceId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { message: "Invalid resource ID.", errors: idValidation.errors },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Malformed JSON in request body." },
        { status: 400 }
      );
    }

    const validation = validateUpdateResourceInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed.", errors: validation.errors },
        { status: 400 }
      );
    }

    const updated = await updateResource(idValidation.data, validation.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ message: error.message }, { status });
    }

    console.error("PATCH /api/resources/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to update resource." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = validateResourceId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { message: "Invalid resource ID.", errors: idValidation.errors },
        { status: 400 }
      );
    }

    const deactivated = await deactivateResource(idValidation.data);
    return NextResponse.json(
      {
        message: "Resource deactivated successfully.",
        resource: deactivated,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ message: error.message }, { status });
    }

    console.error("DELETE /api/resources/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to deactivate resource." },
      { status: 500 }
    );
  }
}
