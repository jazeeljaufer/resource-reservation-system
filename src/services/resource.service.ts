import { prisma } from "@/lib/prisma";
import type {
  CreateResourceInput,
  Resource,
  ResourceFilter,
  UpdateResourceInput,
} from "@/types/resource";
import { Prisma } from "@prisma/client";

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "INTERNAL" = "BAD_REQUEST"
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * Lists resources with optional filtering by type, active state, and search keyword.
 */
export async function listResources(filter?: ResourceFilter): Promise<Resource[]> {
  const where: Prisma.ResourceWhereInput = {};

  if (filter?.isActive !== undefined) {
    where.isActive = filter.isActive;
  }

  if (filter?.type) {
    where.type = {
      equals: filter.type,
      mode: "insensitive",
    };
  }

  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { location: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  return prisma.resource.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Retrieves a single resource by its numeric ID.
 */
export async function getResourceById(id: number): Promise<Resource | null> {
  return prisma.resource.findUnique({
    where: { id },
  });
}

/**
 * Creates a new resource with default active status.
 */
export async function createResource(data: CreateResourceInput): Promise<Resource> {
  return prisma.resource.create({
    data: {
      name: data.name,
      type: data.type,
      location: data.location ?? null,
      description: data.description ?? null,
      isActive: true,
    },
  });
}

/**
 * Updates an existing resource.
 * Throws a ServiceError with code NOT_FOUND if the record does not exist.
 */
export async function updateResource(
  id: number,
  data: UpdateResourceInput
): Promise<Resource> {
  const existing = await prisma.resource.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ServiceError(`Resource with ID ${id} was not found.`, "NOT_FOUND");
  }

  const updateData: Prisma.ResourceUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.resource.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Soft-deactivates a resource.
 * Preserves historical reservation records without hard-deleting.
 */
export async function deactivateResource(id: number): Promise<Resource> {
  const existing = await prisma.resource.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ServiceError(`Resource with ID ${id} was not found.`, "NOT_FOUND");
  }

  if (!existing.isActive) {
    return existing;
  }

  return prisma.resource.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Reactivates a deactivated resource.
 */
export async function reactivateResource(id: number): Promise<Resource> {
  const existing = await prisma.resource.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ServiceError(`Resource with ID ${id} was not found.`, "NOT_FOUND");
  }

  if (existing.isActive) {
    return existing;
  }

  return prisma.resource.update({
    where: { id },
    data: { isActive: true },
  });
}
