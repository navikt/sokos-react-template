import { z } from "zod";

export const EmployeeSchema = z.object({
	id: z.number(),
	name: z.string(),
	profession: z.string(),
});

export const EmployeeListeSchema = z.array(EmployeeSchema);
