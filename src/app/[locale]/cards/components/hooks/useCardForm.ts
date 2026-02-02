'use client';

/**
 * useCardForm Hook
 *
 * Shared hook for card form logic, used by both CreateCardForm and EditCardForm.
 * Eliminates code duplication between the two forms.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { formSchema, type FormValues } from '../form-schema';
import { saveCard } from '@/app/actions/card-actions';
import { identifyCardAction, estimatePriceAction } from '@/app/actions/ai-card-actions';
import { compressImage } from '@/lib/utils/image-compression';

// Type for grading company values (matches form schema and AI result)
type GradingCompanyValue = 'PSA' | 'BGS' | 'SGC' | 'CGC' | 'UNGRADED';

interface UseCardFormOptions {
  initialData?: Partial<FormValues> & { id?: string };
  autoSaveOnAISuccess?: boolean;
  onSuccess?: () => void;
}

export function useCardForm({
  initialData,
  autoSaveOnAISuccess = false,
  onSuccess,
}: UseCardFormOptions = {}) {
  const t = useTranslations('cards.form');
  const tGlobal = useTranslations('global');
  const router = useRouter();

  const [aiScanning, setAiScanning] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [riskWarning, setRiskWarning] = useState<string | null>(null);
  const [imageQualityFeedback, setImageQualityFeedback] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(!!initialData?.id);

  // Create form with default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: '',
      sport: 'BASKETBALL' as const,
      team: '',
      position: '',
      year: new Date().getFullYear(),
      brand: '',
      series: '',
      cardNumber: '',
      gradingCompany: 'UNGRADED' as const,
      grade: undefined,
      certificationNumber: '',
      purchasePrice: undefined,
      purchaseDate: '',
      currentValue: undefined,
      estimatedValue: undefined,
      soldPrice: undefined,
      soldDate: '',
      parallel: '',
      serialNumber: '',
      isAutographed: false,
      hasMemorabilia: false,
      memorabiliaType: '',
      status: 'COLLECTION' as const,
      location: '',
      storageType: '',
      condition: '',
      notes: '',
      mainImage: '',
      frontImage: '',
      backImage: '',
      valuationSources: [],
      ...initialData,
    },
  });

  // Store submitForm in ref to avoid circular dependency
  const submitFormRef = useRef<((values: FormValues) => Promise<void>) | null>(null);

  const handleSmartScan = useCallback(async () => {
    const frontImage = form.getValues('frontImage') || form.getValues('mainImage');
    const backImage = form.getValues('backImage');

    if (!frontImage) {
      toast.error(t('errors.noFrontImage'));
      return;
    }

    setAiScanning(true);
    setRiskWarning(null);
    setImageQualityFeedback(null);

    try {
      // Compress images for AI processing
      const compressedFront = await compressImage(frontImage, { maxSizeKB: 512 });
      const compressedBack = backImage
        ? await compressImage(backImage, { maxSizeKB: 512 })
        : undefined;

      // Call AI identification
      const result = await identifyCardAction(compressedFront, compressedBack);

      // Handle warnings from AI
      if (result.riskWarning) setRiskWarning(result.riskWarning);
      if (result.imageQualityFeedback) setImageQualityFeedback(result.imageQualityFeedback);

      // Update form with AI results (only fields that exist in CardRecognitionResult)
      if (result.playerName) form.setValue('playerName', result.playerName);
      if (result.sport) form.setValue('sport', result.sport);
      if (result.team) form.setValue('team', result.team);
      if (result.year) form.setValue('year', result.year);
      if (result.brand) form.setValue('brand', result.brand);
      if (result.series) form.setValue('series', result.series);
      if (result.cardNumber) form.setValue('cardNumber', result.cardNumber);
      // Cast gradingCompany to correct type - AI may return values like 'PSA', 'BGS', etc.
      if (result.gradingCompany) {
        const gc = result.gradingCompany as GradingCompanyValue;
        if (['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED'].includes(gc)) {
          form.setValue('gradingCompany', gc);
        }
      }
      if (result.grade) form.setValue('grade', result.grade);
      if (result.isAutographed !== undefined) form.setValue('isAutographed', result.isAutographed);
      // Note: hasMemorabilia, parallel, serialNumber are not in CardRecognitionSchema

      toast.success(tGlobal('actions.scanSuccess'));
      setShowDetails(true);

      // Auto-save for CreateCardForm if enabled and we have minimum required data
      if (autoSaveOnAISuccess && result.playerName && result.brand && result.year) {
        toast.info(t('autoSaving'));
        const values = form.getValues() as FormValues;
        if (submitFormRef.current) {
          await submitFormRef.current(values);
        }
      }
    } catch (error) {
      console.error('AI scan error:', error);
      toast.error(error instanceof Error ? error.message : t('errors.aiScanFailed'));
    } finally {
      setAiScanning(false);
    }
  }, [form, autoSaveOnAISuccess, t, tGlobal]);

  const handleEstimatePrice = useCallback(async () => {
    const values = form.getValues();
    const playerName = values.playerName;
    const year = values.year;
    const brand = values.brand;

    if (!playerName || !year || !brand) {
      toast.error(t('errors.insufficientDataForEstimate'));
      return;
    }

    setEstimating(true);
    try {
      // Extract grade as number or undefined for the API
      const gradeValue = typeof values.grade === 'number' ? values.grade : undefined;

      const result = await estimatePriceAction({
        playerName,
        year: typeof year === 'number' ? year : Number(year),
        brand,
        gradingCompany: values.gradingCompany,
        grade: gradeValue,
      });

      // Use 'average' from PriceEstimateResult
      if (result.average) {
        form.setValue('currentValue', result.average);
        form.setValue('estimatedValue', result.average);
        toast.success(t('priceEstimated'));
      } else {
        toast.warning(t('errors.noEstimateAvailable'));
      }
    } catch (error) {
      console.error('Estimation error:', error);
      toast.error(error instanceof Error ? error.message : t('errors.estimateFailed'));
    } finally {
      setEstimating(false);
    }
  }, [form, t]);

  const submitForm = useCallback(
    async (values: FormValues) => {
      setLoading(true);
      try {
        const payload = {
          ...values,
          id: initialData?.id,
          mainImage: values.frontImage || values.mainImage,
          attachmentImages: values.backImage ? [values.backImage] : [],
        };

        await saveCard(payload);
        toast.success(initialData?.id ? t('updateSuccess') : t('createSuccess'));
        router.refresh();
        onSuccess?.();
      } catch (error) {
        console.error('Save error:', error);
        toast.error(error instanceof Error ? error.message : t('errors.saveFailed'));
      } finally {
        setLoading(false);
      }
    },
    [initialData?.id, router, onSuccess, t]
  );

  // Update ref when submitForm changes
  useEffect(() => {
    submitFormRef.current = submitForm;
  }, [submitForm]);

  // Create handler that wraps form.handleSubmit
  const handleSubmit = useCallback(
    (e?: React.BaseSyntheticEvent) => {
      return form.handleSubmit(async data => {
        await submitForm(data as FormValues);
      })(e);
    },
    [form, submitForm]
  );

  return {
    form: form as UseFormReturn<FormValues>,
    loading,
    aiScanning,
    estimating,
    riskWarning,
    imageQualityFeedback,
    showDetails,
    setShowDetails,
    handleSmartScan,
    handleEstimatePrice,
    handleSubmit,
    submitForm,
  };
}
