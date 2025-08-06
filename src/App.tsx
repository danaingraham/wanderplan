import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { TripDetail } from './pages/TripDetail'
import { TripCreation } from './pages/TripCreation'
import { Explore } from './pages/Explore'
import { Profile } from './pages/Profile'
import { ApiStatus } from './pages/ApiStatus'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { UserProvider } from './contexts/UserContext'
import { TripProvider } from './contexts/TripContext'

function App() {
  return (
    <UserProvider>
      <TripProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Layout><Explore /></Layout></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><Layout><TripCreation /></Layout></ProtectedRoute>} />
            <Route path="/trip/:id" element={<ProtectedRoute><Layout><TripDetail /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/api-status" element={<ProtectedRoute><Layout><ApiStatus /></Layout></ProtectedRoute>} />
          </Routes>
        </Router>
      </TripProvider>
    </UserProvider>
  )
}

export default App
