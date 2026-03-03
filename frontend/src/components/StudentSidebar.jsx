import { useEffect, useState } from "react";
import "../styles/StudentSidebar.css";

export default function StudentSidebar({
  assignmentId,
  setCurrentStudent,
  currentUser,
  role,
  selectedStudentId,
  setSelStudent,
}) {
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroupId, setSelGroup]   = useState(null);

  const pickStudents = (payload = {}) => {
    if (Array.isArray(payload)) return payload;
    if (payload.results)  return payload.results;
    if (payload.students) return payload.students;
    if (payload.users) return payload.users;
    if (payload.members) return payload.members;
    return [];
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const gRes = await fetch(
          `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/`
        );
        if (!gRes.ok) throw new Error("Could not load groups");

        let raw = await gRes.json();
        raw = Array.isArray(raw) ? raw : raw.results || [];
        raw.sort((a, b) => a.id - b.id);

        const groupsWithStudents = await Promise.all(
          raw.map(async (grp) => {
            const initial = pickStudents(grp);
            if (initial.length) return { ...grp, students: initial };

            const sRes = await fetch(
              `http://127.0.0.1:8000/api/groups/${grp.id}/`
            );
            if (!sRes.ok)
              throw new Error(`Could not load students for group ${grp.id}`);

            const payload  = await sRes.json();
            const students = pickStudents(payload);
            return { ...grp, students };
          })
        );

        if (active) setGroups(groupsWithStudents);
      } catch (err) {
        if (active) setError(err.message || "Unexpected error");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => (active = false);
  }, [assignmentId]);

  const groupsToRender = role
    ? groups
    : groups.filter((g) =>
        g.students.some((s) => s.id === currentUser.id)
      );

  if (loading) return <aside className="sidebar">Loading…</aside>;
  if (error)   return <aside className="sidebar error">{error}</aside>;
  if (groupsToRender.length === 0)
    return <aside className="sidebar">No groups found.</aside>;

  return (
    <aside className="sidebar">
      {groupsToRender.map((group, idx) => {
        const groupSelected = selectedGroupId === group.id;

        return (
          <section
            key={group.id}
            className={`group ${groupSelected ? "selected" : ""}`}
          >
            <h3 className="group-title">Group {idx + 1}</h3>

            {group.students.length === 0 && (
              <p className="no-students">No students</p>
            )}

            <ul className="student-list">
              {group.students.map((student) => {
                const studentSelected = selectedStudentId === student.id;

                return (
                  <li
                    key={student.id}
                    className={`student-item ${
                      studentSelected ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelStudent(student.id);
                      setSelGroup(group.id);
                      setCurrentStudent(student);
                    }}
                  >
                    <span className="avatar">
                      {student.name?.[0]?.toUpperCase() || "?"}
                    </span>
                    <span className="student-name">{student.name}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </aside>
  );
}
