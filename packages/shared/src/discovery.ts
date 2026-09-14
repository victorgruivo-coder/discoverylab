import { z } from 'zod';

import { isoDate, isoDateTime, nonEmptyString, uuid } from './common.js';
import { discoveryStatus, discoveryType } from './enums.js';

/**
 * End dates must not precede start dates. Lexicographic comparison is exact for
 * YYYY-MM-DD, and an absent end date is always valid.
 */
function isChronologicalRange(range: {
  startDate?: string | undefined;
  endDate?: string | undefined;
}): boolean {
  if (range.startDate === undefined || range.endDate === undefined) {
    return true;
  }

  return range.endDate >= range.startDate;
}

const endDateRefinement = {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
};

/** Required to create a discovery: name and start date; everything else defaults. */
export const discoveryCreateInput = z
  .object({
    name: nonEmptyString,
    leadName: nonEmptyString.optional(),
    type: discoveryType.default('feature'),
    startDate: isoDate,
    endDate: isoDate.optional(),
  })
  .refine(isChronologicalRange, endDateRefinement);
export type DiscoveryCreateInput = z.infer<typeof discoveryCreateInput>;

/** Partial edit; every create field is optional here, plus the lifecycle status. */
export const discoveryUpdateInput = z
  .object({
    name: nonEmptyString.optional(),
    leadName: nonEmptyString.optional(),
    type: discoveryType.optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    status: discoveryStatus.optional(),
  })
  .refine(isChronologicalRange, endDateRefinement);
export type DiscoveryUpdateInput = z.infer<typeof discoveryUpdateInput>;

/** `deletedAt` is null while the discovery is live (soft delete). */
export const discoveryOutput = z.object({
  id: uuid,
  name: nonEmptyString,
  leadName: nonEmptyString.optional(),
  type: discoveryType,
  startDate: isoDate,
  endDate: isoDate.optional(),
  status: discoveryStatus,
  createdByUserId: uuid,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  deletedAt: isoDateTime.nullable(),
});
export type DiscoveryOutput = z.infer<typeof discoveryOutput>;
