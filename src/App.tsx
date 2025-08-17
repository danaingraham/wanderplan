import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { TripDetail } from './pages/TripDetail'
import { NewTripCreation } from './pages/NewTripCreation'
import { Explore } from './pages/Explore'
import { Guides } from './pages/Guides'
import { Community } from './pages/Community'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'
import { ApiStatus } from './pages/ApiStatus'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { AuthDebug } from './pages/AuthDebug'
import { AuthDebugSupabase } from './pages/AuthDebugSupabase'
import { AuthCallback } from './pages/AuthCallback'
import { SimpleMobileTest } from './pages/SimpleMobileTest'
import { NetworkDiagnostic } from './pages/NetworkDiagnostic'
import { DirectLoginTest } from './pages/DirectLoginTest'
import { MobileAuthTest } from './pages/MobileAuthTest'
import { UserProvider, useUser } from './contexts/UserContext'
import { TripProvider } from './contexts/TripContext'
import GuideDiscovery from './pages/GuideDiscovery'
import TripGuideView from './components/guide/TripGuideView'
import GuideEditor from './components/guide/GuideEditor'
import CreateGuideFromPaste from './pages/CreateGuideFromPaste'

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
        <Route path="/auth-debug" element={<AuthDebug />} />
        <Route path="/auth-debug-supabase" element={<AuthDebugSupabase />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/mobile-test" element={<SimpleMobileTest />} />
        <Route path="/network-test" element={<NetworkDiagnostic />} />
        <Route path="/direct-login" element={<DirectLoginTest />} />
        <Route path="/mobile-auth" element={<MobileAuthTest />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout><Explore /></Layout></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Layout><Explore /></Layout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/guides" element={<ProtectedRoute><Layout><GuideDiscovery /></Layout></ProtectedRoute>} />
        <Route path="/guides/new" element={<ProtectedRoute><Layout><CreateGuideFromPaste /></Layout></ProtectedRoute>} />
        <Route path="/guides/:guideId" element={<ProtectedRoute><Layout><TripGuideView /></Layout></ProtectedRoute>} />
        <Route path="/guides/:guideId/edit" element={<ProtectedRoute><Layout><GuideEditor /></Layout></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Layout><Community /></Layout></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Layout><NewTripCreation /></Layout></ProtectedRoute>} />
        <Route path="/create/trip" element={<ProtectedRoute><Layout><NewTripCreation /></Layout></ProtectedRoute>} />
        <Route path="/create/guide" element={<ProtectedRoute><Layout><CreateGuideFromPaste /></Layout></ProtectedRoute>} />
        <Route path="/trip/:id" element={<ProtectedRoute><Layout><TripDetail /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/api-status" element={<ProtectedRoute><Layout><ApiStatus /></Layout></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <UserProvider>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </UserProvider>
  )
}

export default App
