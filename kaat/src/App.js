import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CoursePage from "./components/CoursePage";
import AssignmentPage from "./components/AssignmentPage";
import HomePage from "./components/HomePage";
import AuthProvider from "./components/AuthProvider";
import { useState } from 'react';

export default function App() {
    const coursesProp = [
      { 
        id: 'csc103', 
        name: 'CSC 103', 
        term: 'Fall 2025',
        teacherId: 1, 
        students: [2, 3],
        assignments: [
            { id: "a1", title: "Test Assignment 1", dueDate: "2025-05-28", dueTime: "23:59" },
            { id: "a2", title: "Test Assignment 2", dueDate: "2025-05-28", dueTime: "23:59" },
        ],
      },
      {
            id: 'csc106', 
            name: 'CSC 106',
            term: 'Spring 2024',
            teacherId: 1, 
            students: [2],
            assignments: [
                { id: "a1", title: "Test Assignment 1", dueDate: "2025-05-28", dueTime: "23:59" },
                { id: "a2", title: "Test Assignment 2", dueDate: "2025-05-28", dueTime: "23:59" },
            ],
        },
      { 
            id: 'csc105', 
            name: 'CSC 105', 
            term: 'Spring 2025',
            teacherId: 2,
            students: [1, 3],
            assignments: [
                { id: "a1", title: "Test Assignment 1", dueDate: "2025-05-28", dueTime: "23:59" },
                { id: "a2", title: "Test Assignment 2", dueDate: "2025-05-28", dueTime: "23:59" },
            ],
        },
      { 
            id: 'csc108', 
            name: 'CSC 108', 
            term: 'Winter 2026',
            teacherId: 1, 
            students: [3],
            assignments: [
                { id: "a1", title: "Test Assignment 1", dueDate: "2025-05-28", dueTime: "23:59" },
                { id: "a2", title: "Test Assignment 2", dueDate: "2025-05-28", dueTime: "23:59" },
            ],
        },
    ];
    const [fakeCourse, setFakeCourse] = useState(null);
    const [currentCourse, setCurrentCourse] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
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
                role="teacher"
                user={{name: "Kairat Sadyrbekov", id: 1}}
                coursesProp={coursesProp}
                setCurrentCourse={setCurrentCourse}
                />
            }
            />
            <Route
            path="/_test/course/:courseId"
            element={
                <CoursePage
                    currentCourse={currentCourse}
                    role="teacher"
                    user={{name: "Kairat Sadyrbekov", id: 1}}
                    updateCourse={setFakeCourse}
                />
            }
            />

            <Route
            path="/_test/course/:courseId/:assignmentId"
            element={<AssignmentPage />}
            />
        </Routes>
        </BrowserRouter>
    );
}