import { BrowserRouter, Routes, Route } from "react-router-dom";
import CoursePage from "./components/CoursePage";
import AssignmentPage from "./components/AssignmentPage";
import HomePage from "./components/HomePage";
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
    
    return (
        <BrowserRouter>
        <Routes>
            {/* REAL ROUTES*/}

            {/* === TEST === */}
            <Route
            path="/"
            element={
                <HomePage
                role="teacher"
                user={{ id: 1, name: "Kairat" }}
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
                    user={{ id: "u1", name: "Kairat" }}
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