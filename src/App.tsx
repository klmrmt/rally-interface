
import { Box } from '@mui/material'
import './App.css'
import HomeScreen from './HomeScreen/HomeScreen.tsx'
import JoinScreen from './GroupJoinerScreen/JoinScreen.tsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MoneySlider from './GroupJoinerScreen/moneyslider.tsx'

export default function App() {
  return (

    <div>


    <Router>
      <Routes>
        <Route path = "/" element = {<HomeScreen />} />
        <Route path = "/join" element = {<JoinScreen />} />
      </Routes>
    </Router>



    </div>
  )
}

