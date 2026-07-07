import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="navbar">
            <h1><Link to="/">Xerox System</Link></h1>
            <ul>
                {user ? (
                    <>
                        <li>Welcome, {user.username}</li>
                        {user.role === 'admin' ? (
                            <li><Link to="/admin">Admin Dashboard</Link></li>
                        ) : (
                            <li><Link to="/dashboard">Dashboard</Link></li>
                        )}
                        <li><button onClick={logout}>Logout</button></li>
                    </>
                ) : (
                    <>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/signup">Signup</Link></li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
