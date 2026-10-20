import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  offering_id: z.coerce.number().int('common:validationError').positive('common:validationError').optional(),
  search: z.string().max(200, 'common:validationError').default(''),
  page: z.coerce.number().int('common:validationError').min(1, 'common:validationError').default(1),
  per_page: z.coerce.number().int('common:validationError').min(1, 'common:validationError').max(100, 'common:validationError').default(20),
  sort: z.string().default(''),
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
