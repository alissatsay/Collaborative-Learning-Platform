import React, { useState } from 'react';
import '../components_styling/homepage.css';

// Test data for courses
const testCourses = [
  { id: 'csc103', name: 'CSC 103', start: '2024-01-10', end: '2024-05-10', teacherId: 1, students: [2, 3] },
  { id: 'csc106', name: 'CSC 106', start: '2024-01-10', end: '2024-05-10', teacherId: 1, students: [2] },
  { id: 'csc105', name: 'CSC 105', start: '2024-01-10', end: '2024-05-10', teacherId: 2, students: [1, 3] },
  { id: 'csc108', name: 'CSC 108', start: '2024-01-10', end: '2024-05-10', teacherId: 1, students: [3] },
];

const HomePage = ({ role, user }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter courses based on role
  const courses = role === 'teacher'
    ? testCourses.filter(course => course.teacherId === user.id)
    : testCourses.filter(course => course.students.includes(user.id));

  return (
    <div className="homepage-root">
      <h1 className="homepage-title">Welcome, {user.name}</h1>
      <div className="homepage-header-row">
        <h2 className="homepage-courses-title">Your Courses</h2>
        {role === 'teacher' && (
          <button
            className="homepage-add-btn"
            onClick={() => setShowAddModal(true)}
            aria-label="Add Course"
          >
            +
          </button>
        )}
      </div>
      <div className="homepage-courses-list">
        {courses.map(course => (
          <div
            key={course.id}
            className="homepage-course-card"
          >
            <h3 className="homepage-course-name">{course.name}</h3>
            <p className="homepage-course-date">Start: {course.start}</p>
            <p className="homepage-course-date">End: {course.end}</p>
          </div>
        ))}
      </div>
      {/* AddCourseModal will go here */}
      {showAddModal && (
        <div className="homepage-modal-overlay">
          <div className="homepage-modal">
            <h2 className="homepage-modal-title">Add Course (Coming Soon)</h2>
            <button onClick={() => setShowAddModal(false)} className="homepage-modal-close">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
