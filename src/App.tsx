import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomeScreen } from "./HomeScreen/HomeScreen";
import { JoinScreen } from "./JoinScreen/JoinScreen";
import "./App.css";

export const App = ()=>{
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/join" element={<JoinScreen/>} />
      </Routes>
    </Router>
  );
}
 