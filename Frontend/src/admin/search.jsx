import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import "./css/search.css";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const CertificateStats = () => {
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [timeline, setTimeline] = useState("all");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!year || !section) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/stats/certificates?year=${year}&section=${section}&timeline=${timeline}`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [year, section, timeline]);

  const COLORS = [
    "#FFA726",
    "#66BB6A",
    "#EF5350",
    "#FFB74D",
    "#81C784",
  ];

  const BORDER_COLORS = [
    "#FF9800",
    "#4CAF50",
    "#F44336",
    "#FB8C00",
    "#43A047",
  ];

  const HOVER_COLORS = [
    "#FFCC80",
    "#A5D6A7",
    "#E57373",
    "#FFD180",
    "#C8E6C9",
  ];

  const pieData =
    stats && Object.keys(stats.categories).length > 0
      ? {
          labels: Object.keys(stats.categories),
          datasets: [
            {
              data: Object.values(stats.categories),
              backgroundColor: COLORS,
              borderColor: BORDER_COLORS,
              borderWidth: 2,
              hoverBackgroundColor: HOVER_COLORS,
            },
          ],
        }
      : null;

  const pieOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 13 },
          padding: 15,
        },
      },
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold",
          size: 14,
        },
        formatter: (value) => value,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  return (
    <div className="stats-container">
      <h2 className="stats-title">📊 Class Certificate Statistics</h2>

      {/* Controls */}
      <div className="stats-controls">
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Select Year</option>
          <option value="I">1st Year</option>
          <option value="II">2nd Year</option>
          <option value="III">3rd Year</option>
          <option value="IV">4th Year</option>
          <option value="V">5th Year</option>
        </select>

        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">Select Section</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="No">No Section</option>
        </select>

        <select value={timeline} onChange={(e) => setTimeline(e.target.value)}>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="9">Last 9 Months</option>
          <option value="12">Last 12 Months</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <p className="stats-loading">Loading statistics...</p>}

      {/* Stats Output */}
      {!loading && stats && (
        <>
          <div className="total-certificates">
            Total Certificates: {stats.total_certificates}
          </div>

          {pieData && (
            <div className="chart-wrapper">
              <Pie data={pieData} options={pieOptions} />
            </div>
          )}
        </>
      )}

      {(!year || !section) && (
        <p className="stats-hint">
          Please select both <strong>Year</strong> and <strong>Section</strong> to view statistics.
        </p>
      )}
    </div>
  );
};

export default CertificateStats;
