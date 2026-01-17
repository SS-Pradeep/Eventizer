import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import myImage from './assets/student.jpg';
import './css/home.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const Home = () => {
    const navigate = useNavigate();
    const [statistics, setStatistics] = useState({});
    const [timeframe, setTimeframe] = useState('lifetime');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
  const handleBackButton = () => {
    navigate("/", { replace: true }); // signup / login route
  };

  window.addEventListener("popstate", handleBackButton);

  return () => {
    window.removeEventListener("popstate", handleBackButton);
  };
}, [navigate]);

    const fetchDashboardData = async (selectedTimeframe = 'lifetime') => {
        try {
            setLoading(true);
            setError(null);
            
            const url = selectedTimeframe === 'month'
                ? "http://localhost:3000/superadmin/dashboard-stats?timeframe=month"
                : "http://localhost:3000/superadmin/dashboard-stats";
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard data: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                setStatistics(data.data.statistics);
            } else {
                setStatistics({});
            }
            
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message);
            setStatistics({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(timeframe);
    }, [timeframe]);

    const handleTimeframeChange = (e) => {
        const selectedTimeframe = e.target.value;
        setTimeframe(selectedTimeframe);
    };

    // Prepare chart data
    const chartData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [
            {
                data: [
                   statistics.pending_count || 0,
                    statistics.approved_count || 0,
                    statistics.rejected_count || 0
                
                ],
                backgroundColor: [
                    '#FFA726', // Orange for pending
                    '#66BB6A', // Green for approved  
                    '#EF5350'  // Red for rejected
                ],
                borderColor: [
                    '#FF9800',
                    '#4CAF50', 
                    '#F44336'
                ],
                borderWidth: 2,
                hoverBackgroundColor: [
                    '#FFB74D',
                    '#81C784',
                    '#E57373'
                ],
                hoverBorderWidth: 3
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    generateLabels: (chart) => {
                        const data = chart.data;
                        return data.labels.map((label, index) => ({
                            text: `${label} (${data.datasets[0].data[index]})`,
                            fillStyle: data.datasets[0].backgroundColor[index],
                            strokeStyle: data.datasets[0].borderColor[index],
                            lineWidth: 2,
                            index
                        }));
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                    }
                },
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: '#ddd',
                borderWidth: 1
            },
            title: {
                display: true,
                text: `Request Status Distribution ${timeframe === 'month' ? '(Last 30 Days)' : '(All Time)'}`,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                color: '#333',
                padding: 20
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };

    const totalRequests = (statistics.pending_count || 0) + (statistics.approved_count || 0) + (statistics.rejected_count || 0);

    return (
        <>
            <div className="main">
                <div id="adminleft">
                    <button className="profile" onClick={() => navigate("/superadmin/profile")}>
                        <img src={myImage} alt="profile"/>
                    </button>
                    <button className="btn" onClick={() => navigate('/superadmin/assignment')}>
                        Tutor Assignment
                    </button>
                    <button className="btn" onClick={() => navigate('/superadmin/letterapproval')}>
                        Permission Letters
                    </button>
                </div>
                
                <div id="adminright">
                    <div className="dashboard-header">
                        <h2>📊 Dashboard Overview</h2>
                        <select 
                            value={timeframe} 
                            onChange={handleTimeframeChange}
                            className="timeframe-dropdown"
                        >
                            <option value="lifetime">All Time</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </div>
                    
                    {/*{loading && <div className="loading">Loading dashboard...</div>}*/}
                    
                    {error && (
                        <div className="error-message">
                            <strong>⚠️ Error:</strong> {error}
                        </div>
                    )}
                    
                    {!loading && !error && (
                        <div className="dashboard-content">
                            {totalRequests > 0 ? (
                                <div className="chart-container">
                                    <Pie data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="no-data">
                                    <div className="no-data-icon">📊</div>
                                    <h3>No Data Available</h3>
                                    <p>No requests found for the selected time period.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Home;
