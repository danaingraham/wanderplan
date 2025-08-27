import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { MyTrips } from './pages/MyTrips'
import { TripDetail } from './pages/TripDetail'
import { NewTripCreation } from './pages/NewTripCreation'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'
import { ApiStatus } from './pages/ApiStatus'
import { TestDatabase } from './pages/TestDatabase'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { AuthCallback } from './pages/AuthCallback'
import { UserProvider, useUser } from './contexts/UserContext'
import { TripProvider } from './contexts/TripContext'
import { OnboardingProvider } from './contexts/OnboardingContext'

function AppContent() {
  const { isInitialized } = useUser()

  // Show loading spinner while auth state is being restored
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected routes - new structure */}
        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/trips" element={<ProtectedRoute><Layout><MyTrips /></Layout></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Layout><NewTripCreation /></Layout></ProtectedRoute>} />
        <Route path="/trip/:id" element={<ProtectedRoute><Layout><TripDetail /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/api-status" element={<ProtectedRoute><Layout><ApiStatus /></Layout></ProtectedRoute>} />
        <Route path="/test-database" element={<ProtectedRoute><Layout><TestDatabase /></Layout></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <UserProvider>
      <TripProvider>
        <OnboardingProvider>
          <AppContent />
        </OnboardingProvider>
      </TripProvider>
    </UserProvider>
  )
}

export default App
