import { z } from "zod";

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Keep the title under 200 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000, "Keep the description under 5000 characters"),
  type: z.enum(["INCIDENT", "SERVICE_REQUEST", "QUESTION"], {
    message: "Choose a ticket type",
  }),
  category: z
    .enum([
      "HARDWARE",
      "SOFTWARE",
      "NETWORK",
      "ACCOUNT_ACCESS",
      "EMAIL",
      "PRINTER",
      "SERVER",
      "SECURITY",
      "TELEPHONY",
      "OTHER",
    ])
    .nullable()
    .optional(),
  reporterId: z.string().nullable().optional(),
  reopenFromTicketId: z.string().nullable().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketFieldSchema = z.discriminatedUnion("field", [
  z.object({
    ticketId: z.string().min(1),
    field: z.literal("statusId"),
    value: z.string().min(1, "Choose a status"),
  }),
  z.object({
    ticketId: z.string().min(1),
    field: z.literal("assigneeId"),
    value: z.string().min(1).nullable(),
  }),
  z.object({
    ticketId: z.string().min(1),
    field: z.literal("priority"),
    value: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  }),
  z.object({
    ticketId: z.string().min(1),
    field: z.literal("category"),
    value: z
      .enum([
        "HARDWARE",
        "SOFTWARE",
        "NETWORK",
        "ACCOUNT_ACCESS",
        "EMAIL",
        "PRINTER",
        "SERVER",
        "SECURITY",
        "TELEPHONY",
        "OTHER",
      ])
      .nullable(),
  }),
  z.object({
    ticketId: z.string().min(1),
    field: z.literal("title"),
    value: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Keep the title under 200 characters"),
  }),
  z.object({
    ticketId: z.string().min(1),
    field: z.literal("description"),
    value: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(5000, "Keep the description under 5000 characters"),
  }),
  z.object({
    ticketId: z.string().min(1),
    field: z.literal("dueDate"),
    // "YYYY-MM-DD" from a native date input, or null to clear.
    value: z.string().nullable(),
  }),
]);

export type UpdateTicketFieldInput = z.infer<typeof updateTicketFieldSchema>;

export const addCommentSchema = z.object({
  ticketId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Write a comment first")
    .max(2000, "Keep comments under 2000 characters"),
});

export const cancelTicketSchema = z.object({
  ticketId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(1, "A cancellation reason is required")
    .max(2000, "Keep the cancellation reason under 2000 characters"),
});

export function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
