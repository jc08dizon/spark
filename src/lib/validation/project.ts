import { z } from "zod";

// Key format matches the display convention used by formatTicketKey
// (e.g. "ITSD") — uppercase letters only, short, immutable after creation.
const keyPattern = /^[A-Z]{2,10}$/;

export const createProjectSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(keyPattern, "2-10 uppercase letters, e.g. ITSD"),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  leadId: z.string().nullable().optional(),
});

export const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  leadId: z.string().nullable().optional(),
  isActive: z.boolean(),
});
