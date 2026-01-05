import type { z } from "zod";
import type {
	EmployeeListeSchema,
	EmployeeSchema,
} from "./schema/EmployeeSchema";

export type EmployeeList = z.infer<typeof EmployeeListeSchema>;

export type Employee = z.infer<typeof EmployeeSchema>;
