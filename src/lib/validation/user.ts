import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["IT_OFFICER", "EMPLOYEE"], { message: "Choose a role" }),
  departmentId: z.string().min(1, "Choose a department"),
});

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(200),
  role: z.enum(["IT_OFFICER", "EMPLOYEE"], { message: "Choose a role" }),
  departmentId: z.string().min(1, "Choose a department"),
});
