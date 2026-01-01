import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./css/search.css";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const Search = () => {
  /* ---------------- TAB ---------------- */
  const [activeTab, setActiveTab] = useState("stats");

  /* ---------------- STATS ---------------- */
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [timeline, setTimeline] = useState("all");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /* ---------------- SEARCH ---------------- */
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  /* ---------------- CERTIFICATES ---------------- */
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [certificateRows, setCertificateRows] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  /* ---------------- PDF ---------------- */
  const [pdfUrls, setPdfUrls] = useState({});
  const [loadingPdf, setLoadingPdf] = useState({});
  const [activeRequestId, setActiveRequestId] = useState(null);

  /* ---------------- FETCH STATS ---------------- */
  useEffect(() => {
    if (activeTab !== "stats" || !year || !section) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(
          `http://localhost:3000/api/stats/certificates?year=${year}&section=${section}&timeline=${timeline}`
        );
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [year, section, timeline, activeTab]);

  /* ---------------- LIVE SEARCH ---------------- */
  useEffect(() => {
    if (activeTab !== "search") return;

    if (!query.trim()) {
      setResults([]);
      setSelectedStudentId(null);
      setCertificateRows([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(
          `http://localhost:3000/api/search/person?nameid=${query}`
        );
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  /* ---------------- STUDENT CLICK ---------------- */
  const handleStudentClick = async (studentId) => {
    if (studentId === selectedStudentId) {
      setSelectedStudentId(null);
      setCertificateRows([]);
      setActiveRequestId(null);
      return;
    }

    setSelectedStudentId(studentId);
    setCertificateRows([]);
    setActiveRequestId(null);
    setLoadingCertificates(true);

    try {
      const res = await fetch(
        `http://localhost:3000/api/student/${studentId}/details`
      );
      const data = await res.json();
      setCertificateRows(data);
    } catch (err) {
      console.error(err);
      setCertificateRows([]);
    } finally {
      setLoadingCertificates(false);
    }
  };

  /* ---------------- CERTIFICATE CLICK ---------------- */
  const handleCertificateClick = async (requestId) => {
    if (activeRequestId === requestId) {
      setActiveRequestId(null);
      return;
    }

    if (pdfUrls[requestId]) {
      setActiveRequestId(requestId);
      return;
    }

    try {
      setLoadingPdf(prev => ({ ...prev, [requestId]: true }));
      setActiveRequestId(requestId);

      const res = await fetch(
        `http://localhost:3000/api/certificate/${requestId}`
      );

      if (!res.ok) throw new Error("Failed to load certificate");

      const data = await res.json();
      console.log(data);
      if (data.success && data.url) {
        setPdfUrls(prev => ({
          ...prev,
          [requestId]: data.url
        }));
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to load certificate");
      setActiveRequestId(null);
    } finally {
      setLoadingPdf(prev => ({ ...prev, [requestId]: false }));
    }
  };

  /* ---------------- PIE DATA ---------------- */
  const pieData =
    stats && stats.categories
      ? {
          labels: Object.keys(stats.categories),
          datasets: [
            {
              data: Object.values(stats.categories),
              backgroundColor: [
                "#FFA726",
                "#66BB6A",
                "#EF5350",
                "#FFB74D",
                "#81C784",
              ],
              borderWidth: 2,
            },
          ],
        }
      : null;

  return (
    <div className="dashboard-container">
      {/* ---------------- TABS ---------------- */}
      <div className="tabs">
        <button
          className={activeTab === "stats" ? "tab active" : "tab"}
          onClick={() => setActiveTab("stats")}
        >
          STATS
        </button>
        <button
          className={activeTab === "search" ? "tab active" : "tab"}
          onClick={() => setActiveTab("search")}
        >
          SEARCH
        </button>
      </div>

      {/* ---------------- STATS ---------------- */}
      {activeTab === "stats" && (
        <div className="stats-container">
          <div className="stats-controls">
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Select Year</option>
              <option value="I">1st Year</option>
              <option value="II">2nd Year</option>
              <option value="III">3rd Year</option>
              <option value="IV">4th Year</option>
            </select>

            <select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Select Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>

            <select value={timeline} onChange={(e) => setTimeline(e.target.value)}>
              <option value="3">Last 3 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="9">Last 9 Months</option>
              <option value="12">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {loadingStats && <p>Loading statistics...</p>}

          {!loadingStats && stats && (
            <>
              <div className="total-certificates">
                Total Certificates: {stats.total_certificates}
              </div>
              {pieData && (
                <div className="chart-wrapper">
                  <Pie data={pieData} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ---------------- SEARCH ---------------- */}
      {activeTab === "search" && (
        <div className="search-container">
          <input
            className="search-input"
            type="text"
            placeholder="Search student name / roll number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {loadingSearch && <p>Searching...</p>}

          <ul className="search-results">
            {results.map(student => (
              <li
                key={student.student_id}
                className={`result-item ${
                  selectedStudentId === student.student_id ? "active" : ""
                }`}
                onClick={() => handleStudentClick(student.student_id)}
              >
                <strong>{student.name}</strong>
                <div className="result-roll">
                  {student.class_name} - {student.section} | Roll No: {student.roll_number}
                </div>
              </li>
            ))}
          </ul>

          {selectedStudentId && (
            <div className="excel-table-wrapper">
              <h4>Certificates</h4>

              {loadingCertificates && <p>Loading certificates...</p>}

              {!loadingCertificates && certificateRows.length === 0 && (
                <p>No certificates uploaded</p>
              )}

              {!loadingCertificates && certificateRows.length > 0 && (
                <>
                  <table className="excel-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificateRows.map((row, i) => (
                        <tr key={i}>
                          <td>{row.date}</td>
                          <td>{row.event_name}</td>
                          <td>{row.event_type}</td>
                          <td>
                            <button
                              className="certificate-btn"
                              onClick={() => handleCertificateClick(row.request_id)}
                            >
                              {loadingPdf[row.request_id]
                                ? "Loading..."
                                : activeRequestId === row.request_id
                                ? "Hide"
                                : "View Certificate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {activeRequestId && pdfUrls[activeRequestId] && (
                    <div className="pdf-viewer">
                      <div className="pdf-actions">
                        <button onClick={() => window.open(pdfUrls[activeRequestId], "_blank")}>
                          Open in New Tab
                        </button>
                        <a href={pdfUrls[activeRequestId]} download>
                          Download PDF
                        </a>
                      </div>

                      <iframe
                        src={pdfUrls[activeRequestId]}
                        title="Certificate PDF"
                        width="100%"
                        height="600px"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
