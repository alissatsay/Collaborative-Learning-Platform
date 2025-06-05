// src/components/AssignmentPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentSidebar from "./StudentSidebar";
import "../styles/AssignmentPage.css";

export default function AssignmentPage({ user, role }) {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState("");
  const [lineNumbers, setLineNumbers] = useState("");
  const [selectedOffsets, setSelectedOffsets] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [highlights, setHighlights] = useState([]); // ← keep track of all highlight ranges

  const codeContainerRef = useRef(null);

  // ── Utility to escape HTML before injecting via dangerouslySetInnerHTML ──
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ── Walk text nodes under `root` until callback(node) returns true ──
  function walkTextNodes(root, callback) {
    let walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (callback(node) === true) {
        break;
      }
    }
  }

  // ── Given our `codeContainerRef`, find the absolute start/end indices of the user's selection ──
  function getSelectionOffsets() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);

    let cumulative = 0;
    let startIndex = -1,
      endIndex = -1;

    // Find startIndex
    walkTextNodes(codeContainerRef.current, (textNode) => {
      if (textNode === range.startContainer) {
        startIndex = cumulative + range.startOffset;
        return true;
      } else {
        cumulative += textNode.textContent.length;
      }
      return false;
    });

    // Find endIndex (another full walk)
    cumulative = 0;
    walkTextNodes(codeContainerRef.current, (textNode) => {
      if (textNode === range.endContainer) {
        endIndex = cumulative + range.endOffset;
        return true;
      } else {
        cumulative += textNode.textContent.length;
      }
      return false;
    });

    if (startIndex >= 0 && endIndex >= 0 && endIndex > startIndex) {
      return { start: startIndex, end: endIndex };
    }
    return null;
  }

  // ── When user releases the mouse, see if they highlighted something ──
  const handleMouseUp = () => {
    const offsets = getSelectionOffsets();
    if (!offsets) {
      setShowCommentInput(false);
      return;
    }
    const { start, end } = offsets;
    const selText = fileContent.slice(start, end);
    if (!selText) {
      setShowCommentInput(false);
      return;
    }

    setSelectedText(selText);
    setSelectedOffsets({ start, end });

    // Compute line numbers (optional UI)
    const before = fileContent.slice(0, start);
    const startLine = before.split("\n").length;
    const linesSelected = selText.split("\n").length;
    const lineLabel =
      linesSelected === 1
        ? `Line ${startLine}`
        : `Lines ${startLine}-${startLine + linesSelected - 1}`;
    setLineNumbers(lineLabel);

    setShowCommentInput(true);
  };

  // ── File‐picker handler: read the file as text ──
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target.result);
      // Clear any old highlights/comments if you want:
      // setHighlights([]);
      // setComments([]);
    };
    reader.readAsText(f);
  };

  // ── Submit (or update) the file to your backend ──
  const handleSubmitFile = async () => {
    try {
      let subId = submission?.id;
      if (!subId) {
        // create a new AssignmentSubmission first
        const respSub = await axios.post(`http://127.0.0.1:8000/api/submit/`, {
          assignment: Number(assignmentId),
          user: user.id,
        });
        subId = respSub.data.id;
        setSubmission(respSub.data);
      }

      // now upload the file contents
      const respFile = await axios.post(`http://127.0.0.1:8000/api/addfile/`, {
        name: fileName,
        submission: subId,
        content: fileContent,
      });
      setSubmissionFile(respFile.data);

      // re‐fetch comments (the backend typically returns them inside the SubmissionSerializer)
      const updated = await axios.get(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?student=${user.id}`
      );
      if (Array.isArray(updated.data) && updated.data.length > 0) {
        setSubmission(updated.data[0]);
        setComments(updated.data[0].comments || []);
      }

      alert("File uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    }
  };

  // ── When the user clicks “Add Comment” ──
  const handleAddComment = async () => {
    if (!commentText.trim() || !submissionFile || !selectedOffsets) return;
    try {
      const resp = await axios.post(`http://127.0.0.1:8000/api/addcomment/`, {
        submission: submission.id,
        submission_file: submissionFile.id,
        line_number: Number(lineNumbers.replace(/^Lines? (\d+).*/, "$1")) || 1,
        user: user.id,
        comment: commentText.trim(),
      });

      // 1) Add the fresh comment into `comments`
      setComments((prev) => [
        ...prev,
        {
          id: resp.data.id,
          user: { id: user.id, name: user.name },
          comment: resp.data.comment,
          line_number: resp.data.line_number,
          submission_file: resp.data.submission_file,
        },
      ]);

      // 2) Also store the highlight range in `highlights`
      setHighlights((prev) => [
        ...prev,
        {
          start: selectedOffsets.start,
          end: selectedOffsets.end,
          commentId: resp.data.id,
        },
      ]);

      // clear selection state
      setCommentText("");
      setSelectedText("");
      setSelectedOffsets(null);
      setShowCommentInput(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add comment");
    }
  };

  // ── When the user deletes a comment from the right‐hand panel ──
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/comments/${commentId}/`);
      // remove it from the comments array
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      // also remove its highlight from `highlights`
      setHighlights((prev) => prev.filter((h) => h.commentId !== commentId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete comment");
    }
  };

  // ── Build a single HTML string with <mark> tags around each highlight range ──
  function getHighlightedHTML() {
    if (!fileContent) return "";

    // 1) Sort by start so tags nest in order
    const sorted = [...highlights].sort((a, b) => a.start - b.start);
    let lastIndex = 0;
    const pieces = [];

    sorted.forEach(({ start, end }) => {
      if (lastIndex < start) {
        pieces.push(escapeHTML(fileContent.slice(lastIndex, start)));
      }
      pieces.push(
        `<mark class="code-highlight">${escapeHTML(
          fileContent.slice(start, end)
        )}</mark>`
      );
      lastIndex = end;
    });
    if (lastIndex < fileContent.length) {
      pieces.push(escapeHTML(fileContent.slice(lastIndex)));
    }

    // 2) Now insert line numbers by splitting on '\n'
    const joined = pieces.join("");
    const withLineNumbers = joined
      .split("\n")
      .map((lineText, idx) => {
        // idx to lineNumber = idx+1
        return `<span class="line-number">${idx + 1}</span> ${lineText ||
          "&nbsp;"}\n`;
      })
      .join("");

    return `<pre class="code-block">${withLineNumbers}</pre>`;
  }

  // ── On mount: fetch assignment + existing submission + comments ──
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/assignments/${assignmentId}/`)
      .then((r) => setAssignment(r.data))
      .catch(console.error);

    axios
      .get(
        `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?student=${user.id}`
      )
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          const sub = r.data[0];
          setSubmission(sub);
          if (sub.files && sub.files.length > 0) {
            setSubmissionFile(sub.files[0]);
            setFileContent(sub.files[0].content);
            // pre-populate existing comments and their highlights
            setComments(sub.comments || []);
            // If you want highlights from existing comments, you would have needed
            // to store each comment’s (start,end) somewhere. For simplicity, only new ones show.
          }
        }
      })
      .catch(console.error);

    // Fetch groups etc. if you need StudentSidebar to populate.
  }, [assignmentId, user.id]);

  return (
    <div className="assignment-page-container">
      <div className="assignment-page-header">
        <button
          className="back-button"
          onClick={() => navigate(`/home/_test/course/${courseId}`)}
        >
          ← Back to Course
        </button>
        <h2>{assignment ? assignment.name : "Loading…"}</h2>
      </div>

      <div className="assignment-page-body">
        {/* ─── LEFT PANEL ─── */}
        <div className="left-panel">
          <div className="file-upload-section">
            <input type="file" onChange={handleFileChange} />
            {fileName && <p>Selected: <b>{fileName}</b></p>}
            <button
              onClick={handleSubmitFile}
              disabled={!fileContent}
              className="submit-file-button"
            >
              Upload / Submit File
            </button>
          </div>

          {fileContent && (
            <div
              className="code-preview-container"
              onMouseUp={handleMouseUp}
              ref={codeContainerRef}
            >
              {/* Instead of manually mapping lines here, we render a single <div> whose innerHTML is getHighlightedHTML() */}
              <div
                dangerouslySetInnerHTML={{ __html: getHighlightedHTML() }}
              />
            </div>
          )}

          {showCommentInput && (
            <div className="comment-input-container">
              <p>
                <b>Comment on:</b> <em>{lineNumbers}</em>
              </p>
              <div className="highlighted-text-preview">
                <pre>{selectedText}</pre>
              </div>
              <textarea
                rows={3}
                placeholder="Type your comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                onClick={handleAddComment}
                className="add-comment-button"
              >
                Add Comment
              </button>
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="right-panel">
          <StudentSidebar
            assignmentId={assignmentId}
            // … any props you already had
          />

          <div className="comments-list-container">
            <h4>Comments</h4>
            {comments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              <ul className="comments-list">
                {comments
                  .slice()
                  .sort((a, b) => a.line_number - b.line_number)
                  .map((c) => (
                    <li key={c.id} className="comment-item">
                      <div className="comment-header">
                        <strong>{c.user.name}</strong> @ Line{" "}
                        {c.line_number}
                      </div>
                      <div className="comment-body">{c.comment}</div>
                      <button
                        className="delete-comment-button"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        🗑
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
