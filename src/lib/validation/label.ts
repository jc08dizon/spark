import { z } from "zod";

const colorPattern = /^#[0-9A-Fa-f]{6}$/;

export const createLabelSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40, "Keep it short"),
  color: z.string().regex(colorPattern, "Choose a color"),
});

export const updateLabelSchema = z.object({
  labelId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(40, "Keep it short"),
  color: z.string().regex(colorPattern, "Choose a color"),
});
