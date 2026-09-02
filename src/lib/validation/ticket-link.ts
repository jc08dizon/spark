import { z } from "zod";

export const addTicketLinkSchema = z.object({
  ticketId: z.string().min(1),
  key: z
    .string()
    .trim()
    .min(1, "Enter a ticket key, e.g. ITSD-7"),
  linkType: z.enum(["DUPLICATES", "RELATES_TO", "BLOCKS", "REOPENS"]),
});

export type AddTicketLinkInput = z.infer<typeof addTicketLinkSchema>;
