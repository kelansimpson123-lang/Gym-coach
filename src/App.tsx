import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import Exercises from './pages/Exercises'
import EditApp from './pages/EditApp'

export default function App() {
  return (
    <div className="bg-surface-0">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/edit-app" element={<EditApp />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
