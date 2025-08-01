import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { TripDetail } from './pages/TripDetail'
import { TripCreation } from './pages/TripCreation'
import { Explore } from './pages/Explore'
import { Profile } from './pages/Profile'
import { UserProvider } from './contexts/UserContext'
import { TripProvider } from './contexts/TripContext'

function App() {
  return (
    <UserProvider>
      <TripProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/create" element={<TripCreation />} />
              <Route path="/trip/:id" element={<TripDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Layout>
        </Router>
      </TripProvider>
    </UserProvider>
  )
}

export default App
