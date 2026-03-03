import React, { useState, useEffect } from "react";
import "../styles/homepage.css";

export default function AddCourseModal({
  isOpen,
  onClose,
  onCreate,
  userId,
}) {
  const TERM_OPTIONS = ["Fall", "Winter", "Spring"];

  const [formValues, setFormValues] = useState({
    code: "",
    name: "",
    term: TERM_OPTIONS[0],
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        code: "",
        name: "",
        term: TERM_OPTIONS[0],
        year: new Date().getFullYear(),
        start_date: "",
        end_date: "",
      });
      setError("");
      setCreating(false);
    }
  }, [isOpen]);

  const getTermDates = (term, year) => {
    if (term === "Fall")
      return { start_date: `${year}-09-01`, end_date: `${year}-12-15` };
    if (term === "Winter")
      return { start_date: `${year}-01-06`, end_date: `${year}-03-14` };
    if (term === "Spring")
      return { start_date: `${year}-03-20`, end_date: `${year}-06-01` };
    return { start_date: "", end_date: "" };
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "term" || name === "year") {
        const termValue = name === "term" ? value : prev.term;
        const yearValue = name === "year" ? value : prev.year;
        const { start_date, end_date } = getTermDates(termValue, yearValue);
        updated.start_date = start_date;
        updated.end_date = end_date;
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    const anyEmpty = Object.values(formValues).some((v) => !String(v).trim());
    if (anyEmpty) {
      setError("All fields are required.");
      setCreating(false);
      return;
    }

    const payload = {
      code: formValues.code,
      name: formValues.name,
      term: formValues.term,
      year: Number(formValues.year),
      start_date: formValues.start_date,
      end_date: formValues.end_date,
      teacher: userId,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/classes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "Failed to create course");
      }
      const newCourse = await res.json();
      onCreate(newCourse);
      onClose();
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modalContainer">
        <h2 className="modalHeader">Add Course</h2>

        <form onSubmit={handleSubmit}>
          <label className="formLabel">
            <span>Course Code:</span>
            <input
              type="text"
              name="code"
              value={formValues.code}
              onChange={handleFormChange}
              className="formInput"
              required
            />
          </label>

          <label className="formLabel">
            <span>Course Name:</span>
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleFormChange}
              className="formInput"
              required
            />
          </label>

          <label className="formLabel">
            <span>Term:</span>
            <select
              name="term"
              value={formValues.term}
              onChange={handleFormChange}
              className="formInput"
              required
            >
              {TERM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="formLabel">
            <span>Year:</span>
            <input
              type="number"
              name="year"
              min="2020"
              max="2100"
              value={formValues.year}
              onChange={handleFormChange}
              className="formInput"
              required
            />
          </label>

          <label className="formLabel">
            <span>Start Date:</span>
            <input
              type="date"
              name="start_date"
              value={formValues.start_date}
              onChange={handleFormChange}
              className="formInput"
              required
            />
          </label>

          <label className="formLabel">
            <span>End Date:</span>
            <input
              type="date"
              name="end_date"
              value={formValues.end_date}
              onChange={handleFormChange}
              className="formInput"
              required
            />
          </label>

          {error && (
            <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
          )}

          <div className="modalActions">
            <button
              type="button"
              onClick={onClose}
              className="actionButton cancelButton"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="actionButton saveButton"
              disabled={creating}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
