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
  /* ---------------- TAB STATE ---------------- */
  const [activeTab, setActiveTab] = useState("stats");

  /* ---------------- COMMON FILTERS ---------------- */
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [timeline, setTimeline] = useState("all");

  /* ---------------- STATS STATE ---------------- */
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /* ---------------- SEARCH STATE ---------------- */
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  /* ---------------- FETCH STATS ---------------- */
  useEffect(() => {
    if (!year || !section || activeTab !== "stats") return;

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
    if (
      activeTab !== "search" ||
      !query.trim() ||
      !year ||
      !section
    ) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(
          `http://localhost:3000/api/search/person?query=${query}&year=${year}&section=${section}`
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
  }, [query, year, section, activeTab]);

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

  /* ---------------- FILTER DROPDOWNS ---------------- */
  const Filters = () => (
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

      {activeTab === "stats" && (
        <select
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
        >
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="9">Last 9 Months</option>
          <option value="12">Last 12 Months</option>
          <option value="all">All Time</option>
        </select>
      )}
    </div>
  );

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

      {/* ---------------- STATS TAB ---------------- */}
      {activeTab === "stats" && (
        <div className="stats-container">
          <Filters />

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

          {(!year || !section) && (
            <p className="stats-hint">
              Select <strong>Year</strong> and <strong>Section</strong>
            </p>
          )}
        </div>
      )}

      {/* ---------------- SEARCH TAB ---------------- */}
      {activeTab === "search" && (
        <div className="search-container">
          <Filters />

          <input
            className="search-input"
            type="text"
            placeholder="Search student name / register number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!year || !section}
          />

          {(!year || !section) && (
            <p className="stats-hint">
              Select <strong>Year</strong> and <strong>Section</strong> to search
            </p>
          )}

          {loadingSearch && <p>Searching...</p>}

          {!loadingSearch &&
            query &&
            results.length === 0 &&
            year &&
            section && (
              <div className="empty-box">No results found</div>
            )}

          <ul className="search-results">
            {results.map((person) => (
              <li key={person.id} className="result-item">
                <strong>{person.name}</strong>
                <p>{person.register_no}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Search;
