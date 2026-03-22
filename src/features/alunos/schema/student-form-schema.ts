import { z } from "zod";

export const studentFormSchema = z.object({
  personId: z.string().min(1, "Select a person."),
  registrationNumber: z.string().min(1, "Enter the registration number."),
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE"]),
  school: z.string().min(1, "Enter the school name."),
  gradeClass: z.string().min(1, "Enter the grade/class."),
  startDate: z.string().min(1, "Select the start date."),
  notes: z.string().optional()
});

export type StudentFormSchema = z.infer<typeof studentFormSchema>;
