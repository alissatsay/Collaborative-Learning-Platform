import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CoursePage from "./components/CoursePage";
import AssignmentPage from "./components/AssignmentPage";
import HomePage from "./components/HomePage";
import AuthProvider from "./components/AuthProvider";
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function App() {
    const [courses, setCourses] = useState([]);
    const [currentCourse, setCurrentCourse] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    let endpoint;
    useEffect(() => {
        const saved = localStorage.getItem("myAppUser");
        if (saved) setUser(JSON.parse(saved));
        setAuthReady(true);
    }, []);
    useEffect(() => {
        if (!user?.id) return;
    
        endpoint = user.is_teacher ? "teacher" : "student";
        axios
          .get(`http://127.0.0.1:8000/api/classes/?${endpoint}=${user.id}`)
          .then(r => setCourses(r.data))
          .catch(console.error);
      }, [user]);
    const updateCourse = (updatedCourse) => {
    // Replace the old course object in `courses`
    setCourses(prev => 
      prev.map(c => (c.id === updatedCourse.id ? updatedCourse : c))
    );

    // If the updatedCourse is currently “open” in CoursePage, update that too:
    setCurrentCourse(updatedCourse);
  };
  if (!authReady) return null;
    return (
        <BrowserRouter>
        <Routes>
            {/* REAL ROUTES*/}

            {/* === TEST === */}
             <Route
                path="/"
                element={
                    user ? <Navigate to={"/home"} replace />
                    : <AuthProvider setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
                }
            />
            <Route
                path="/home"
                element={
                    user            // render only when we HAVE a user
                    ? (
                        <HomePage
                            role={user.is_teacher}
                            user={user}
                            courses={courses}
                            setCourses={setCourses}
                            setCurrentCourse={setCurrentCourse}
                        />
                        )
                    : <Navigate to="/" replace />   // or just null
                }
            />
            <Route
            path="/home/_test/course/:courseId"
            element={
                user
                ? (
                    <CoursePage
                        currentCourse={currentCourse}
                        setCurrentCourse={setCurrentCourse}
                        currentAssignment={currentAssignment}
                        setCurrentAssignment={setCurrentAssignment}
                        role={user.is_teacher}
                        user={user}
                        updateCourse={updateCourse}
                    />
                    )
                : <Navigate to="/" replace />
            }
            />
            <Route
            path="/_test/course/:courseId/:assignmentId"
            element={
                user
                ? <AssignmentPage currentCourse={currentCourse} setCurrentCourse={setCurrentCourse} role={user.is_teacher} user={user} />
                : <Navigate to="/" replace />
            }
            />
        </Routes>
        </BrowserRouter>
    );
}