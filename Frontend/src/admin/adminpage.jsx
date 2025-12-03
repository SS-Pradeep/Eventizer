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
import auth from '../config/firebase-config';
import './css/adminpage.css';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const Adminpage = () => {
    const navigate = useNavigate();
    const [statistics, setStatistics] = useState({
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0
    });
    const [pendingCertificates, setPendingCertificates] = useState([]);
    const [timeframe, setTimeframe] = useState('lifetime');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminName, setAdminName] = useState('');

    const fetchData = async (selectedTimeframe = 'lifetime') => {
        try {
            setLoading(true);
            setError(null);
            
            const user = auth.currentUser;
            if (!user) {
                setError('User not authenticated');
                return;
            }

            const url = selectedTimeframe === 'month'
                ? `http://localhost:3000/admin/dashboard-stats?uid=${user.uid}&timeframe=month`
                : `http://localhost:3000/admin/dashboard-stats?uid=${user.uid}`;
            
            console.log('Fetching data from:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('Response data:', data);
            
            if (data.success && data.data) {
                setStatistics({
                    pending_count: data.data.statistics.pending_count || 0,
                    approved_count: data.data.statistics.approved_count || 0,
                    rejected_count: data.data.statistics.rejected_count || 0
                });
                setPendingCertificates(data.data.pending_certificates || []);
                setAdminName(data.data.admin_name || 'Admin');
            } else {
                setError(data.error || 'Failed to load data');
                setStatistics({ pending_count: 0, approved_count: 0, rejected_count: 0 });
                setPendingCertificates([]);
            }
            
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to connect to server');
            setStatistics({ pending_count: 0, approved_count: 0, rejected_count: 0 });
            setPendingCertificates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(timeframe);
    }, [timeframe]);

    // Calculate total for chart display
    const totalRequests = statistics.pending_count + statistics.approved_count + statistics.rejected_count;

    const chartData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            data: [
                statistics.pending_count,
                statistics.approved_count,
                statistics.rejected_count
            ],
            backgroundColor: ['#FFA726', '#66BB6A', '#EF5350'],
            borderColor: ['#FF9800', '#4CAF50', '#F44336'],
            borderWidth: 2,
            hoverBackgroundColor: ['#FFB74D', '#81C784', '#E57373'],
            hoverBorderWidth: 3
        }]
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
                }
            },
            title: {
                display: true,
                text: `${adminName ? adminName + "'s" : 'My'} Students' Requests ${timeframe === 'month' ? '(Last 30 Days)' : '(All Time)'}`,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                color: '#333',
                padding: 20
            }
        }
    };

    if (loading) return (
        <div className="main">
            <div id="adminleft">
                <button className="profile" onClick={() => navigate("/admin/profile")}>
                    <img src={myImage} alt="profile"/>
                </button>
                <button className="btn" onClick={() => navigate('/admin/search')}>Search</button>
                <button className="btn" onClick={() => navigate('/admin/permission')}>Permission</button>
            </div>
            <div id="adminright">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading dashboard data...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="main">
            <div id="adminleft">
                <button className="profile" onClick={() => navigate("/admin/profile")}>
                    <img src={myImage} alt="profile"/>
                </button>
                <button className="btn" onClick={() => navigate('/admin/search')}>Search</button>
                <button className="btn" onClick={() => navigate('/admin/permission')}>Permission</button>
            </div>
            
            <div id="adminright">
                <div className="dashboard-header">
                    <h2>📊 My Class Dashboard</h2>
                    <select 
                        value={timeframe} 
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="timeframe-select"
                    >
                        <option value="lifetime">All Time</option>
                        <option value="month">Last 30 Days</option>
                    </select>
                </div>
                
                {error && (
                    <div className="error">
                        <strong>⚠️ Error:</strong> {error}
                        <button 
                            onClick={() => fetchData(timeframe)}
                            className="retry-btn"
                        >
                            🔄 Retry
                        </button>
                    </div>
                )}
                
                {!error && (
                    <>
                        {/* Statistics Summary */}
                        <div className="stats-summary">
                            
                            
                        </div>

                        {/* Chart */}
                        <div className="chart-container">
                            {totalRequests > 0 ? (
                                <Pie data={chartData} options={chartOptions} />
                            ) : (
                                <div className="no-data">
                                    <div className="no-data-icon">📊</div>
                                    <h3>No Data Available</h3>
                                    <p>No requests found for the selected time period.</p>
                                    <button 
                                        onClick={() => fetchData(timeframe)}
                                        className="refresh-btn"
                                    >
                                        🔄 Refresh Data
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Missing Certificates */}
                        {pendingCertificates.length > 0 && (
                            <div className="certificate-list">
                                <h3>📋 Missing Certificates ({pendingCertificates.length})</h3>
                                <div className="certificates-grid">
                                    {pendingCertificates.map((student, index) => (
                                        <div key={index} className="student-item">
                                            <div className="student-info">
                                                <span className="name">{student.student_name}</span>
                                                <span className="roll">{student.roll_number}</span>
                                            </div>
                                            <div className="student-status">
                                                <span className="overdue">⏰ Overdue</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {pendingCertificates.length >= 10 && (
                                    <p className="note">
                                        <em>Showing first 10 students. There may be more.</em>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Empty State for Certificates */}
                        {pendingCertificates.length === 0 && totalRequests > 0 && (
                            <div className="certificate-list">
                                <div className="no-pending-certificates">
                                    <span className="checkmark">✅</span>
                                    <h3>Great! No Missing Certificates</h3>
                                    <p>All your students have uploaded their certificates on time.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Adminpage;
