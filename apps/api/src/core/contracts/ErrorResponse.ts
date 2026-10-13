import { z } from 'zod';

export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ example: 'NOT_FOUND' }),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .meta({ id: 'ErrorResponseDto', description: 'Body returned by every failed request' });

export type ErrorResponseDto = z.infer<typeof ErrorResponseSchema>;
