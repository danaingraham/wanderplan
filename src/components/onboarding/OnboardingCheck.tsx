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
  
  // Check if user needs initial onboarding (first time user)
  const isFirstTimeUser = user && !localStorage.getItem('wanderplan_onboarding_complete');
  
  // Only show wizard for first time users or if explicitly in onboarding flow
  const needsOnboarding = isFirstTimeUser && !isComplete && currentStep !== 'success';
  
  // Show onboarding wizard if needed
  if (needsOnboarding) {
    return <OnboardingWizard />;
  }
  
  // Otherwise show the app content
  return <>{children}</>;
}