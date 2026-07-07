import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['x-auth-token'] = token;
                // Ideally call /api/auth/me here to validate token
                // For now, we decode or just trust it. Let's try to get user data if we had an endpoint
                // But since we returned user object on login, let's store that in localStorage too for simplicity 
                // OR just decode JWT. 
                // Let's rely on the user details stored in localStorage for this iteration
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } else {
                delete axios.defaults.headers.common['x-auth-token'];
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(res.data.user);
        return res.data.user;
    };

    const signup = async (username, email, password, phoneNumber) => {
        await axios.post('http://localhost:5000/api/auth/signup', { username, email, password, phoneNumber });
        // Do not set token or user here. Let the component redirect.
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
