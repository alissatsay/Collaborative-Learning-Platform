import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import StudentSidebar from "./StudentSidebar";
import "../styles/AssignmentPage.css";
import styles from "../styles/CoursePage.module.css";

export default function AssignmentPage({ currentCourse, setCurrentCourse, user, role }) {
  const { assignmentId } = useParams();
  const [currentStudent, setCurrentStudent] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedStudentId, setSelStudent] = useState(user.id);
  const [comments, setComments] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [selection, setSelection] = useState(null);
  const [draft, setDraft] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);
  const [allUsers, setAllUsers] = useState({});
  const codeRef = useRef(null);
  const [pageLoading, setPLoading] = useState(!currentCourse);

  const escape = (s) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const buildHTML = useCallback(() => {
    if (!fileContent) return "";
    const lines = fileContent.split("\n");
    let globalIdx = 0;
    const htmlLines = lines.map((rawLine) => {
      let lineHTML = "";
      let local = 0;
      const sliceUntil = (absIdx) =>
        highlights
          .filter((h) => h.start > absIdx)
          .reduce(
            (m, h) => Math.min(m, h.start - globalIdx),
            rawLine.length
          );
      while (local < rawLine.length) {
        const mark = highlights.find(
          (h) => h.start <= globalIdx + local && h.end > globalIdx + local
        );
        if (mark) {
          const stop = Math.min(
            rawLine.length,
            mark.end - globalIdx
          );
          const snippet = escape(rawLine.slice(local, stop));
          const attr = mark.commentId
            ? `data-comment-id="${mark.commentId}"`
            : "data-temp";
          lineHTML += `<mark class="code-highlight" ${attr}>${snippet}</mark>`;
          local = stop;
        } else {
          const stop = sliceUntil(globalIdx + local);
          lineHTML += escape(rawLine.slice(local, stop));
          local = stop;
        }
      }
      globalIdx += rawLine.length + 1; 
      return `<span class="code-line">${lineHTML}</span>`;
    });

    return `<pre class="code-block">${htmlLines.join("\n")}</pre>`;
  }, [fileContent, highlights]);

  const computeOffsets = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const pre = codeRef.current?.querySelector("pre.code-block");
    if (!pre || !pre.contains(range.startContainer)) return null;

    let start = 0;
    const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.classList.contains("code-line-number")) continue;
      if (node === range.startContainer) {
        start += range.startOffset;
        break;
      }
      start += node.textContent.length;
    }
    let end = start + sel.toString().length;
    if (fileContent[end] === "\n") end += 1; 
    if (start > end) [start, end] = [end, start]; 
    return { start, end };
  };

  const lineLabelFromOffsets = (s, e) => {
    const lineStart = fileContent.slice(0, s).split("\n").length;
    const lineEnd = fileContent.slice(0, e).split("\n").length;
    return lineStart === lineEnd ? `Line ${lineStart}` : `Lines ${lineStart}–${lineEnd}`;
  };

  const handleMouseUp = () => {
    const off = computeOffsets();
    if (!off) return;
    const text = fileContent.slice(off.start, off.end);
    if (!text.trim()) return;

    setHighlights((prev) => [
      ...prev.filter((h) => h.commentId !== null), 
      { start: off.start, end: off.end, commentId: null }
    ]);
    setSelection({ ...off, text, label: lineLabelFromOffsets(off.start, off.end) });
    setDraft("");
  };

  const handleMarkClick = (e) => {
    const mark = e.target.closest("mark.code-highlight");
    if (!mark || mark.dataset.temp !== undefined) return;
    const cid = mark.dataset.commentId;
    const row = document.getElementById(`comment-${cid}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("highlighted-comment");
      mark.classList.add("code-highlight-pulse");
      setTimeout(() => {
        row.classList.remove("highlighted-comment");
        mark.classList.remove("code-highlight-pulse");
      }, 1500);
    }
  };

  const handleAddComment = async () => {
    if (!selection || !draft.trim()) return;
    try {
      let subId = submission?.id;
      if (!subId) {
        const s = await axios.post("http://127.0.0.1:8000/api/submit/", {
          assignment: Number(assignmentId),
          user: Number(user.id)
        });
        subId = s.data.id;
        setSubmission(s.data);
      }
      let fId = submissionFile?.id;
      if (!fId) {
        const f = await axios.post("http://127.0.0.1:8000/api/addfile/", {
          name: fileName || "code.txt",
          submission: Number(subId),
          content: fileContent
        });
        fId = f.data.id;
        setSubmissionFile(f.data);
      }

      const firstLine = fileContent
        .slice(0, selection.start)
        .split("\n").length;

      const resp = await axios.post("http://127.0.0.1:8000/api/addcomment/", {
        submission: Number(subId),
        submission_file: Number(fId),
        user: Number(user.id),
        comment: draft.trim(),
        line_number: Number(firstLine),
        start_offset: Number(selection.start),
        end_offset: Number(selection.end)
      });

      const newC = resp.data;
      setComments((p) => [...p, newC]);
      setHighlights((p) =>
        p.map((h) =>
          h.commentId === null ? { ...h, commentId: newC.id } : h
        )
      );

      setSelection(null);
      setDraft("");
    } catch (err) {
      console.error(err);
      alert("Failed to add comment. Check the console for details.");
    }
  };

  const chooseFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setIsUploaded(false);
    setFileName(f.name);
    const r = new FileReader();
    r.onload = (ev) => setFileContent(ev.target.result);
    r.readAsText(f);
  };

  const uploadFile = async () => {
    if (!fileContent) return;
    let subId = submission?.id;
    if (!subId) {
      const s = await axios.post("http://127.0.0.1:8000/api/submit/", {
        assignment: assignmentId,
        user: user.id
      });
      subId = s.data.id;
      setSubmission(s.data);
    }
    await axios.post("http://127.0.0.1:8000/api/addfile/", {
      name: fileName || "code.txt",
      submission: subId,
      content: fileContent
    });
    setIsUploaded(true);
  };
  const deleteComment = async (cid) => {
    await axios.delete(`http://127.0.0.1:8000/api/addcomment/${cid}/`);
    setComments((p) => p.filter((c) => c.id !== cid));
    setHighlights((p) => p.filter((h) => h.commentId !== cid));
  };

  useEffect(() => {
  if (!assignmentId || !user?.id) return; 

  const studentId = selectedStudentId || user.id;
  setPLoading(true);

  axios
    .get(`http://127.0.0.1:8000/api/assignments/${assignmentId}/`)
    .then(({ data: a }) => {
      setAssignment(a);

      if (!currentCourse || currentCourse.id !== a.course) {
        return axios
          .get(`http://127.0.0.1:8000/api/classes/${a.course}/`)
          .then(({ data: c }) => setCurrentCourse(c));
      }
    })
    .catch((err) => console.error("Failed to load assignment info:", err))
    .finally(() => setPLoading(false));

  setSubmission(null);
  setSubmissionFile(null);
  setFileName("");
  setFileContent("");
  setIsUploaded(false);
  setComments([]);
  setHighlights([]);
  setSelection(null);

  axios
    .get(
      `http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?student=${studentId}`
    )
    .then(({ data }) => {
      const sub = Array.isArray(data) ? data[0] : data;
      if (sub) {
        setSubmission(sub);

        if (sub.files?.length) {
          const f = sub.files[0];
          setSubmissionFile(f);
          setFileName(f.name);
          setFileContent(f.content);
          setIsUploaded(true);
        }
      }
    })
    .catch((err) =>
      console.error(`Failed to load submission for student ${studentId}:`, err)
    );
}, [assignmentId, user?.id, selectedStudentId]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/assignments/${assignmentId}/`).then((r) => setAssignment(r.data));

    axios
      .get(`http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/?student=${user.id}`)
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length) {
          const sub = r.data[0];
          setSubmission(sub);
          if (sub.files?.length) {
            const f = sub.files[0];
            setSubmissionFile(f);
            setFileName(f.name);
            setFileContent(f.content); 
            setIsUploaded(true);
          }
        }
      });
  }, [assignmentId, user.id]);

  useEffect(() => {
    if (!fileContent || !submission) return;
    queueMicrotask(() => {
      const persisted = (submission.comments || [])
        .filter((c) => c.start_offset != null && c.end_offset != null)
        .map((c) => ({
          start: c.start_offset,
          end: c.end_offset,
          commentId: c.id
        }));
      setHighlights(persisted);
      setComments(submission.comments || []);
    });
  }, [fileContent, submission]);

  if (!assignment) return <p>Loading…</p>;

  const label = (c) => {
    const baseLabel = c.start_offset == null
      ? c.line_number
        ? `Line ${c.line_number}`
        : ""
      : lineLabelFromOffsets(c.start_offset, c.end_offset);
    return baseLabel ? `${baseLabel} by ${c.user.name}` : `${c.user.name}`;
  };
  if (pageLoading || !currentCourse || !assignment) {
    return (
      <div>
        Loading assignment…
      </div>
    );
  }
  return (
    <div className="parent">
      <header className={styles.coursePageHeader}>
        <div className={styles.courseInfoContainer}>
          <h1>{currentCourse.name}</h1>
          <h1 className={styles.courseTitleDelimiter}>|</h1>
          <p className={styles.courseTerm}>{currentCourse.term}</p>
          <p className={styles.courseTerm}>{currentCourse.year}</p>
        </div>
        <div className={styles.userInfoContainer}>
          <h1>{user.name}</h1>
        </div>
      </header>

      <div className="assignment-page-container">
        <div className="assignment-page-body">
          <aside className="sidebar-column">
            <StudentSidebar
              assignmentId={assignmentId}
              setCurrentStudent={setCurrentStudent}
              currentUser={user}
              role={role}
              selectedStudentId={selectedStudentId}
              setSelStudent={setSelStudent}
            />
          </aside>

          <div className="code-column">
            <h2>{assignment.name}</h2>
            {selectedStudentId === user.id && (
              <div className="file-upload-section">
                <input type="file" onChange={chooseFile} />
                <button onClick={uploadFile} disabled={!fileContent || isUploaded}>
                  Submit
                </button>
              </div>
            )}

            {isUploaded ? (
              <div
                ref={codeRef}
                className="code-preview-container"
                onMouseUp={handleMouseUp}
                onClick={handleMarkClick}
                dangerouslySetInnerHTML={{ __html: buildHTML() }}
              />
            ) : (
              <p style={{ fontStyle: "italic" }}>No submission added...</p>
            )}

            {selection && (
              <div className="comment-input-container">
                <p>
                  <b>{selection.label}</b>
                </p>
                <pre className="highlighted-text-preview">
                  {selection.text}
                </pre>
                <textarea
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type comment…"
                />
                <button onClick={handleAddComment}>Add</button>
              </div>
            )}
          </div>

          <div className="comments-column">
            <h4>Comments</h4>
            {comments.length === 0 && <p>No comments yet.</p>}

            <ul className="comments-list">
              {comments
                .slice()
                .sort((a, b) => {
                  const la =
                    a.start_offset != null
                      ? fileContent.slice(0, a.start_offset).split("\n").length
                      : a.line_number || 10000;
                  const lb =
                    b.start_offset != null
                      ? fileContent.slice(0, b.start_offset).split("\n").length
                      : b.line_number || 10000;
                  return la - lb;
                })
                .map((c) => (
                  <li key={c.id} id={`comment-${c.id}`}>
                    <div className="comment-header">
                      {label(c)}
                    </div>
                    <div>{c.comment}</div>
                    {role && (
                      <button 
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete this comment?`
                              )
                            ) {
                              deleteComment(c.id)
                            }
                          }}
                          style={{cursor:"pointer"}}>
                            🗑️
                            </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
