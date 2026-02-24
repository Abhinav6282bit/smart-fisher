import { useState } from 'react';

const API_URL = 'http://localhost:5000/api';

function LoginPage({ onLogin }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return setError('Please enter your name');
        if (!phone.trim()) return setError('Please enter your phone number');
        if (!/^\d{10}$/.test(phone.trim())) return setError('Please enter a valid 10-digit phone number');
        if (!role) return setError('Please select your role');

        setLoading(true);
        // Mock Login: Success after 800ms
        setTimeout(() => {
            const mockUser = {
                id: 'u_' + phone.trim(),
                name: name.trim(),
                phone: phone.trim(),
                role: role
            };
            setLoading(false);
            onLogin(mockUser);
        }, 800);
    };

    return (
        <div className="login-page">
            <div className="particles">
                {[...Array(6)].map((_, i) => <div key={i} className="particle"></div>)}
            </div>
            <div className="wave-container">
                <div className="wave"></div>
                <div className="wave"></div>
            </div>

            <div className="login-card">
                <div className="brand">
                    <div className="brand-icon">🐟</div>
                    <h1>Smart Fisher</h1>
                    <p>Fish Landing &amp; Price Transparency</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <div className="input-wrapper">
                            <span className="input-icon">👤</span>
                            <input id="name" type="text" className="form-input" placeholder="Enter your full name"
                                value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <div className="input-wrapper">
                            <span className="input-icon">📱</span>
                            <input id="phone" type="tel" className="form-input" placeholder="Enter 10-digit phone number"
                                value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} disabled={loading} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Select Your Role</label>
                        <div className="role-selector">
                            {[
                                { value: 'fisherman', emoji: '🎣', name: 'Fisherman', desc: 'Sell your catch' },
                                { value: 'buyer', emoji: '🛒', name: 'Buyer', desc: 'Buy fresh fish' },
                            ].map((r) => (
                                <div className="role-option" key={r.value}>
                                    <input type="radio" id={r.value} name="role" value={r.value}
                                        checked={role === r.value} onChange={(e) => setRole(e.target.value)} disabled={loading} />
                                    <label htmlFor={r.value} className="role-label">
                                        <span className="role-emoji">{r.emoji}</span>
                                        <span className="role-name">{r.name}</span>
                                        <span className="role-desc">{r.desc}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        <span className="btn-content">
                            {loading ? <span className="spinner"></span> : <>🚀 Login</>}
                        </span>
                    </button>
                </form>

                <div className="login-footer">Powered by Smart Fisher • Transparent Fish Markets</div>
            </div>
        </div>
    );
}

export default LoginPage;
