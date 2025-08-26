import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserPreferences } from '../types/preferences';

export type OnboardingPath = 'gmail' | 'manual' | 'skip';
export type OnboardingStep = 'welcome' | 'gmail-connect' | 'scanning' | 'results' | 'gaps' | 'success';

interface OnboardingState {
  currentStep: OnboardingStep;
  selectedPath: OnboardingPath | null;
  isComplete: boolean;
  scannedData: {
    hotels: number;
    flights: number;
    restaurants: number;
    activities: number;
  };
  detectedPreferences: Partial<UserPreferences> | null;
  temporaryPreferences: Partial<UserPreferences>;
  isScanning: boolean;
  scanProgress: number;
}

interface OnboardingContextValue extends OnboardingState {
  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  selectPath: (path: OnboardingPath) => void;
  
  // Data management
  updateTemporaryPreferences: (prefs: Partial<UserPreferences>) => void;
  setDetectedPreferences: (prefs: Partial<UserPreferences>) => void;
  updateScannedData: (data: Partial<OnboardingState['scannedData']>) => void;
  
  // Scanning
  startScanning: () => void;
  stopScanning: () => void;
  updateScanProgress: (progress: number) => void;
  
  // Completion
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  startWithGmail: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'wanderplan_onboarding_complete';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'welcome',
    selectedPath: null,
    isComplete: false,
    scannedData: {
      hotels: 0,
      flights: 0,
      restaurants: 0,
      activities: 0
    },
    detectedPreferences: null,
    temporaryPreferences: {},
    isScanning: false,
    scanProgress: 0
  });

  // Check if onboarding was already completed
  useEffect(() => {
    const isCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    if (isCompleted) {
      setState(prev => ({ ...prev, isComplete: true }));
    }
  }, []);

  // Navigation functions
  const nextStep = useCallback(() => {
    setState(prev => {
      const stepOrder: OnboardingStep[] = ['welcome', 'gmail-connect', 'scanning', 'results', 'gaps', 'success'];
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      
      // Skip steps based on path
      let nextIndex = currentIndex + 1;
      if (prev.selectedPath === 'manual' && prev.currentStep === 'welcome') {
        // Skip Gmail steps for manual path
        return { ...prev, currentStep: 'gaps' };
      }
      if (prev.selectedPath === 'skip') {
        // Skip to success
        return { ...prev, currentStep: 'success', isComplete: true };
      }
      
      if (nextIndex < stepOrder.length) {
        return { ...prev, currentStep: stepOrder[nextIndex] };
      }
      return prev;
    });
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => {
      const stepOrder: OnboardingStep[] = ['welcome', 'gmail-connect', 'scanning', 'results', 'gaps', 'success'];
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      
      if (currentIndex > 0) {
        // Skip back over Gmail steps if using manual path
        if (prev.selectedPath === 'manual' && prev.currentStep === 'gaps') {
          return { ...prev, currentStep: 'welcome' };
        }
        return { ...prev, currentStep: stepOrder[currentIndex - 1] };
      }
      return prev;
    });
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const selectPath = useCallback((path: OnboardingPath) => {
    setState(prev => ({ ...prev, selectedPath: path }));
    
    // Auto-advance based on path
    if (path === 'gmail') {
      nextStep();
    } else if (path === 'manual') {
      goToStep('gaps');
    } else if (path === 'skip') {
      skipOnboarding();
    }
  }, [nextStep]);

  // Data management
  const updateTemporaryPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setState(prev => ({
      ...prev,
      temporaryPreferences: { ...prev.temporaryPreferences, ...prefs }
    }));
  }, []);

  const setDetectedPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setState(prev => ({ ...prev, detectedPreferences: prefs }));
  }, []);

  const updateScannedData = useCallback((data: Partial<OnboardingState['scannedData']>) => {
    setState(prev => ({
      ...prev,
      scannedData: { ...prev.scannedData, ...data }
    }));
  }, []);

  // Scanning
  const startScanning = useCallback(() => {
    setState(prev => ({ ...prev, isScanning: true, scanProgress: 0 }));
  }, []);

  const stopScanning = useCallback(() => {
    setState(prev => ({ ...prev, isScanning: false, scanProgress: 100 }));
  }, []);

  const updateScanProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, scanProgress: Math.min(100, Math.max(0, progress)) }));
  }, []);

  // Completion
  const completeOnboarding = useCallback(async () => {
    // Save preferences to database here
    // For now, just mark as complete
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setState(prev => ({ ...prev, isComplete: true, currentStep: 'success' }));
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'skip');
    setState(prev => ({ ...prev, isComplete: true, currentStep: 'success' }));
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setState({
      currentStep: 'welcome',
      selectedPath: null,
      isComplete: false,
      scannedData: {
        hotels: 0,
        flights: 0,
        restaurants: 0,
        activities: 0
      },
      detectedPreferences: null,
      temporaryPreferences: {},
      isScanning: false,
      scanProgress: 0
    });
  }, []);

  const startWithGmail = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setState({
      currentStep: 'gmail-connect',
      selectedPath: 'gmail',
      isComplete: false,
      scannedData: {
        hotels: 0,
        flights: 0,
        restaurants: 0,
        activities: 0
      },
      detectedPreferences: null,
      temporaryPreferences: {},
      isScanning: false,
      scanProgress: 0
    });
  }, []);

  const value: OnboardingContextValue = {
    ...state,
    nextStep,
    previousStep,
    goToStep,
    selectPath,
    updateTemporaryPreferences,
    setDetectedPreferences,
    updateScannedData,
    startScanning,
    stopScanning,
    updateScanProgress,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    startWithGmail
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}