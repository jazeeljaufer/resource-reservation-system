import type {
  CreateResourceInput,
  ResourceFilter,
  UpdateResourceInput,
} from "@/types/resource";

export type ValidationResult<T> =
  | { success: true; data: T; errors?: never }
  | { success: false; data?: never; errors: string[] };

const MAX_NAME_LENGTH = 100;
const MAX_TYPE_LENGTH = 50;
const MAX_LOCATION_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 500;

export function validateResourceId(id: unknown): ValidationResult<number> {
  const numericId = typeof id === "string" ? Number(id) : id;

  if (
    typeof numericId !== "number" ||
    !Number.isInteger(numericId) ||
    numericId <= 0
  ) {
    return {
      success: false,
      errors: ["Resource ID must be a positive integer."],
    };
  }

  return { success: true, data: numericId };
}

export function validateCreateResourceInput(
  input: unknown
): ValidationResult<CreateResourceInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return {
      success: false,
      errors: ["Request body must be a valid JSON object."],
    };
  }

  const payload = input as Record<string, unknown>;

  // Validate Name
  let name = "";
  if (typeof payload.name !== "string" || payload.name.trim().length === 0) {
    errors.push("Resource name is required.");
  } else {
    name = payload.name.trim();
    if (name.length > MAX_NAME_LENGTH) {
      errors.push(`Resource name must not exceed ${MAX_NAME_LENGTH} characters.`);
    }
  }

  // Validate Type
  let type = "";
  if (typeof payload.type !== "string" || payload.type.trim().length === 0) {
    errors.push("Resource type is required.");
  } else {
    type = payload.type.trim();
    if (type.length > MAX_TYPE_LENGTH) {
      errors.push(`Resource type must not exceed ${MAX_TYPE_LENGTH} characters.`);
    }
  }

  // Validate Location (optional)
  let location: string | null = null;
  if (payload.location !== undefined && payload.location !== null) {
    if (typeof payload.location !== "string") {
      errors.push("Location must be a string if provided.");
    } else {
      const trimmedLocation = payload.location.trim();
      if (trimmedLocation.length > MAX_LOCATION_LENGTH) {
        errors.push(
          `Location must not exceed ${MAX_LOCATION_LENGTH} characters.`
        );
      }
      location = trimmedLocation.length > 0 ? trimmedLocation : null;
    }
  }

  // Validate Description (optional)
  let description: string | null = null;
  if (payload.description !== undefined && payload.description !== null) {
    if (typeof payload.description !== "string") {
      errors.push("Description must be a string if provided.");
    } else {
      const trimmedDesc = payload.description.trim();
      if (trimmedDesc.length > MAX_DESCRIPTION_LENGTH) {
        errors.push(
          `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`
        );
      }
      description = trimmedDesc.length > 0 ? trimmedDesc : null;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      type,
      location,
      description,
    },
  };
}

export function validateUpdateResourceInput(
  input: unknown
): ValidationResult<UpdateResourceInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return {
      success: false,
      errors: ["Request body must be a valid JSON object."],
    };
  }

  const payload = input as Record<string, unknown>;
  const result: UpdateResourceInput = {};
  let hasFields = false;

  // Name
  if (payload.name !== undefined) {
    hasFields = true;
    if (typeof payload.name !== "string" || payload.name.trim().length === 0) {
      errors.push("Resource name cannot be empty.");
    } else {
      const trimmed = payload.name.trim();
      if (trimmed.length > MAX_NAME_LENGTH) {
        errors.push(`Resource name must not exceed ${MAX_NAME_LENGTH} characters.`);
      }
      result.name = trimmed;
    }
  }

  // Type
  if (payload.type !== undefined) {
    hasFields = true;
    if (typeof payload.type !== "string" || payload.type.trim().length === 0) {
      errors.push("Resource type cannot be empty.");
    } else {
      const trimmed = payload.type.trim();
      if (trimmed.length > MAX_TYPE_LENGTH) {
        errors.push(`Resource type must not exceed ${MAX_TYPE_LENGTH} characters.`);
      }
      result.type = trimmed;
    }
  }

  // Location
  if (payload.location !== undefined) {
    hasFields = true;
    if (payload.location === null) {
      result.location = null;
    } else if (typeof payload.location !== "string") {
      errors.push("Location must be a string or null.");
    } else {
      const trimmed = payload.location.trim();
      if (trimmed.length > MAX_LOCATION_LENGTH) {
        errors.push(
          `Location must not exceed ${MAX_LOCATION_LENGTH} characters.`
        );
      }
      result.location = trimmed.length > 0 ? trimmed : null;
    }
  }

  // Description
  if (payload.description !== undefined) {
    hasFields = true;
    if (payload.description === null) {
      result.description = null;
    } else if (typeof payload.description !== "string") {
      errors.push("Description must be a string or null.");
    } else {
      const trimmed = payload.description.trim();
      if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
        errors.push(
          `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`
        );
      }
      result.description = trimmed.length > 0 ? trimmed : null;
    }
  }

  // isActive
  if (payload.isActive !== undefined) {
    hasFields = true;
    if (typeof payload.isActive !== "boolean") {
      errors.push("isActive must be a boolean.");
    } else {
      result.isActive = payload.isActive;
    }
  }

  if (!hasFields) {
    return {
      success: false,
      errors: ["At least one field must be provided to update."],
    };
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: result };
}

export function validateResourceFilter(
  query: unknown
): ValidationResult<ResourceFilter> {
  if (!query || typeof query !== "object") {
    return { success: true, data: {} };
  }

  const params = query as Record<string, unknown>;
  const filter: ResourceFilter = {};

  if (typeof params.type === "string" && params.type.trim().length > 0) {
    filter.type = params.type.trim();
  }

  if (params.isActive !== undefined) {
    if (params.isActive === true || params.isActive === "true") {
      filter.isActive = true;
    } else if (params.isActive === false || params.isActive === "false") {
      filter.isActive = false;
    }
  }

  if (typeof params.search === "string" && params.search.trim().length > 0) {
    filter.search = params.search.trim();
  }

  return { success: true, data: filter };
}
