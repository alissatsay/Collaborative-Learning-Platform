import React from "react";

export default function AssignmentPage({
  assignment,
  onSubmit,
}) {
  return (
    <div style={{ padding: 20, border: "1px solid #ccc" }}>
      <h2>AssignmentPage Placeholder</h2>
      <p>No implementation yet.</p>
      <pre>{JSON.stringify(assignment, null, 2)}</pre>
      <button onClick={() => onSubmit && onSubmit({})}>
        Mock Submit
      </button>
    </div>
  );
}