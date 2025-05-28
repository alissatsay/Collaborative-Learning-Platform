import React from "react";

export default function EditAssignments({
  currentAssignment,
  setCurrentlyEditingAssignment,
}) {
  return (
    <div style={{ padding: 20, border: "1px solid #f66" }}>
      <h2>EditAssignments Placeholder</h2>
      <p>No implementation yet.</p>
      <pre>{JSON.stringify(currentAssignment, null, 2)}</pre>
      <button onClick={() => setCurrentlyEditingAssignment(false)}>
        Close
      </button>
    </div>
  );
}