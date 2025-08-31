import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "./AdminLetterApproval.css";

// PDF worker (required by react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const isPdf = (fileUrl = "", mime = "") =>
  mime === "application/pdf" || /\.pdf(\?|#|$)/i.test(fileUrl);

const isImage = (fileUrl = "", mime = "") =>
  /^image\//.test(mime) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(fileUrl);

export default function AdminLetterApproval() {
  const [filter, setFilter] = useState("pending");
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Fetch letters once
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/letters");
        const data = await res.json();
        setLetters(data);
      } catch (e) {
        console.error("Error fetching letters:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = letters.filter((l) => l.status === filter);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/letters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setLetters((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
      // If we were previewing this letter, reflect status change
      setSelected((s) => (s && s.id === id ? { ...s, status: newStatus } : s));
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const onPdfLoad = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <div className="mainapproval">
      {/* Top bar */}
      <div className="panelapprovaltop">
        <h2>Letter Approval</h2>
        <select
          className="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Content area: list + preview */}
      <div className="content">
        <div className="letterslist">
          {loading ? (
            <div className="empty">Loading letters…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No {filter} letters found.</div>
          ) : (
            filtered.map((letter) => (
              <div
                key={letter.id}
                className="letter-card"
                onClick={() => setSelected(letter)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(letter)}
              >
                <div className="letter-card__header">
                  <h3 className="letter-title">{letter.title}</h3>
                  <span className={`status status--${letter.status}`}>
                    {letter.status}
                  </span>
                </div>
                <p className="letter-desc">{letter.description}</p>

                {filter === "pending" && (
                  <div className="actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-accept"
                      onClick={() => handleStatusChange(letter.id, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleStatusChange(letter.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Preview Panel */}
        <div className="preview">
          {selected ? (
            <>
              <div className="preview-header">
                <div>
                  <h3 className="preview-title">{selected.title}</h3>
                  <p className="preview-meta">
                    Status:{" "}
                    <span className={`status status--${selected.status}`}>
                      {selected.status}
                    </span>
                  </p>
                </div>
                {selected.status === "pending" && (
                  <div className="preview-actions">
                    <button
                      className="btn btn-accept"
                      onClick={() => handleStatusChange(selected.id, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleStatusChange(selected.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="preview-body">
                {isPdf(selected.fileUrl, selected.mimeType) ? (
                  <div className="pdf-container">
                    <Document
                      file={selected.fileUrl}
                      onLoadSuccess={onPdfLoad}
                      loading={<div className="empty">Loading PDF…</div>}
                      error={<div className="empty">Unable to load PDF.</div>}
                    >
                      <Page pageNumber={pageNumber} />
                    </Document>

                    {numPages > 1 && (
                      <div className="pager">
                        <button
                          className="btn"
                          onClick={() =>
                            setPageNumber((p) => Math.max(1, p - 1))
                          }
                          disabled={pageNumber <= 1}
                        >
                          Prev
                        </button>
                        <span className="pager-info">
                          {pageNumber} / {numPages}
                        </span>
                        <button
                          className="btn"
                          onClick={() =>
                            setPageNumber((p) =>
                              Math.min(numPages || 1, p + 1)
                            )
                          }
                          disabled={numPages ? pageNumber >= numPages : true}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                ) : isImage(selected.fileUrl, selected.mimeType) ? (
                  <img
                    className="image-preview"
                    src={selected.fileUrl}
                    alt={selected.title}
                  />
                ) : (
                  <div className="empty">
                    Preview not available for this file type.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty">Select a letter to preview.</div>
          )}
        </div>
      </div>
    </div>
  );
}
