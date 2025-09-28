import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";


function App() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-indigo-600">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="*"
            element={
              <div className="text-center mt-20 text-white text-2xl">
                Page Not Found
              </div>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
