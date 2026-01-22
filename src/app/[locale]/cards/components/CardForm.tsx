'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { saveCard } from '@/app/actions/card-actions';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

// Schema based on src/modules/cards/schema.ts
// Adapted for form usage (strings for numbers during input)
const formSchema = z.object({
  id: z.string().optional(),
  itemNumber: z.number().optional(), // Auto-generated

  // Player Info
  playerName: z.string().min(1, 'Player name is required'),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']),
  team: z.string().optional(),
  position: z.string().optional(),

  // Card Details
  year: z.coerce
    .number()
    .min(1800)
    .max(new Date().getFullYear() + 1),
  brand: z.string().min(1, 'Brand is required'),
  series: z.string().optional(),
  cardNumber: z.string().optional(),

  // Grading
  gradingCompany: z.enum(['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED']).default('UNGRADED'),
  grade: z.coerce.number().min(1).max(10).optional().nullable().or(z.literal('')),
  certificationNumber: z.string().optional(),

  // Value
  purchasePrice: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  purchaseDate: z.string().optional(), // Date input returns string
  currentValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  estimatedValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),

  // Physical
  parallel: z.string().optional(),
  serialNumber: z.string().optional(),
  isAutographed: z.boolean().default(false),
  hasMemorabilia: z.boolean().default(false),
  memorabiliaType: z.string().optional(),

  // Storage
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).default('COLLECTION'),
  location: z.string().optional(),
  storageType: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),

  // Images
  mainImage: z.string().optional(),
  frontImage: z.string().optional(),
  backImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CardFormProps {
  initialData?: Partial<FormValues>;
  onSuccess?: () => void;
}

export function CardForm({ initialData, onSuccess }: CardFormProps) {
  const { success, error } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      sport: 'BASKETBALL',
      gradingCompany: 'UNGRADED',
      status: 'COLLECTION',
      isAutographed: false,
      hasMemorabilia: false,
      year: new Date().getFullYear(),
      ...initialData,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Map images
      // Logic from monolithic page: mainImage is frontImage if not set?
      // Actually CardImageUpload handles detailed front/back.
      // Schema expects `mainImage` and `attachmentImages`.
      // We'll normalize this in the payload.

      const payload = {
        ...values,
        mainImage: values.frontImage || values.mainImage,
        attachmentImages: values.backImage ? [values.backImage] : [],
        // Clean up empty strings for numbers
        grade: values.grade === '' ? null : values.grade,
        purchasePrice: values.purchasePrice === '' ? null : values.purchasePrice,
        currentValue: values.currentValue === '' ? null : values.currentValue,
        estimatedValue: values.estimatedValue === '' ? null : values.estimatedValue,
      };

      await saveCard(payload);

      success('Success', 'Card saved successfully');

      form.reset();
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Player Info Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
            Player Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="playerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Michael Jordan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BASKETBALL">Basketball</SelectItem>
                      <SelectItem value="SOCCER">Soccer</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                  <FormControl>
                    <Input placeholder="Chicago Bulls" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="SG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Card Details Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Card Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand *</FormLabel>
                  <FormControl>
                    <Input placeholder="Fleer, Topps" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="series"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Series</FormLabel>
                  <FormControl>
                    <Input placeholder="Base, Chrome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card #</FormLabel>
                  <FormControl>
                    <Input placeholder="57" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Grading Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Grading</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gradingCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UNGRADED">Ungraded</SelectItem>
                      <SelectItem value="PSA">PSA</SelectItem>
                      <SelectItem value="BGS">BGS</SelectItem>
                      <SelectItem value="SGC">SGC</SelectItem>
                      <SelectItem value="CGC">CGC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="10"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cert Number</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Value Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
            Value & Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COLLECTION">Collection</SelectItem>
                      <SelectItem value="FOR_SALE">For Sale</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="GRADING">Grading</SelectItem>
                      <SelectItem value="DISPLAY">Display</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Attributes */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Attributes</h3>
          <div className="flex gap-6">
            <FormField
              control={form.control}
              name="isAutographed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                  <div className="space-y-0.5 mr-4">
                    <FormLabel className="text-base">Autographed</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasMemorabilia"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                  <div className="space-y-0.5 mr-4">
                    <FormLabel className="text-base">Memorabilia</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {form.watch('hasMemorabilia') && (
              <FormField
                control={form.control}
                name="memorabiliaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mem Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Jersey" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial #</FormLabel>
                  <FormControl>
                    <Input placeholder="xx/99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Images */}
        <CardImageUpload
          frontImage={form.watch('frontImage') || form.watch('mainImage') || ''}
          backImage={form.watch('backImage') || ''}
          onFrontImageChange={url => form.setValue('frontImage', url)}
          onBackImageChange={url => form.setValue('backImage', url)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess && onSuccess()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Card
          </Button>
        </div>
      </form>
    </Form>
  );
}
