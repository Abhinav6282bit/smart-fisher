import { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:5000/api';

const CONFIDENCE_CONFIG = {
    high: { color: '#06d6a0', label: '🟢 High Confidence', bg: 'rgba(6,214,160,0.08)', border: 'rgba(6,214,160,0.25)' },
    medium: { color: '#f59e0b', label: '🟡 Medium Confidence', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
    low: { color: '#94a3b8', label: '⚪ Low Confidence', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.2)' },
};

const TREND_ICONS = { rising: '📈 Rising', falling: '📉 Falling', stable: '➡️ Stable' };

// Debounce hook
function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

function AddFish({ user, onSuccess }) {
    const [fishName, setFishName] = useState('');
    const [quantityKg, setQuantityKg] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // AI suggestion state
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    const debouncedFishName = useDebounce(fishName, 700);

    // Fetch AI price suggestion on fish name change
    useEffect(() => {
        if (!debouncedFishName || debouncedFishName.trim().length < 2) {
            setAiSuggestion(null);
            return;
        }
        setAiLoading(true);
        fetch(`${API_URL}/ai/price-suggest?fishName=${encodeURIComponent(debouncedFishName.trim())}`)
            .then(r => r.json())
            .then(data => {
                if (data.suggestion) setAiSuggestion(data);
                else setAiSuggestion(null);
            })
            .catch(() => setAiSuggestion(null))
            .finally(() => setAiLoading(false));
    }, [debouncedFishName]);

    const applyAiPrice = () => {
        if (aiSuggestion?.suggestion) setBasePrice(String(aiSuggestion.suggestion));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!fishName.trim()) return setError('Please enter a fish name');
        if (!quantityKg || isNaN(quantityKg) || Number(quantityKg) <= 0) return setError('Please enter a valid quantity');
        if (!basePrice || isNaN(basePrice) || Number(basePrice) <= 0) return setError('Please enter a valid base price');

        setLoading(true);
        // Static UI mode: Just show success
        setTimeout(() => {
            setSuccess(`✅ "${fishName}" added successfully! (UI Only)`);
            setTimeout(() => {
                setLoading(false);
                onSuccess();
            }, 1000);
        }, 800);
    };

    const conf = aiSuggestion ? (CONFIDENCE_CONFIG[aiSuggestion.confidence] || CONFIDENCE_CONFIG.low) : null;

    return (
        <>
            <div className="content-header">
                <h1>➕ Add Fish</h1>
                <p>List a new catch to sell or put up for auction.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
                {/* Main Form */}
                <div className="panel-card">
                    <h2>🐠 New Fish Listing</h2>
                    <p className="panel-desc">Fill in the details of your catch below.</p>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="add-fish-grid">
                            {/* Fish Name */}
                            <div className="form-group full-width">
                                <label htmlFor="fishName">Fish Name</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🐟</span>
                                    <input id="fishName" type="text" className="form-input"
                                        placeholder="e.g. Rohu, Catla, Pomfret, Prawns"
                                        value={fishName} onChange={(e) => setFishName(e.target.value)} disabled={loading} />
                                    {aiLoading && (
                                        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--primary-light)' }}>
                                            🤖⏳
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="form-group">
                                <label htmlFor="quantity">Quantity (Kg)</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">⚖️</span>
                                    <input id="quantity" type="number" className="form-input"
                                        placeholder="e.g. 50" min="0.1" step="0.1"
                                        value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)} disabled={loading} />
                                </div>
                            </div>

                            {/* Base Price */}
                            <div className="form-group">
                                <label htmlFor="basePrice">
                                    Base Price (₹/kg)
                                    {aiSuggestion && (
                                        <button type="button" onClick={applyAiPrice}
                                            style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(6,214,160,0.15)', border: '1px solid rgba(6,214,160,0.3)', borderRadius: 6, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                                            🤖 Use AI: ₹{aiSuggestion.suggestion}
                                        </button>
                                    )}
                                </label>
                                <div className="input-wrapper">
                                    <span className="input-icon">💰</span>
                                    <input id="basePrice" type="number" className="form-input"
                                        placeholder="e.g. 200" min="1" step="1"
                                        value={basePrice} onChange={(e) => setBasePrice(e.target.value)} disabled={loading} />
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="form-group full-width">
                                <label>Upload Photo</label>
                                <div className="fish-photo-upload">
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={loading} />
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="upload-preview" />
                                    ) : (
                                        <>
                                            <div className="upload-icon">📷</div>
                                            <p>Click to upload a photo of your catch</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        {fishName && quantityKg && basePrice && (
                            <div style={{ background: 'rgba(6,214,160,0.07)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: 10, padding: '14px 16px', marginTop: 4, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                📦 Listing <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{fishName}</strong> — {quantityKg} Kg at ₹{basePrice}/kg
                                &nbsp;(Est. value: <strong style={{ color: 'var(--accent)' }}>₹{(Number(quantityKg) * Number(basePrice)).toLocaleString()}</strong>)
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? '⏳ Adding...' : '🐟 Add Fish Listing'}
                        </button>
                    </form>
                </div>

                {/* AI Price Card */}
                <div>
                    {/* Placeholder when no name */}
                    {!fishName && !aiSuggestion && (
                        <div className="panel-card ai-placeholder-card">
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ fontSize: 44, marginBottom: 12 }}>🤖</div>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 8 }}>AI Price Advisor</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                                    Type a fish name to get an instant AI-powered price suggestion based on local market history.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                                {['Rohu', 'Pomfret', 'Prawns', 'Hilsa', 'Catla'].map(f => (
                                    <div key={f} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'rgba(14,165,233,0.05)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <span>🐟 {f}</span><span style={{ color: 'var(--primary-light)' }}>Try it →</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {aiLoading && fishName && (
                        <div className="panel-card ai-placeholder-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Analyzing market data for <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{fishName}</strong>…</p>
                            <div className="spinner" style={{ margin: '12px auto 0', borderColor: 'rgba(14,165,233,0.3)', borderTopColor: 'var(--primary)' }}></div>
                        </div>
                    )}

                    {/* AI Suggestion Card */}
                    {!aiLoading && aiSuggestion && conf && (
                        <div className="panel-card ai-suggestion-card" style={{ border: `1px solid ${conf.border}`, background: conf.bg }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 4 }}>🤖 AI Price Advisor</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{aiSuggestion.fishName}</div>
                                </div>
                                <span style={{ fontSize: '0.7rem', padding: '3px 10px', background: conf.bg, border: `1px solid ${conf.border}`, borderRadius: 20, color: conf.color, fontWeight: 600 }}>
                                    {conf.label}
                                </span>
                            </div>

                            {/* Suggested Price */}
                            <div style={{ textAlign: 'center', padding: '16px 0', borderTop: `1px solid ${conf.border}`, borderBottom: `1px solid ${conf.border}`, marginBottom: 16 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Suggested Price</div>
                                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: conf.color }}>₹{aiSuggestion.suggestion}<span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.7 }}>/kg</span></div>
                                {aiSuggestion.trend && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                                        Market Trend: <strong>{TREND_ICONS[aiSuggestion.trend] || aiSuggestion.trend}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            {aiSuggestion.stats && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                                    {[
                                        { label: 'Avg', value: `₹${aiSuggestion.stats.avgPrice}` },
                                        { label: 'Min', value: `₹${aiSuggestion.stats.minPrice}` },
                                        { label: 'Max', value: `₹${aiSuggestion.stats.maxPrice}` },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'rgba(10,18,35,0.4)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 14, textAlign: 'center' }}>
                                {aiSuggestion.reason}
                            </div>

                            <button type="button" onClick={applyAiPrice}
                                style={{ width: '100%', padding: '11px', background: `linear-gradient(135deg, ${conf.color}, ${conf.color}cc)`, color: '#fff', border: 'none', borderRadius: 9, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s' }}>
                                ✅ Apply ₹{aiSuggestion.suggestion} as Base Price
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AddFish;
