import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'printed', 'delivered', 'customers'
    const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0 });

    // Change Password States
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [cpData, setCpData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [cpMessage, setCpMessage] = useState('');
    const [cpError, setCpError] = useState('');

    const { logout, user: authUser } = useContext(AuthContext);

    useEffect(() => {
        fetchOrders();
        fetchUsers();

        // Socket.io Real-time connection
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const socket = io(backendUrl);

        socket.on('connect', () => {
            console.log('[Socket] Connected to backend');
        });

        socket.on('new-order', (newOrder) => {
            console.log('[Socket] New order event received:', newOrder);
            fetchOrders(); // Instantly refresh data & recalculate stats
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected from backend');
        });

        const interval = setInterval(fetchOrders, 30000); // Poll every 30s as fallback
        
        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'all') {
            setFilteredOrders(orders);
        } else if (activeTab === 'customers') {
            setFilteredOrders([]);
        } else {
            setFilteredOrders(orders.filter(order => order.status === activeTab));
        }
    }, [orders, activeTab]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/orders`);
            const data = res.data || [];
            // Filter out any razorpay orders that have not been successfully paid
            const validOrders = data.filter(order => {
                return !(order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid');
            });
            setOrders(validOrders);

            // Calculate Stats
            const total = validOrders.length;
            const revenue = validOrders.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
            const pending = validOrders.filter(o => o.status === 'pending').length;
            setStats({ total, revenue, pending });

        } catch (err) {
            console.error('Fetch Error', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/auth/users`);
            setUsers(res.data || []);
        } catch (err) {
            console.error('Fetch users error', err);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/orders/${id}/status`, { status });
            fetchOrders();
        } catch (err) {
            alert('Update Failed');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'badge-pending';
            case 'printed': return 'badge-printed';
            case 'delivered': return 'badge-delivered';
            default: return '';
        }
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setCpMessage('');
        setCpError('');

        if (cpData.newPassword !== cpData.confirmNewPassword) {
            setCpError('New passwords do not match');
            return;
        }

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/change-password`, cpData);
            setCpMessage(res.data.msg || 'Password updated successfully!');
            setCpData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setTimeout(() => {
                setShowChangePassword(false);
                setCpMessage('');
            }, 2000);
        } catch (err) {
            console.error('Change Password Error:', err);
            setCpError(err.response?.data?.msg || 'Failed to change password');
        }
    };

    return (
        <div className="admin-layout">
            {/* Left Sidebar */}
            <aside className="admin-sidebar">
                <div>
                    <div className="sidebar-brand">
                        Xerox Control
                    </div>
                    <nav className="sidebar-menu">
                        <button 
                            className={`sidebar-item ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Orders Queue
                        </button>
                        <button 
                            className={`sidebar-item ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Pending Requests
                        </button>
                        <button 
                            className={`sidebar-item ${activeTab === 'printed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('printed')}
                        >
                            Printed Requests
                        </button>
                        <button 
                            className={`sidebar-item ${activeTab === 'delivered' ? 'active' : ''}`}
                            onClick={() => setActiveTab('delivered')}
                        >
                            Delivered/Completed
                        </button>
                        <button 
                            className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('customers')}
                        >
                            Registered Customers
                        </button>
                    </nav>
                </div>
                <div className="sidebar-footer">
                    <div className="admin-profile">
                        <div className="admin-avatar">
                            {authUser ? authUser.username.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                        <div className="admin-details">
                            <span className="admin-name">{authUser ? authUser.username : 'Admin'}</span>
                            <span className="admin-role">Administrator</span>
                        </div>
                    </div>
                    <button className="btn-sidebar-action" onClick={() => setShowChangePassword(true)}>
                        🔑 Change Password
                    </button>
                    <button className="btn-sidebar-action btn-sidebar-logout" onClick={logout}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                <header className="admin-header-row">
                    <h1>
                        {activeTab === 'all' && 'All Orders Queue'}
                        {activeTab === 'pending' && 'Pending Print Jobs'}
                        {activeTab === 'printed' && 'Printed Jobs Queue'}
                        {activeTab === 'delivered' && 'Delivered Print History'}
                        {activeTab === 'customers' && 'Customer Database'}
                    </h1>
                    <div className="pulse-indicator">
                        <div className="pulse-dot"></div>
                        Live Auto-Refresh
                    </div>
                </header>

                {/* Stats Cards Section */}
                <section className="admin-stats-container">
                    <div className="admin-stats-card">
                        <div className="stats-card-details">
                            <h3>Total Orders</h3>
                            <p className="value">{stats.total}</p>
                        </div>
                        <div className="stats-icon-wrapper blue">📋</div>
                    </div>
                    <div className="admin-stats-card">
                        <div className="stats-card-details">
                            <h3>Revenue</h3>
                            <p className="value">₹{stats.revenue}</p>
                        </div>
                        <div className="stats-icon-wrapper green">₹</div>
                    </div>
                    <div className="admin-stats-card">
                        <div className="stats-card-details">
                            <h3>Pending Jobs</h3>
                            <p className="value">{stats.pending}</p>
                        </div>
                        <div className="stats-icon-wrapper yellow">⏳</div>
                    </div>
                </section>

                {/* Main Dynamic View Section */}
                {activeTab === 'customers' ? (
                    <section className="admin-card-section">
                        <h2>Registered Customers</h2>
                        <div className="responsive-table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Phone Number</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No customers registered yet.</td></tr>
                                    ) : (
                                        users.map(u => (
                                            <tr key={u._id}>
                                                <td>{u.username}</td>
                                                <td>{u.email}</td>
                                                <td>{u.phoneNumber || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <section className="admin-card-section">
                        <h2>Order Queue</h2>
                        <div className="responsive-table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>User Details</th>
                                        <th>Document File</th>
                                        <th>Printing Settings</th>
                                        <th>Order Time</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No orders found in this view.</td></tr>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <tr key={order._id}>
                                                <td style={{ fontFamily: 'monospace', color: '#9ca3af' }}>#{order._id.slice(-6).toUpperCase()}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{order.userId?.username || 'Guest'}</span>
                                                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{order.userId?.email}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{order.filePath.split(/[\\/]/).pop()}</span>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <span style={{ fontWeight: 600 }}>{order.printSettings.printType === 'color' ? '🌈 Color' : '⚫ B&W'}</span>
                                                        <span style={{ margin: '0 6px', color: '#4b5563' }}>•</span>
                                                        <span>{order.printSettings.copies} copies</span>
                                                        <span style={{ margin: '0 6px', color: '#4b5563' }}>•</span>
                                                        {order.paymentMethod === 'razorpay' ? (
                                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>💳 Razorpay (Verified)</span>
                                                        ) : (
                                                            <>
                                                                <span>📱 Manual UPI</span>
                                                                {order.paymentScreenshotPath && (
                                                                    <>
                                                                        <span style={{ margin: '0 6px', color: '#4b5563' }}>•</span>
                                                                        <a 
                                                                            href={`${process.env.REACT_APP_BACKEND_URL}/uploads/${order.paymentScreenshotPath.split(/[\\/]/).pop()}`} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer" 
                                                                            style={{ color: '#38bdf8', textDecoration: 'underline' }}
                                                                        >
                                                                            Receipt
                                                                        </a>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {order.status === 'pending' && (
                                                            <button className="btn-action-outline" onClick={() => updateStatus(order._id, 'printed')}>Print</button>
                                                        )}
                                                        {order.status === 'printed' && (
                                                            <button className="btn-action-success" onClick={() => updateStatus(order._id, 'delivered')}>Complete</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>

            {showChangePassword && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ color: 'var(--text-color)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', background: 'linear-gradient(to right, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Change Password</h3>
                        {cpMessage && <div style={{ color: '#10b981', marginBottom: '15px', fontWeight: '500', fontSize: '0.9rem' }}>{cpMessage}</div>}
                        {cpError && <div style={{ color: '#ef4444', marginBottom: '15px', fontWeight: '500', fontSize: '0.9rem' }}>{cpError}</div>}
                        <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={cpData.currentPassword}
                                onChange={e => setCpData({ ...cpData, currentPassword: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={cpData.newPassword}
                                onChange={e => setCpData({ ...cpData, newPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={cpData.confirmNewPassword}
                                onChange={e => setCpData({ ...cpData, confirmNewPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                            <div className="modal-actions" style={{ marginTop: '10px' }}>
                                <button type="button" className="btn-cancel" onClick={() => { setShowChangePassword(false); setCpMessage(''); setCpError(''); setCpData({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); }}>Cancel</button>
                                <button type="submit" className="btn-confirm">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
