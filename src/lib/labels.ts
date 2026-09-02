import type {
  Category,
  Priority,
  Role,
  TicketLinkType,
  TicketType,
} from "@/generated/prisma/client";

export const priorityLabels: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const ticketTypeLabels: Record<TicketType, string> = {
  INCIDENT: "Incident",
  SERVICE_REQUEST: "Service Request",
  QUESTION: "Question",
};

export const categoryLabels: Record<Category, string> = {
  HARDWARE: "Hardware",
  SOFTWARE: "Software",
  NETWORK: "Network",
  ACCOUNT_ACCESS: "Account Access",
  EMAIL: "Email",
  PRINTER: "Printer",
  SERVER: "Server",
  SECURITY: "Security",
  TELEPHONY: "Telephony",
  OTHER: "Other",
};

export const roleLabels: Record<Role, string> = {
  IT_OFFICER: "IT Officer",
  EMPLOYEE: "Employee",
};

// Verb form, from the link's source-ticket perspective (see direction
// handling in ticket-links-panel.tsx for the "Blocked by" reverse case).
export const ticketLinkTypeLabels: Record<TicketLinkType, string> = {
  DUPLICATES: "Duplicates",
  RELATES_TO: "Relates to",
  BLOCKS: "Blocks",
  REOPENS: "Reopens",
};
