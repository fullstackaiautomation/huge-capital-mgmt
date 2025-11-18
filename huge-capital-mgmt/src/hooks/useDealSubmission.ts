import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { submitDeal, type DealSubmissionProgress, type DealSubmissionResult } from '../services/dealSubmission';
import type { LoanType } from '../types/deals';

interface UseDealSubmissionReturn {
  submitNewDeal: (files: File[], loanType: LoanType) => Promise<DealSubmissionResult>;
  progress: DealSubmissionProgress | null;
  isSubmitting: boolean;
  error: string | null;
  reset: () => void;
}

export function useDealSubmission(): UseDealSubmissionReturn {
  const [progress, setProgress] = useState<DealSubmissionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitNewDeal = async (files: File[], loanType: LoanType): Promise<DealSubmissionResult> => {
    try {
      setIsSubmitting(true);
      setError(null);
      setProgress(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Submit deal with progress tracking
      const result = await submitDeal(
        files,
        user.id,
        loanType,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      if (!result.success) {
        setError(result.error || 'Deal submission failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit deal';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setProgress(null);
    setIsSubmitting(false);
    setError(null);
  };

  return {
    submitNewDeal,
    progress,
    isSubmitting,
    error,
    reset,
  };
}
