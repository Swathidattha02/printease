import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
    const [view, setView] = useState('login'); // 'login' or 'forgot'
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [forgotEmail, setForgotEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const loggedUser = await login(email, password);
            if (loggedUser && loggedUser.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login Error', err);
            setError(err.response?.data?.msg || 'Login Failed');
        }
    };

    const handleForgotPassword = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, { email: forgotEmail });
            setMessage(res.data.msg);
            setForgotEmail('');
        } catch (err) {
            console.error('Forgot Password Error', err);
            setError(err.response?.data?.msg || 'Failed to send password reset request');
        }
    };

    if (view === 'forgot') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2 style={{ background: 'linear-gradient(to right, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Forgot Password</h2>
                    {message && <div style={{ color: '#10b981', marginBottom: '15px', fontWeight: '500', fontSize: '0.95rem' }}>{message}</div>}
                    {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontWeight: '500', fontSize: '0.95rem' }}>{error}</div>}
                    <form className="auth-form" onSubmit={handleForgotPassword}>
                        <input 
                            type="email" 
                            placeholder="Enter your registered email" 
                            value={forgotEmail} 
                            onChange={e => setForgotEmail(e.target.value)} 
                            required 
                        />
                        <button type="submit">Send Reset Link</button>
                    </form>
                    <div className="auth-footer" style={{ marginTop: '20px' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); setMessage(''); setError(''); }}>Back to Login</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontWeight: '500', fontSize: '0.95rem' }}>{error}</div>}
                <form className="auth-form" onSubmit={onSubmit}>
                    <input type="email" placeholder="Email" name="email" value={email} onChange={onChange} required />
                    <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required />
                    
                    <div style={{ textAlign: 'right', fontSize: '0.85rem', marginTop: '-5px', marginBottom: '5px' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setError(''); setMessage(''); }}>Forgot Password?</a>
                    </div>

                    <button type="submit">Login</button>
                </form>
                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
