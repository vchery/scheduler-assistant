import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Register from './pages/Register'; //Register component
import Login from './pages/Login'; //Login component
import Home from './pages/Home';
import Manager from "./pages/Manager.jsx";
import './App.css';

function App() {
  return (
    <Router>
       {/*Define all routes */}
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/manager" element={<Manager />} />
        </Routes>
    </Router>
  );
}

export default App;
