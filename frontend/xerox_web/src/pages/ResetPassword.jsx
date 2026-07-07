import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
                password,
                confirmPassword
            });
            setMessage(res.data.msg || 'Password updated successfully!');
            setPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Reset Password Error:', err);
            setError(err.response?.data?.msg || 'Failed to reset password. The link may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 style={{ background: 'linear-gradient(to right, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Reset Password</h2>
                {message && <div style={{ color: '#10b981', marginBottom: '15px', fontWeight: '500', fontSize: '0.95rem' }}>{message} Redirecting to login...</div>}
                {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontWeight: '500', fontSize: '0.95rem' }}>{error}</div>}
                
                {!message && (
                    <form className="auth-form" onSubmit={onSubmit}>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Reset Password'}
                        </button>
                    </form>
                )}
                
                <div className="auth-footer" style={{ marginTop: '20px' }}>
                    <a href="/login">Back to Login</a>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
