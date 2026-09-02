import { z } from "zod";

export const saveFilterSchema = z.object({
  basePath: z.enum(["/tickets", "/my-tasks"]),
  name: z.string().trim().min(1, "Name is required").max(60, "Keep it short"),
  query: z.string().max(2000),
});
