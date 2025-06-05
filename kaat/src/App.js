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
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [user, setUser] = useState({"id": 16,"name": "Kairat","email": "sadyrbek@union.edu","is_teacher": false});
    let endpoint;
    if (user.is_teacher === true) {
        endpoint = 'teacher';
    } 
    else {
        endpoint = 'student';
    }
    useEffect(() => {
        if (user?.id) {
            axios
                .get(`http://127.0.0.1:8000/api/classes/?${endpoint}=${user.id}`)
                .then(res => setCourses(res.data))
                .catch(err => console.error(err))
        }
    }, [user])
    const updateCourse = (updatedCourse) => {
    // Replace the old course object in `courses`
    setCourses(prev => 
      prev.map(c => (c.id === updatedCourse.id ? updatedCourse : c))
    );

    // If the updatedCourse is currently “open” in CoursePage, update that too:
    setCurrentCourse(updatedCourse);
  };
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
                <HomePage
                role={user.is_teacher}
                user={user}
                courses={courses}
                setCurrentCourse={setCurrentCourse}
                />
            }
            />
            <Route
            path="/home/_test/course/:courseId"
            element={
                <CoursePage
                    currentCourse={currentCourse}
                    setCurrentCourse={setCurrentCourse}
                    currentAssignment={currentAssignment}
                    setCurrentAssignment={setCurrentAssignment}
                    role={user.is_teacher}
                    user={user}
                    updateCourse={updateCourse}
                />
            }
            />

            <Route
            path="/_test/course/:courseId/:assignmentId"
            element={
                    <AssignmentPage 
                        role={user.is_teacher}
                        user={user}
                />
                }
            />
        </Routes>
        </BrowserRouter>
    );
}