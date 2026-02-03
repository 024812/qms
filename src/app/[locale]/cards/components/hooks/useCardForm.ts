'use client';

/**
 * useCardForm Hook
 *
 * Shared hook for card form logic, used by both CreateCardForm and EditCardForm.
 * Eliminates code duplication between the two forms.
 *
 * Refactored to use useReducer for better state management.
 */

import { useCallback, useRef, useEffect, useReducer } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { formSchema, type FormValues } from '../form-schema';
import { saveCard } from '@/app/actions/card-actions';
import {
  identifyCardAction,
  estimatePriceAction,
  analyzeAuthenticityAction,
} from '@/app/actions/ai-card-actions';
import { compressImage } from '@/lib/utils/image-compression';

// ========== State Types ==========

type FormStatus = 'idle' | 'saving' | 'scanning' | 'estimating' | 'checking-auth';

interface FormState {
  status: FormStatus;
  riskWarning: string | null;
  imageQualityFeedback: string | null;
  authCheckResult: 'SAFE' | 'RISK' | null;
  showDetails: boolean;
}

type FormAction =
  | { type: 'START_SCAN' }
  | { type: 'SCAN_SUCCESS'; payload: { riskWarning?: string | null; imageQuality?: string | null } }
  | { type: 'SCAN_ERROR' }
  | { type: 'START_ESTIMATE' }
  | { type: 'ESTIMATE_SUCCESS' }
  | { type: 'ESTIMATE_ERROR' }
  | { type: 'START_AUTH_CHECK' }
  | { type: 'AUTH_CHECK_SUCCESS'; result: 'SAFE' | 'RISK'; riskWarning?: string | null }
  | { type: 'AUTH_CHECK_ERROR' }
  | { type: 'START_SAVE' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR' }
  | { type: 'SHOW_DETAILS' }
  | { type: 'RESET_WARNINGS' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'START_SCAN':
      return {
        ...state,
        status: 'scanning',
        riskWarning: null,
        authCheckResult: null,
        imageQualityFeedback: null,
      };
    case 'SCAN_SUCCESS':
      return {
        ...state,
        status: 'idle',
        riskWarning: action.payload.riskWarning || null,
        imageQualityFeedback: action.payload.imageQuality || null,
        showDetails: true,
      };
    case 'SCAN_ERROR':
      return { ...state, status: 'idle' };
    case 'START_ESTIMATE':
      return { ...state, status: 'estimating' };
    case 'ESTIMATE_SUCCESS':
    case 'ESTIMATE_ERROR':
      return { ...state, status: 'idle' };
    case 'START_AUTH_CHECK':
      return { ...state, status: 'checking-auth', riskWarning: null, authCheckResult: null };
    case 'AUTH_CHECK_SUCCESS':
      return {
        ...state,
        status: 'idle',
        authCheckResult: action.result,
        riskWarning: action.riskWarning || null,
      };
    case 'AUTH_CHECK_ERROR':
      return { ...state, status: 'idle' };
    case 'START_SAVE':
      return { ...state, status: 'saving' };
    case 'SAVE_SUCCESS':
    case 'SAVE_ERROR':
      return { ...state, status: 'idle' };
    case 'SHOW_DETAILS':
      return { ...state, showDetails: true };
    case 'RESET_WARNINGS':
      return { ...state, riskWarning: null, imageQualityFeedback: null, authCheckResult: null };
    default:
      return state;
  }
}

// ========== Hook Options ==========

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
  const locale = useLocale();
  const router = useRouter();

  // Initial state
  const initialState: FormState = {
    status: 'idle',
    riskWarning: null,
    imageQualityFeedback: null,
    authCheckResult: null,
    showDetails: !!initialData?.id,
  };

  const [state, dispatch] = useReducer(formReducer, initialState);

  // Derived states for backwards compatibility
  const loading = state.status === 'saving';
  const aiScanning = state.status === 'scanning';
  const estimating = state.status === 'estimating';
  const checkingAuthenticity = state.status === 'checking-auth';

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

    dispatch({ type: 'START_SCAN' });

    try {
      // Compress images for AI processing
      const compressedFront = await compressImage(frontImage, { maxSizeKB: 512 });
      const compressedBack = backImage
        ? await compressImage(backImage, { maxSizeKB: 512 })
        : undefined;

      // Call AI identification with locale
      const result = await identifyCardAction(compressedFront, compressedBack, locale);

      // Update form with AI results
      if (result.playerName) form.setValue('playerName', result.playerName);
      if (result.sport) form.setValue('sport', result.sport);
      if (result.team) form.setValue('team', result.team);
      if (result.year) form.setValue('year', result.year);
      if (result.brand) form.setValue('brand', result.brand);
      if (result.series) form.setValue('series', result.series);
      if (result.cardNumber) form.setValue('cardNumber', result.cardNumber);

      if (result.gradingCompany) {
        const gc = result.gradingCompany as GradingCompanyValue;
        if (['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED'].includes(gc)) {
          form.setValue('gradingCompany', gc);
        }
      }
      if (result.grade) form.setValue('grade', result.grade);
      if (result.isAutographed !== undefined && result.isAutographed !== null) {
        form.setValue('isAutographed', result.isAutographed);
      }

      dispatch({
        type: 'SCAN_SUCCESS',
        payload: {
          riskWarning: result.riskWarning,
          imageQuality: result.imageQualityFeedback,
        },
      });

      toast.success(t('ai.identifySuccess'));

      // Auto-save logic (only if image quality is passable)
      if (autoSaveOnAISuccess && !result.imageQualityFeedback && result.playerName) {
        toast.info(t('autoSaving'));
        const values = form.getValues() as FormValues;
        if (submitFormRef.current) {
          await submitFormRef.current(values);
        }
      }
    } catch (error) {
      console.error('AI scan error:', error);
      toast.error(error instanceof Error ? error.message : t('errors.aiScanFailed'));
      dispatch({ type: 'SCAN_ERROR' });
    }
  }, [form, autoSaveOnAISuccess, t, locale]);

  const handleAuthenticityCheck = useCallback(async () => {
    const frontImage = form.getValues('frontImage') || form.getValues('mainImage');
    const backImage = form.getValues('backImage');

    if (!frontImage) {
      toast.error(t('errors.noFrontImage'));
      return;
    }

    dispatch({ type: 'START_AUTH_CHECK' });

    try {
      const compressedFront = await compressImage(frontImage, { maxSizeKB: 512 });
      const compressedBack = backImage
        ? await compressImage(backImage, { maxSizeKB: 512 })
        : undefined;

      const result = await analyzeAuthenticityAction(compressedFront, compressedBack, locale);

      if (result.riskWarning) {
        dispatch({ type: 'AUTH_CHECK_SUCCESS', result: 'RISK', riskWarning: result.riskWarning });
        toast.warning(t('ai.risksFound'));
      } else {
        dispatch({ type: 'AUTH_CHECK_SUCCESS', result: 'SAFE' });
        toast.success(t('ai.noRisksToken'));
      }
    } catch (error) {
      console.error('Authenticity check error:', error);
      toast.error(t('errors.authCheckFailed'));
      dispatch({ type: 'AUTH_CHECK_ERROR' });
    }
  }, [form, t, locale]);

  const handleEstimatePrice = useCallback(async () => {
    const values = form.getValues();
    const playerName = values.playerName;
    const year = values.year;
    const brand = values.brand;

    if (!playerName || !year || !brand) {
      toast.error(t('errors.insufficientDataForEstimate'));
      return;
    }

    dispatch({ type: 'START_ESTIMATE' });

    try {
      const gradeValue = typeof values.grade === 'number' ? values.grade : undefined;

      const result = await estimatePriceAction({
        playerName,
        year: typeof year === 'number' ? year : Number(year),
        brand,
        gradingCompany: values.gradingCompany,
        grade: gradeValue,
      });

      if (result.average) {
        form.setValue('currentValue', result.average);
        form.setValue('estimatedValue', result.average);
        toast.success(t('priceEstimated'));
      } else {
        toast.warning(t('errors.noEstimateAvailable'));
      }
      dispatch({ type: 'ESTIMATE_SUCCESS' });
    } catch (error) {
      console.error('Estimation error:', error);
      toast.error(error instanceof Error ? error.message : t('errors.estimateFailed'));
      dispatch({ type: 'ESTIMATE_ERROR' });
    }
  }, [form, t]);

  const submitForm = useCallback(
    async (values: FormValues) => {
      const promise = async () => {
        dispatch({ type: 'START_SAVE' });
        const payload = {
          ...values,
          id: initialData?.id,
          mainImage: values.frontImage || values.mainImage,
          attachmentImages: values.backImage ? [values.backImage] : [],
        };

        await saveCard(payload);
        router.refresh();
        dispatch({ type: 'SAVE_SUCCESS' });
        onSuccess?.();
      };

      toast.promise(promise(), {
        loading: t('saving'),
        success: initialData?.id ? t('updateSuccess') : t('createSuccess'),
        error: error => {
          console.error('Save error:', error);
          dispatch({ type: 'SAVE_ERROR' });
          return error instanceof Error ? error.message : t('errors.saveFailed');
        },
      });
    },
    [initialData, router, onSuccess, t]
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

  const setShowDetails = useCallback((show: boolean) => {
    if (show) dispatch({ type: 'SHOW_DETAILS' });
  }, []);

  return {
    form: form as UseFormReturn<FormValues>,
    loading,
    aiScanning,
    estimating,
    checkingAuthenticity,
    riskWarning: state.riskWarning,
    authCheckResult: state.authCheckResult,
    imageQualityFeedback: state.imageQualityFeedback,
    showDetails: state.showDetails,
    setShowDetails,
    handleSmartScan,
    handleEstimatePrice,
    handleAuthenticityCheck,
    handleSubmit,
    submitForm,
  };
}
