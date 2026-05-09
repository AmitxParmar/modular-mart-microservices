import { z } from "zod";

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  zip: z.string().min(3, "Valid ZIP/Postal code is required"),
  country: z.string().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
