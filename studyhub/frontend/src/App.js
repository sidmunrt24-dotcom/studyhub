// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Notes from './pages/Notes';
import Courses from './pages/Courses';
import AskDoubt from './pages/AskDoubt';
import Timetable from './pages/Timetable';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/ask-doubt" element={<AskDoubt />} />
          <Route path="/timetable" element={<Timetable />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
