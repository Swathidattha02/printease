import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <header className="hero-section">
                <h1>Streamline Your Campus Printing</h1>
                <p>
                    The smartest way to manage Xerox orders. Upload documents, track status, and skip the long lines at the copy shop.
                </p>
                <div className="hero-cta">
                    {user ? (
                        <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="cta-button">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <Link to="/signup" className="cta-button">
                            Get Started
                        </Link>
                    )}
                </div>
            </header>

            <section className="features-grid">
                <div className="feature-card">
                    <div className="icon">🚀</div>
                    <h3>Fast & Easy Uploads</h3>
                    <p>Upload PDFs and documents directly from your device. No more flash drives or emails.</p>
                </div>
                <div className="feature-card">
                    <div className="icon">⏳</div>
                    <h3>Real-Time Tracking</h3>
                    <p>Know exactly when your print is ready. Monitor status from "Pending" to "Completed".</p>
                </div>
                <div className="feature-card">
                    <div className="icon">💳</div>
                    <h3>Secure Payments</h3>
                    <p>Pay online or track your payment status seamlessly within the app.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
