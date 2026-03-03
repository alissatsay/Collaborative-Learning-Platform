import React, { useState, useEffect } from "react";
import "../styles/homepage.css";
import { useNavigate } from "react-router-dom";
import AddCourseModal from "./AddCourseModal";

const TERM_OPTIONS = ["Fall", "Winter", "Spring"];
const API_BASE = "http://127.0.0.1:8000/api/classes/";

const getInviteExpiryDate = () => {
  const now = new Date();
  now.setDate(now.getDate() + 14);
  return now.toISOString();
};

function HomePage({ role, user, courses, setCourses, setCurrentCourse }) {
  const roleStr = role ? "teacher" : "student";

  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    term: TERM_OPTIONS[0],
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const url = roleStr === "teacher"
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

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setCreating(true);
    setInviteLink("");
    setError(null);

    const { code, name, term, year, start_date, end_date } = form;

    const payload = {
      code,
      name,
      term,
      year: Number(year),
      start_date,
      end_date,
      teacher: user.id,
    };

    try {
      console.log("POST /classes payload →", payload);

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error("Create course failed:", res.status, detail);
        throw new Error(detail || "Failed to create course");
      }

      const newCourse  = await res.json();
      console.log("POST success →", newCourse);

      setCourses((prev) => [...prev, newCourse]); 

      const inviteCode = newCourse.invite_code || newCourse.id;
      const expiry = getInviteExpiryDate();
      const link = `${window.location.origin}/invite/${inviteCode}?expires=${encodeURIComponent(expiry)}`;

      setInviteLink(link);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const getFirstLastName = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name;
  };

  return (
    <div className="homepage-root">
      <div className="homepage-user-info">
        <h2>Welcome, {getFirstLastName(user.name)}</h2>
        <div className="homepage-user-details">
          <span>
            Role: {roleStr.charAt(0).toUpperCase() + roleStr.slice(1)}
          </span>
        </div>
      </div>

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

      <AddCourseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreate={(newCourse) => {
            setCourses((prev) => [...prev, newCourse]);
            setInviteLink(
              `${window.location.origin}/invite/${
                newCourse.invite_code || newCourse.id
              }?expires=${encodeURIComponent(getInviteExpiryDate())}`
            );
          }}
          userId={user.id}
        />
    </div>
  );
}

export default HomePage;