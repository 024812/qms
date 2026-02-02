import * as z from 'zod';

export const formSchema = z.object({
  id: z.string().optional(),
  itemNumber: z.number().optional(),

  // Player Info
  playerName: z.string().min(1, 'Player name is required'),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']),
  team: z.string().optional().nullable().or(z.literal('')),
  position: z.string().optional().nullable().or(z.literal('')),

  // Card Details
  year: z.coerce
    .number()
    .min(1800)
    .max(new Date().getFullYear() + 1),
  brand: z.string().min(1, 'Brand is required'),
  series: z.string().optional().nullable().or(z.literal('')),
  cardNumber: z.string().optional().nullable().or(z.literal('')),

  // Grading
  gradingCompany: z.enum(['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED']).default('UNGRADED'),
  grade: z.coerce.number().min(1).max(10).optional().nullable().or(z.literal('')),
  certificationNumber: z.string().optional().nullable().or(z.literal('')),

  // Value
  purchasePrice: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  purchaseDate: z.string().optional().nullable().or(z.literal('')),
  currentValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  estimatedValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  soldPrice: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  soldDate: z.string().optional().nullable().or(z.literal('')),

  // Valuation Metadata
  valuationDate: z.string().optional().nullable(), // ISO string
  valuationConfidence: z.string().optional().nullable(),
  valuationSources: z.array(z.string()).optional().default([]),

  // Physical
  parallel: z.string().optional().nullable().or(z.literal('')),
  serialNumber: z.string().optional().nullable().or(z.literal('')),
  isAutographed: z.boolean().default(false),
  hasMemorabilia: z.boolean().default(false),
  memorabiliaType: z.string().optional().nullable().or(z.literal('')),

  // Storage
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).default('COLLECTION'),
  location: z.string().optional().nullable().or(z.literal('')),
  storageType: z.string().optional().nullable().or(z.literal('')),
  condition: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),

  // Images
  mainImage: z.string().optional().nullable().or(z.literal('')),
  frontImage: z.string().optional().nullable().or(z.literal('')),
  backImage: z.string().optional().nullable().or(z.literal('')),
});

export type FormValues = z.infer<typeof formSchema>;
