import React from "react";
import axios from "axios";
import styles from "../styles/CoursePage.module.css";
import { useEffect, useState} from "react";

export default function AddAssignmentModal({
  isOpen,
  onClose,
  courseId,
  onCreate,        
}) {

  const [students, setStudents] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groups, setGroups] = useState([
    { userIds: [null, null, null, null] },
  ]);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    release_date: "",
    submission_deadline: "",
    commenting_deadline: "",
  });

  const toLocalValue = isoString => (isoString ? isoString.replace(/Z$/, "") : "");
  // USERS FETCHING
  useEffect(() => {
    if (isOpen && courseId) {
         setFormValues({
            name: "",
            description: "",
            release_date: "",
            submission_deadline: "",
            commenting_deadline: "",
        });
        setGroups([{ userIds: [null, null, null, null] }]);

        axios
            .get(`http://127.0.0.1:8000/api/classes/${courseId}/`)
            .then(res => {
            setStudents(res.data.students || []);
            })
            .catch(err => {
            console.error("Failed to fetch class students:", err);
            });
        }
    if (isOpen) {
        setFormValues({
            name: "",
            description: "",
            release_date: "",
            submission_deadline: "",
            commenting_deadline: "",
        });
        setSelectedUsers([]);
        }
    }, [isOpen, courseId])
  useEffect(() => {
    setFormValues({
      name: "",
      description: "",
      release_date: "",
      submission_deadline: "",
      commenting_deadline: "",
    });
  }, [isOpen, courseId]);

  const handleSave = () => {
    const anyIncomplete = groups.some((groupObj) =>
      groupObj.userIds.some((uid) => uid === null)
    );
    if (anyIncomplete) {
      alert("Cannot create an assignment without complete teams");
      return;
    }
    const PAYLOAD = {
      course: courseId,
      name: formValues.name,
      description: formValues.description,
      release_date: formValues.release_date,
      submission_deadline: formValues.submission_deadline,
      commenting_deadline: formValues.commenting_deadline,
    };
    const anyEmpty = Object.values(formValues).some(value => !value.trim());
    if (anyEmpty) {
        alert('Cannot add an empty assignment');
        return;
    }
    else {
    axios
      .post(`http://127.0.0.1:8000/api/assignments/`, PAYLOAD)
      .then(res => {
        onCreate(res.data);
        groups.forEach((groupObj) => {
          const uniqueIds = Array.from(new Set(groupObj.userIds));
          const groupPayload = {
            assignment: res.data.id,
            users: uniqueIds,
          };
          axios
            .post("http://127.0.0.1:8000/api/groups/", groupPayload)
            .then((grpRes) => {
              console.log("Created group:", grpRes.data);
            })
            .catch((err) => {
              console.error("Failed to create group:", err);
            });
        });
        onClose();
      })
      .catch(err => {
        console.error("Failed to create assignment:", err);
      });
    }
  };
 
  if (!isOpen) return null;

  const allSelectedIds = groups.flatMap((g) => g.userIds).filter((id) => id !== null);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <h3 className={styles.modalHeader}>New Assignment</h3>

        <label className={styles.formLabel}>
          <span>Name:</span>
          <input
            type="text"
            value={formValues.name}
            onChange={e =>
              setFormValues(prev => ({ ...prev, name: e.target.value }))
            }
            className={styles.formInput}
          />
        </label>

        <label className={styles.formLabel}>
          <span>Description:</span>
          <textarea
            value={formValues.description}
            onChange={e =>
              setFormValues(prev => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            className={styles.formTextarea}
          />
        </label>

        <label className={styles.formLabel}>
          <span>Release Date:</span>
          <input
            type="datetime-local"
            value={toLocalValue(formValues.release_date)}
            onChange={e =>
              setFormValues(prev => ({
                ...prev,
                release_date: e.target.value + "Z",
              }))
            }
            className={styles.formInput}
          />
        </label>

        <label className={styles.formLabel}>
          <span>Submission Deadline:</span>
          <input
            type="datetime-local"
            value={toLocalValue(formValues.submission_deadline)}
            onChange={e =>
              setFormValues(prev => ({
                ...prev,
                submission_deadline: e.target.value + "Z",
              }))
            }
            className={styles.formInput}
          />
        </label>

        <label className={styles.formLabel}>
          <span>Commenting Deadline:</span>
          <input
            type="datetime-local"
            value={toLocalValue(formValues.commenting_deadline)}
            onChange={e =>
              setFormValues(prev => ({
                ...prev,
                commenting_deadline: e.target.value + "Z",
              }))
            }
            className={styles.formInput}
          />
        </label>
       {groups.map((groupObj, groupIndex) => (
          <div
            key={groupIndex}
            style={{
              marginTop: "1rem",
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <h4 style={{ margin: 0, marginBottom: "0.5rem" }}>
              Group {groupIndex + 1}
            </h4>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {Array.from({ length: 4 }).map((_, slotIndex) => {
                const thisSlotId = groupObj.userIds[slotIndex];
                const takenByOthers = allSelectedIds.filter((id) => id !== thisSlotId);
                return (
                  <select
                    key={slotIndex}
                    value={thisSlotId || ""}
                    onChange={(e) => {
                      const chosen = e.target.value ? Number(e.target.value) : null;
                      setGroups((prev) => {
                        const updated = [...prev];
                        const newUserIds = [...updated[groupIndex].userIds];
                        newUserIds[slotIndex] = chosen;
                        updated[groupIndex] = { userIds: newUserIds };
                        return updated;
                      });
                    }}
                    className={styles.formInput}
                    style={{ flex: "1 1 45%", minWidth: "120px" }}
                  >
                    <option value="">Select student…</option>
                    {students
                      .filter((u) => !takenByOthers.includes(u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() =>
            setGroups((prev) => [...prev, { userIds: [null, null, null, null] }])
          }
          className={styles.addAssignmentButton}
          style={{ marginTop: "1rem" }}
        >
          + Add a Team
        </button>

        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={`${styles.actionButton} ${styles.cancelButton}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`${styles.actionButton} ${styles.saveButton}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}