
import './App.css'
import MainScreen from './MainScreen.tsx'
import HomeScreen from './HomeScreen.tsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path = "/" element = {<HomeScreen />} />
        <Route path = "/main" element = {<MainScreen />} />
      </Routes>
    </Router>
  )
}

export default App
