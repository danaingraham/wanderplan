import type { ReactNode } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useUser } from '../../contexts/UserContext';
import { OnboardingWizard } from './OnboardingWizard';

interface OnboardingCheckProps {
  children: ReactNode;
}

export function OnboardingCheck({ children }: OnboardingCheckProps) {
  const { isComplete, currentStep } = useOnboarding();
  const { user } = useUser();
  
  // Check if user needs onboarding
  const needsOnboarding = user && !isComplete && currentStep !== 'success';
  
  // Show onboarding wizard if needed
  if (needsOnboarding) {
    return <OnboardingWizard />;
  }
  
  // Otherwise show the app content
  return <>{children}</>;
}