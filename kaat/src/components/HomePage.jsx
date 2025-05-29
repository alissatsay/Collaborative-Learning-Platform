import React, { useState } from 'react';
import '../styles/homepage.css';
import { useNavigate } from "react-router-dom";

// Test data for courses


const HomePage = ({ role, user, coursesProp, setCurrentCourse }) => {
    
    const [showAddModal, setShowAddModal] = useState(false);
    const navigate = useNavigate();
    const handleSelectCourse = (course) => {
        setCurrentCourse(course);
        navigate(`/_test/course/${course.id}`);

    }
  // Filter courses based on role
  const courses = role === 'teacher'
  // WITH GOOGLEOAUTH IMPLEMENTATION, USER.ID IS WHATEVER GOOGLE RETURNS IN THE PAYLOAD, NOT teacherId = 1
    ? coursesProp.filter(course => course.teacherId === user.id)
    : coursesProp.filter(course => course.students.includes(user.id));

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
            onClick={() => {handleSelectCourse(course) }}
          >
            <h3 className="homepage-course-name">{course.name}</h3>
            <p className="homepage-course-date">Term: {course.term}</p>
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
