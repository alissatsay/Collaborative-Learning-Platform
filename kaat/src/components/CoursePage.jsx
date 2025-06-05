import React, { useState, useEffect } from "react";
import AddAssignmentModal from "./AddAssignmentModal";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/CoursePage.module.css";
import axios from "axios";

export default function CoursePage({
  currentCourse,
  setCurrentCourse,
  setCurrentAssignment,
  role,
  user,
  updateCourse,
}) {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [draftCourse, setDraftCourse] = useState({
    name: currentCourse?.name || "",
    term: currentCourse?.term || "",
    year: currentCourse?.year || "",
  });
  const [draftAssignment, setDraftAssignment] = useState({});
  const [loading, setLoading] = useState(!currentCourse);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const inviteLink = `${window.location.origin}/invite/${
    currentCourse?.invite_code || currentCourse?.id
  }`;

  const [newAssignment, setNewAssignment] = useState({
    name: "",
    description: "",
    release_date: "",
    submission_deadline: "",
    commenting_deadline: "",
  });
  useEffect(() => {
    if (currentCourse) {
      setNewAssignment((prev) => ({
        ...prev,
        course: currentCourse.id,
      }));
    }
  }, [currentCourse]);

  useEffect(() => {
    if (!courseId || !user?.id) return;

    setLoading(true);
    setError(null);

    const courseResp = axios.get(
      `http://127.0.0.1:8000/api/classes/${courseId}/`
    );
    const assgnsResp = axios.get(
      `http://127.0.0.1:8000/api/assignments/?course=${courseId}`
    );

    Promise.all([courseResp, assgnsResp])
      .then(([courseRes, assignmentsRes]) => {
        setCurrentCourse(courseRes.data);
        setAssignments(assignmentsRes.data);

        const assignmentIds = assignmentsRes.data.map((a) => a.id);
        const submissionCalls = assignmentIds.map((aid) =>
          axios.get(
            `http://127.0.0.1:8000/api/assignments/${aid}/submissions/?student=${user.id}`
          )
        );
        return Promise.all(submissionCalls);
      })
      .then((submissionsArr) => {
        const subMap = {};
        submissionsArr.forEach((resp) => {
          const data = Array.isArray(resp.data) ? resp.data[0] : resp.data;
          if (data) {
            subMap[data.assignment] = data;
          }
        });
        setSubmissions(subMap);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load course data.");
        setLoading(false);
      });
  }, [courseId, user.id]);

  const handleSelectAssignment = (assignment) => {
    setCurrentAssignment(assignment);
    setEditingAssignmentId(null);
    navigate(`/_test/course/${currentCourse.id}/${assignment.id}`);
  };

  const handleSaveCourse = () => {
    const PAYLOAD = {
      name: draftCourse.name,
      term: draftCourse.term,
      year: draftCourse.year,
    };

    axios
      .patch(`http://127.0.0.1:8000/api/classes/${currentCourse.id}/`, PAYLOAD)
      .then((res) => {
        updateCourse(res.data);
        setIsEditingCourse(false);
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteAssignment = (assignmentId) => {
    axios
      .delete(`http://127.0.0.1:8000/api/assignments/${assignmentId}/`)
      .then((res) => {
        setEditingAssignmentId(null);
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
        setSubmissions((prev) => {
          const copy = { ...prev };
          delete copy[assignmentId];
          return copy;
        });
        console.log(`Deleted assignment ${res.data}`);
      })
      .catch((err) => console.error(err));
  };

  const handleSaveAssignment = (id) => {
    const PAYLOAD = {
      name: draftAssignment.name,
      release_date: draftAssignment.release_date,
      submission_deadline: draftAssignment.submission_deadline,
      commenting_deadline: draftAssignment.commenting_deadline,
    };
    axios
      .patch(`http://127.0.0.1:8000/api/assignments/${id}/`, PAYLOAD)
      .then((res) => {
        setAssignments((prev) =>
          prev.map((a) => (a.id === id ? res.data : a))
        );
        setEditingAssignmentId(null);
      })
      .catch((err) => console.error(err));
  };

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }
  if (loading || !currentCourse) {
    return <div>Loading course…</div>;
  }

  return (
    <div className={styles.coursePageWrapper}>
      <header className={styles.coursePageHeader}>
        <div className={styles.courseInfoContainer}>
          {isEditingCourse ? (
            <div className={styles.editingFieldsCont}>
              <input
                type="text"
                value={draftCourse.name}
                onChange={(e) =>
                  setDraftCourse((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className={`${styles.inputItem} ${styles.courseNameInput}`}
              />
              <h1 className={styles.courseTitleDelimiter}>|</h1>
              <select
                value={draftCourse.term}
                onChange={(e) =>
                  setDraftCourse((prev) => ({
                    ...prev,
                    term: e.target.value,
                  }))
                }
                className={`${styles.inputItem} ${styles.termInput}`}
              >
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
                <option value="Spring">Spring</option>
              </select>
              <input
                type="number"
                min={"2000"}
                max={"2040"}
                step="1"
                value={draftCourse.year}
                onChange={(e) =>
                  setDraftCourse((prev) => ({
                    ...prev,
                    year: e.target.value,
                  }))
                }
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
                  setDraftCourse(currentCourse);
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
              <p className={styles.courseTerm}>
                {currentCourse.year}
              </p>
              {role === true && (
                <>
                  <button
                    onClick={() => setIsEditingCourse(true)}
                    aria-label="Edit Course"
                    className={styles.iconCont}
                    style={{ marginRight: "0.5rem" }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    aria-label="View Invite Link"
                    className={styles.iconCont}
                  >
                    🔗
                  </button>
                </>
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
              <th>Submission Due</th>
              <th>Commenting Due</th>
              {role === true && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {assignments
              .slice()
              .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
              .map((a) => {
              const isEditing = editingAssignmentId === a.id;
              const release = new Date(
                a.release_date.replace(/Z$/, "")
              );
              const sub_due = new Date(
                a.submission_deadline.replace(/Z$/, "")
              );
              const com_due = new Date(
                a.commenting_deadline.replace(/Z$/, "")
              );
              let subAt;
              let datePartSubAt = "";
              let timePartSubAt = "";
              const datePartRel = release.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const timePartRel = release.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              const datePartSub = sub_due.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const timePartSub = sub_due.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              const datePartCom = com_due.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const timePartCom = com_due.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              if (submissions[a.id] !== undefined) {
                subAt = new Date(
                  submissions[a.id].submitted_at.replace(/Z$/, "")
                );
                datePartSubAt = subAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                timePartSubAt = subAt.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
              }
              if (isEditing) {
                return (
                  <tr key={a.id}>
                    <td className={styles.tableAssignmentTitleItem}>
                      <input
                        type="text"
                        value={draftAssignment.name}
                        onChange={(e) =>
                          setDraftAssignment({
                            ...draftAssignment,
                            name: e.target.value,
                          })
                        }
                      />
                    </td>

                    <td>
                      {submissions[a.id] !== undefined
                        ? `✔️ ${datePartSubAt}, ${timePartSubAt}`
                        : `✖️`}
                    </td>

                    <td className={styles.tableTimeItem}>
                      <input
                        type="datetime-local"
                        value={draftAssignment.release_date.replace(/Z$/, "")}
                        onChange={(e) => {
                          setDraftAssignment({
                            ...draftAssignment,
                            release_date: e.target.value,
                          });
                        }}
                      />
                    </td>
                    <td className={styles.tableTimeItem}>
                      <input
                        type="datetime-local"
                        value={draftAssignment.submission_deadline.replace(
                          /Z$/,
                          ""
                        )}
                        onChange={(e) => {
                          setDraftAssignment({
                            ...draftAssignment,
                            submission_deadline: e.target.value,
                          });
                        }}
                      />
                    </td>
                    <td className={styles.tableTimeItem}>
                      <input
                        type="datetime-local"
                        value={draftAssignment.commenting_deadline.replace(
                          /Z$/,
                          ""
                        )}
                        onChange={(e) => {
                          setDraftAssignment({
                            ...draftAssignment,
                            commenting_deadline: e.target.value,
                          });
                        }}
                      />
                    </td>

                    {role === true && (
                      <td className={styles.tableActionsItem}>
                        <button
                          onClick={() => handleSaveAssignment(a.id)}
                          className={styles.iconCont}
                        >
                          ✔️
                        </button>
                        <button
                          onClick={() => setEditingAssignmentId(null)}
                          className={styles.iconCont}
                        >
                          ✖️
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete "${a.name}"?`
                              )
                            ) {
                              handleDeleteAssignment(a.id);
                            }
                          }}
                          className={styles.iconCont}
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                );
              }
              return (
                <tr key={a.id}>
                  <td>
                    <button
                      onClick={() => {
                        handleSelectAssignment(a);
                      }}
                      className={styles.assignmentLinkBtn}
                    >
                      {a.name}
                    </button>
                  </td>
                  <td>
                    {submissions[a.id] !== undefined
                      ? `✔️ ${datePartSubAt}, ${timePartSubAt}`
                      : `✖️`}
                  </td>
                  <td>{`${datePartRel}, ${timePartRel}` || "–"}</td>
                  <td>{`${datePartSub}, ${timePartSub}`}</td>
                  <td>{`${datePartCom}, ${timePartCom}`}</td>
                  {role === true && (
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
        {role === true && (
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                cursor: "pointer",
                borderRadius: "4px",
                border: "1px solid #444",
                backgroundColor: "#f5f5f5",
              }}
            >
              + Add Assignment
            </button>
          </div>
        )}
      </section>

      <AddAssignmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        courseId={currentCourse.id}
        onCreate={(createdAssignment) => {
          setAssignments((prev) => [...prev, createdAssignment]);
        }}
      />

      {showInviteModal && (
        <div className="modalOverlay">
          <div className="modalContainer">
            <h2 className="modalHeader">Invite Link</h2>
            <p>Share this link to invite students to your course:</p>
            <input
              type="text"
              className="formInput"
              readOnly
              value={inviteLink}
              style={{ marginBottom: "1rem" }}
            />
            <div className="modalActions">
              <button
                type="button"
                className="actionButton saveButton"
                onClick={() => {
                  navigator.clipboard
                    .writeText(inviteLink)
                    .then(() => {
                    })
                    .catch((err) => {
                      console.error("Copy failed", err);
                    });
                }}
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                className="actionButton cancelButton"
                onClick={() => setShowInviteModal(false)}
                style={{ marginLeft: "0.5rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
