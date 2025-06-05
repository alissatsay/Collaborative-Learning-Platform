
import React, { useState, useEffect } from "react";
import "../styles/homepage.css";
import { useNavigate } from "react-router-dom";

const TERM_OPTIONS = ["Fall", "Winter", "Spring"];
const API_BASE = "http://127.0.0.1:8000/api/classes/";

const getInviteExpiryDate = () => {
  const now = new Date();
  now.setDate(now.getDate() + 14);          // 2 weeks
  return now.toISOString();
};

function HomePage({ role, user, courses, setCourses, setCurrentCourse }) {
  /* ───── normalize role once ───── */
  const roleStr = role ? "teacher" : "student";

  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [inviteLink, setInviteLink]     = useState("");
  const [creating, setCreating]         = useState(false);

  /* include `code` in the form */
  const [form, setForm] = useState({
    code: "",                         // NEW
    name: "",
    term: TERM_OPTIONS[0],
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  });

  const navigate = useNavigate();

  /* ───── fetch courses on mount / when user changes ───── */
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const url =
      roleStr === "teacher"
        ? `${API_BASE}?teacher=${user.id}`
        : `${API_BASE}?student=${user.id}`;

    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch courses");
        return res.json();
      })
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [roleStr, user.id, setCourses]);

  const handleSelectCourse = (course) => {
    setCurrentCourse(course);
    navigate(`/home/_test/course/${course.id}`);
  };

  /* helper to derive term dates (unchanged) */
  const getTermDates = (term, year) => {
    if (term === "Fall")   return { start_date: `${year}-09-01`, end_date: `${year}-12-15` };
    if (term === "Winter") return { start_date: `${year}-01-06`, end_date: `${year}-03-14` };
    if (term === "Spring") return { start_date: `${year}-03-20`, end_date: `${year}-06-01` };
    return { start_date: "", end_date: "" };
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "term" || name === "year") {
        const { start_date, end_date } = getTermDates(
          name === "term" ? value : prev.term,
          name === "year" ? value : prev.year
        );
        updated.start_date = start_date;
        updated.end_date   = end_date;
      }
      return updated;
    });
  };

  /* ───── create course ───── */
  const handleAddCourse = async (e) => {
    e.preventDefault();
    setCreating(true);
    setInviteLink("");
    setError(null);

    const { code, name, term, year, start_date, end_date } = form;

    const payload = {
      code,                               // NEW
      name,
      term,
      year: Number(year),
      start_date,
      end_date,
      teacher: user.id,                   // adjust if backend expects teacher_id
    };

    try {
      console.log("POST /classes payload →", payload);

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",          // keep cookies / session
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error("Create course failed:", res.status, detail);
        throw new Error(detail || "Failed to create course");
      }

      const newCourse  = await res.json();
      console.log("POST success →", newCourse);

      setCourses((prev) => [...prev, newCourse]); // optimistic add

      /* generate invite link */
      const inviteCode = newCourse.invite_code || newCourse.id;
      const expiry     = getInviteExpiryDate();
      const link       = `${window.location.origin}/invite/${inviteCode}?expires=${encodeURIComponent(expiry)}`;

      setInviteLink(link);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = () => navigator.clipboard.writeText(inviteLink);

  const getFirstLastName = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name;
  };

  /* ───── UI ───── */
  return (
    <div className="homepage-root">
      {/* user info */}
      <div className="homepage-user-info">
        <h2>Welcome, {getFirstLastName(user.name)}</h2>
        <div className="homepage-user-details">
          <span>
            Role: {roleStr.charAt(0).toUpperCase() + roleStr.slice(1)}
          </span>
        </div>
      </div>

      {/* header row */}
      <div className="homepage-header-row">
        <h2 className="homepage-courses-title">Your Courses</h2>
        {roleStr === "teacher" && (
          <button
            className="homepage-add-btn"
            onClick={() => setShowAddModal(true)}
            aria-label="Add Course"
          >
            +
          </button>
        )}
      </div>

      {/* courses list */}
      <div className="homepage-courses-list">
        {loading ? (
          <p>Loading courses…</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : courses.length === 0 ? (
          <p>No courses found.</p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="homepage-course-card"
              onClick={() => handleSelectCourse(course)}
            >
              <h3 className="homepage-course-name">{course.name}</h3>
              <p className="homepage-course-date">
                Term: {course.term} {course.year}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ───── Add-Course Modal ───── */}
      {showAddModal && (
        <div className="homepage-modal-overlay">
          <div className="homepage-modal">
            <h2 className="homepage-modal-title">Add Course</h2>
            <form onSubmit={handleAddCourse} className="homepage-modal-form">
              <label>
                Course Code
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                Course Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                Term
                <select
                  name="term"
                  value={form.term}
                  onChange={handleFormChange}
                  required
                >
                  {TERM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Year
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  min="2020"
                  max="2100"
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                Start Date
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <button
                type="submit"
                className="homepage-modal-submit"
                disabled={creating}
              >
                {creating ? "Creating…" : "Create Course"}
              </button>
              {error && <p style={{ color: "red" }}>{error}</p>}
            </form>

            {inviteLink && (
              <div className="homepage-invite-link">
                <p>Invite Link (expires in 2 weeks):</p>
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  style={{ width: "100%" }}
                />
                <button
                  onClick={handleCopyLink}
                  className="homepage-modal-close"
                >
                  Copy Link
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowAddModal(false);
                setInviteLink("");
                setForm({
                  code: "",
                  name: "",
                  term: TERM_OPTIONS[0],
                  year: new Date().getFullYear(),
                  start_date: "",
                  end_date: "",
                });
              }}
              className="homepage-modal-close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;



