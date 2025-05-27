import React, { useState } from "react";
import AssignmentPage from "./AssignmentPage";
import EditAssignments from "./EditAssignments";
import { useNavigate } from "react-router-dom";
import styles from "../styles/CoursePage.module.css";

export default function CoursePage({
  currentCourse,  // { id, name, assignments: [ { id, title, dueDate, dueTime, /* … optionally status, releasedAt */ }, … ] }
  role,           // "student" vs "teacher"
  user,           // the logged‑in user
  updateCourse,   // teacher-only
}) {
  const navigate = useNavigate();
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [draftCourseName, setDraftCourseName] = useState(currentCourse.name);
  const [draftCourseTerm, setDraftCourseTerm] = useState(currentCourse.term);
  const [draftAssignment, setDraftAssignment] = useState(currentAssignment);
  const handleSelectAssignment = (assignment) => {
    setCurrentAssignment(assignment);
    navigate(`/_test/course/${assignment.id}`);
    setEditingAssignmentId(null);
  };

  const handleSaveCourse = () => {
    updateCourse({ ...currentCourse, name: draftCourseName, term: draftCourseTerm });
    setIsEditingCourse(false);
  };
  const handleSaveAssignment = (id) => {
    const updatedAssignments = currentCourse.assignments.map(a =>
    a.id === id
      ? { ...a, ...draftAssignment }
      : a
  );
    updateCourse({...currentCourse, assignments: updatedAssignments})
    setEditingAssignmentId(null);
  }

  return (
    <div className={styles.coursePageWrapper}>
      <header className={styles.coursePageHeader}>
        <div className={styles.courseInfoContainer}>
          {isEditingCourse ? (
            <div className={styles.editingFieldsCont}>
              <input
                type="text"
                value={draftCourseName}
                onChange={(e) => setDraftCourseName(e.target.value)}
                className={`${styles.inputItem} ${styles.courseNameInput}`}
              />
              <h1 className={styles.courseTitleDelimiter}>|</h1>
              <input
                type="text"
                value={draftCourseTerm}
                onChange={(e) => setDraftCourseTerm(e.target.value)}
                className={`${styles.inputItem} ${styles.termInput}`}
              />
              <button
                onClick={handleSaveCourse}
                aria-label="Save"
                className={styles.iconCont}
              >
                ✔️
              </button>
              <button
                onClick={() => {
                  setIsEditingCourse(false);
                  setDraftCourseName(currentCourse.name);
                }}
                aria-label="Cancel"
                className={styles.iconCont}
              >
                ✖️
              </button>
            </div>
          ) : (
            <>
              <h1>{currentCourse.name}</h1>
              <h1 className={styles.courseTitleDelimiter}>|</h1>
              <p className={styles.courseTerm}>
                {currentCourse.term}
              </p>
              {role === "teacher" && (
                <button
                  onClick={() => setIsEditingCourse(true)}
                  aria-label="Edit Course"
                  className={styles.iconCont}
                >
                  ✏️
                </button>
              )}
            </>
          )}
        </div>
        <div className={styles.userInfoContainer}>
          <h1>{user.name}</h1>
        </div>
      </header>

      <section className={styles.assignmentsSection}>
        <h2>Assignments</h2>

        <table className={styles.assignmentsTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Released</th>
              <th>Due (EDT)</th>
              {role === "teacher" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentCourse.assignments.map(a => {
                const isEditing = editingAssignmentId === a.id;

                if (isEditing) {
                  return (
                    <tr key={a.id}>
                      <td className={styles.tableAssignmentTitleItem}>
                        <input
                          type="text"
                          value={draftAssignment.title}
                          onChange={e =>
                            setDraftAssignment({...draftAssignment, title: e.target.value})
                          }
                        />
                      </td>

                      <td>{a.status || "–"}</td>

                      <td>{a.releasedAt || "–"}</td>

                      <td className={styles.tableTimeItem}>
                        <input
                          type="datetime-local"
                          value={`${draftAssignment.dueDate}T${draftAssignment.dueTime}`}
                          onChange={e => {
                            const [date, time] = e.target.value.split("T");
                            setDraftAssignment({
                              ...draftAssignment,
                              dueDate: date,
                              dueTime: time,
                            });
                          }}
                        />
                      </td>

                      {role === "teacher" && (
                        <td className={styles.tableActionsItem}>
                          <button onClick={() => handleSaveAssignment(a.id)} className={styles.iconCont}>✔️</button>
                          <button onClick={() => setEditingAssignmentId(null)} className={styles.iconCont}>✖️</button>
                        </td>
                      )}
                    </tr>
                  );
                }
                return (
                  <tr key={a.id}>
                    <td>
                      <button
                        onClick={() => handleSelectAssignment(a)}
                        className={styles.assignmentLinkBtn}
                      >
                        {a.title}
                      </button>
                    </td>
                    <td>{a.status || "–"}</td>
                    <td>{a.releasedAt || "–"}</td>
                    <td>
                      {a.dueDate}, {a.dueTime}
                    </td>
                    {role === "teacher" && (
                      <td>
                        <button
                          onClick={() => {
                            setEditingAssignmentId(a.id);
                            setDraftAssignment(a);
                          }}
                          className={styles.iconCont}
                        >
                          ✏️
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>

      {currentAssignment && role === "student" && (
        <AssignmentPage
          assignment={currentAssignment}
        />
      )}

      {currentAssignment && role === "teacher" && editingAssignmentId && (
        <EditAssignments
          currentAssignment={currentAssignment}
          setEditingAssignmentId={setEditingAssignmentId}
        />
      )}
    </div>
  );
}
