import type { Resource } from "@prisma/client";

export type { Resource };

export interface CreateResourceInput {
  name: string;
  type: string;
  location?: string | null;
  description?: string | null;
}

export interface UpdateResourceInput {
  name?: string;
  type?: string;
  location?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface ResourceFilter {
  type?: string;
  isActive?: boolean;
  search?: string;
}
