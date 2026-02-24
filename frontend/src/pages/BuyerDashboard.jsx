import { useState, useEffect, useRef } from 'react';
import '../dashboard.css';
import './BuyerDashboard.css';

const API_URL = 'http://localhost:5000/api';

const NAV_ITEMS = [
    { key: 'browse', emoji: '🐟', label: 'Browse Fish' },
    { key: 'live', emoji: '⚡', label: 'Live Auctions' },
    { key: 'mybids', emoji: '💼', label: 'My Bids' },
    { key: 'trends', emoji: '📈', label: 'Price Trends' },
];

/* ─── Countdown Hook ─── */
function useCountdown(endTime) {
    const [secs, setSecs] = useState(0);
    useEffect(() => {
        const tick = () => setSecs(Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endTime]);
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return { secs, label: `${m}:${s}` };
}

/* ─── BuyerDashboard ─── */
function BuyerDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('browse');
    const [selectedAuction, setSelectedAuction] = useState(null);

    const openAuction = (auction) => {
        if (!auction) return;
        setSelectedAuction(auction);
        setActiveTab('live-detail');
    };
    const closeAuction = () => { setSelectedAuction(null); setActiveTab('live'); };

    const renderContent = () => {
        if (activeTab === 'live-detail' && selectedAuction) {
            return <AuctionDetailView auction={selectedAuction} user={user} onBack={closeAuction} />;
        }
        switch (activeTab) {
            case 'browse': return <BrowseFishTab user={user} onBid={openAuction} />;
            case 'live': return <LiveAuctionsTab user={user} onView={openAuction} />;
            case 'mybids': return <MyBidsTab user={user} />;
            case 'trends': return <PriceTrendsTab />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">🐟</div>
                    <div className="sidebar-brand-text">
                        <h2>Smart Fisher</h2>
                        <p>Fish Market Platform</p>
                    </div>
                </div>
                <div className="sidebar-user">
                    <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg,#06d6a0,#059669)' }}>🛒</div>
                    <div className="sidebar-user-info">
                        <span>{user.name}</span>
                        <span style={{ color: '#34d399' }}>{user.role}</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.key}
                            className={`nav-item ${activeTab === item.key || (activeTab === 'live-detail' && item.key === 'live') ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.key)}
                        >
                            <span className="nav-emoji">{item.emoji}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
                </div>
            </aside>
            <main className="main-content">{renderContent()}</main>
        </div>
    );
}

/* ─── Browse Fish Tab ─── */
function BrowseFishTab({ user, onBid }) {
    const [fish, setFish] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchFish = () => {
        setLoading(true);
        // Static UI mode: Hardcoded data
        setFish([
            { _id: 'f_1', fishName: 'Rohu', quantityKg: 45, basePrice: 160, status: 'available' },
            { _id: 'f_2', fishName: 'Catla', quantityKg: 30, basePrice: 200, status: 'available' },
            { _id: 'f_3', fishName: 'Pomfret', quantityKg: 12, basePrice: 480, status: 'auctioning' }
        ]);
        setLoading(false);
    };

    useEffect(() => {
        fetchFish();
    }, []);

    const filtered = fish.filter(f => f.fishName?.toLowerCase().includes(search.toLowerCase()));

    return (
        <>
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>🐟 Browse Fish</h1>
                    <p>All available catches from fishermen near you.</p>
                </div>
                <button className="view-btn" onClick={fetchFish} disabled={loading}>
                    {loading ? '⏳ Updating...' : '🔄 Refresh Listings'}
                </button>
            </div>

            <div className="search-bar-wrapper">
                <span className="input-icon" style={{ left: 14, top: '50%', transform: 'translateY(-50%)', position: 'absolute' }}>🔍</span>
                <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 44 }}
                    placeholder="Search fish by name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="empty-state"><span className="empty-icon">⏳</span><p>Loading fish listings…</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">🎣</span><p>No fish available right now.</p></div>
            ) : (
                <div className="buyer-fish-grid">
                    {filtered.map(f => <FishCard key={f._id} fish={f} onBid={onBid} />)}
                </div>
            )}
        </>
    );
}

/* Fish Card */
function FishCard({ fish, onBid }) {
    const [auctionLoading, setAuctionLoading] = useState(false);

    const handleJoinAuction = () => {
        // Static UI mode: Just join the first available auction or alert
        onBid({
            _id: 'auc_1',
            fishId: fish,
            highestBid: fish.basePrice + 10,
            endTime: new Date(Date.now() + 1000000).toISOString(),
            status: 'active',
            bids: []
        });
    };

    return (
        <div className="buyer-fish-card">
            <div className="buyer-fish-img">
                {fish.photoUrl ? <img src={fish.photoUrl} alt={fish.fishName} /> : <span>🐠</span>}
            </div>
            <div className="buyer-fish-body">
                <div className="buyer-fish-name">{fish.fishName}</div>
                <div className="buyer-fish-meta">
                    <span>⚖️ {fish.quantityKg} Kg</span>
                    <span>🎣 {fish.fishermanId?.name || 'Fisherman'}</span>
                </div>
                <div className="buyer-fish-price">₹{fish.basePrice}<span>/kg</span></div>
                <div className="buyer-fish-total">Est. value: ₹{(fish.basePrice * fish.quantityKg).toLocaleString()}</div>
                {fish.status === 'auctioning' ? (
                    <button className="bid-now-btn live" onClick={handleJoinAuction} disabled={auctionLoading}>
                        {auctionLoading ? '⏳' : '⚡ Join Live Auction'}
                    </button>
                ) : (
                    <span className="fish-status available" style={{ display: 'inline-block', marginTop: 10 }}>🟢 Available</span>
                )}
            </div>
        </div>
    );
}

/* ─── Live Auctions Tab ─── */
function LiveAuctionsTab({ user, onView }) {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAuctions = () => {
        setLoading(true);
        setAuctions([
            {
                _id: 'auc_1',
                fishId: { fishName: 'Pomfret', quantityKg: 12, basePrice: 480 },
                highestBid: 520,
                endTime: new Date(Date.now() + 1000000).toISOString(),
                status: 'active'
            }
        ]);
        setLoading(false);
    };

    useEffect(() => { fetchAuctions(); }, []);

    return (
        <>
            <div className="content-header">
                <h1>⚡ Live Auctions</h1>
                <p>Real-time fish auctions — place your bids before time runs out!</p>
            </div>
            {loading ? (
                <div className="empty-state"><span className="empty-icon">⏳</span><p>Loading auctions…</p></div>
            ) : auctions.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">⚡</span><p>No live auctions right now. Check back soon!</p></div>
            ) : (
                <div className="live-auctions-grid">
                    {auctions.map(a => <LiveAuctionCard key={a._id} auction={a} onView={onView} />)}
                </div>
            )}
        </>
    );
}

function LiveAuctionCard({ auction, onView }) {
    const { secs, label } = useCountdown(auction.endTime);
    const urgent = secs < 60;

    return (
        <div className={`live-auction-card ${urgent ? 'urgent' : ''}`}>
            <div className="lac-header">
                <div>
                    <div className="lac-fish-name">{auction.fishId?.fishName || 'Unknown Fish'}</div>
                    <div className="lac-seller">by {auction.fishermanId?.name || 'Fisherman'} · {auction.fishId?.quantityKg} Kg</div>
                </div>
                <div className="auction-badge">
                    <div className="live-dot"></div> LIVE
                </div>
            </div>
            <div className="lac-stats">
                <div className="lac-stat">
                    <span>⏳ Time Left</span>
                    <strong className={urgent ? 'urgent-text' : ''}>{label}</strong>
                </div>
                <div className="lac-stat">
                    <span>💰 Highest Bid</span>
                    <strong style={{ color: 'var(--accent)' }}>₹{auction.highestBid}</strong>
                </div>
                <div className="lac-stat">
                    <span>🎯 Bids</span>
                    <strong>{auction.bids?.length || 0}</strong>
                </div>
            </div>
            <button className="bid-now-btn" onClick={() => onView(auction)}>
                🔼 Place Bid →
            </button>
        </div>
    );
}

/* ─── Auction Detail View ─── */
function AuctionDetailView({ auction: initial, user, onBack }) {
    const [auction, setAuction] = useState(initial);
    const [bidAmount, setBidAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { secs, label } = useCountdown(auction.endTime);
    const isEnded = auction.status === 'completed' || secs <= 0;

    const handleBid = () => {
        setError(''); setSuccess('');
        const amt = Number(bidAmount);
        if (!amt || amt <= auction.highestBid) return setError(`Must bid more than ₹${auction.highestBid}`);
        setLoading(true);

        alert("Bid placed (UI Only)");
        setSuccess(`🎉 Bid of ₹${bidAmount} placed!`);
        setBidAmount('');
        setLoading(false);
    };

    const fish = auction.fishId;
    const winner = auction.highestBidder;

    return (
        <>
            <div className="auction-header">
                <div className="content-header" style={{ marginBottom: 0 }}>
                    <h1>⚡ {fish?.fishName || 'Live Auction'}</h1>
                    <p>by {auction.fishermanId?.name || 'Fisherman'} · {fish?.quantityKg} Kg · Starting ₹{auction.startingPrice}/kg</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {!isEnded && <div className="auction-badge"><div className="live-dot"></div>LIVE</div>}
                    <button className="view-btn" onClick={onBack}>← Back</button>
                </div>
            </div>

            {isEnded && (
                <div className="winner-banner">
                    <span className="winner-trophy">🏆</span>
                    <h2>Auction Complete!</h2>
                    {winner?.bidderName ? (
                        <>
                            <p>Winner: <span className="winner-name">{winner.bidderName}</span></p>
                            {String(winner.bidderId) === String(user.id) && <p style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 6 }}>🎉 Congratulations! You won!</p>}
                            <p style={{ marginTop: 8, color: 'var(--accent)', fontWeight: 700, fontSize: '1rem' }}>Final Price: ₹{auction.highestBid}</p>
                        </>
                    ) : (
                        <p>No bids were placed.</p>
                    )}
                </div>
            )}

            <div className="panel-card">
                <div className="auction-grid">
                    <div className="auction-info-box">
                        <label>⏳ Time Remaining</label>
                        <div className={`countdown ${secs > 60 ? 'safe' : ''}`}>{isEnded ? '00:00' : label}</div>
                    </div>
                    <div className="auction-info-box">
                        <label>💰 Highest Bid</label>
                        <div className="highest-bid-amount">₹{auction.highestBid}</div>
                        {winner?.bidderName && <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 6 }}>by {winner.bidderName}</p>}
                    </div>
                </div>

                {!isEnded && (
                    <>
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        <div className="bid-input-row">
                            <div className="input-wrapper" style={{ flex: 1 }}>
                                <span className="input-icon">💵</span>
                                <input type="number" className="form-input"
                                    placeholder={`Min ₹${auction.highestBid + 1}`}
                                    value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                                    min={auction.highestBid + 1} disabled={loading} />
                            </div>
                            <button className="place-bid-btn" onClick={handleBid} disabled={loading}>
                                {loading ? '⏳' : '🔼 Place Bid'}
                            </button>
                        </div>
                    </>
                )}

                <div className="bid-history">
                    <div className="bid-history-header">📋 Bid History ({auction.bids?.length || 0})</div>
                    <div className="bid-history-list">
                        {!auction.bids?.length ? (
                            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No bids yet. Be the first!</div>
                        ) : (
                            [...auction.bids].reverse().map((b, i) => (
                                <div className="bid-row" key={i}>
                                    <span className="bidder-name">{i === 0 ? '🏆 ' : ''}{b.bidderName}{String(b.bidderId) === String(user.id) ? ' (You)' : ''}</span>
                                    <span className="bid-amount">₹{b.amount}</span>
                                    <span className="bid-time">{new Date(b.placedAt).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ─── My Bids Tab ─── */
function MyBidsTab({ user }) {
    const [myBids, setMyBids] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMyBids([
            { _id: 'b1', fishId: { fishName: 'Rohu' }, amount: 200, status: 'outbid', createdAt: new Date().toISOString() },
            { _id: 'b2', fishId: { fishName: 'Catla' }, amount: 250, status: 'leading', createdAt: new Date().toISOString() }
        ]);
        setLoading(false);
    }, []);

    return (
        <>
            <div className="content-header">
                <h1>💼 My Bids</h1>
                <p>Track all auctions you have participated in.</p>
            </div>
            <div className="panel-card">
                {loading ? (
                    <div className="empty-state"><span className="empty-icon">⏳</span><p>Loading…</p></div>
                ) : myBids.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon">💼</span><p>You haven't placed any bids yet.</p></div>
                ) : (
                    <table className="price-table">
                        <thead>
                            <tr><th>Fish</th><th>Qty</th><th>My Top Bid</th><th>Final Bid</th><th>Result</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {myBids.map((b, i) => (
                                <tr key={i}>
                                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{b.fishName}</td>
                                    <td>{b.quantityKg} Kg</td>
                                    <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>₹{b.myHighestBid}</td>
                                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{b.finalBid}</td>
                                    <td>
                                        {b.isWinner
                                            ? <span className="fish-status available">🏆 Won</span>
                                            : b.status === 'completed'
                                                ? <span className="fish-status sold">❌ Lost</span>
                                                : <span className="fish-status auctioning">⚡ Live</span>}
                                    </td>
                                    <td><span className={`fish-status ${b.status === 'active' ? 'auctioning' : 'sold'}`}>{b.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

/* ─── Price Trends Tab ─── */
function PriceTrendsTab() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setAuctions([
            { _id: 'old1', fishId: { fishName: 'Hilsa' }, highestBid: 1200, status: 'completed' },
            { _id: 'old2', fishId: { fishName: 'Pomfret' }, highestBid: 550, status: 'completed' }
        ]);
        setLoading(false);
    }, []);

    // Group by fish name for stats
    const grouped = auctions.reduce((acc, a) => {
        const name = a.fishId?.fishName || 'Unknown';
        if (!acc[name]) acc[name] = [];
        acc[name].push(a.highestBid);
        return acc;
    }, {});

    const trendCards = Object.entries(grouped).map(([name, bids]) => ({
        name,
        avgPrice: Math.round(bids.reduce((s, b) => s + b, 0) / bids.length),
        maxPrice: Math.max(...bids),
        minPrice: Math.min(...bids),
        sales: bids.length,
    }));

    return (
        <>
            <div className="content-header">
                <h1>📈 Price Trends</h1>
                <p>Market overview — average and peak prices across completed auctions.</p>
            </div>

            {trendCards.length > 0 && (
                <div className="stats-row" style={{ marginBottom: 24 }}>
                    {trendCards.slice(0, 4).map(t => (
                        <div className="stat-card" key={t.name}>
                            <div className="stat-icon blue">🐠</div>
                            <div className="stat-info">
                                <span style={{ textTransform: 'capitalize' }}>{t.name}</span>
                                <strong>₹{t.avgPrice} avg</strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="panel-card">
                {loading ? (
                    <div className="empty-state"><span className="empty-icon">⏳</span><p>Loading trends…</p></div>
                ) : auctions.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon">📈</span><p>No completed auctions yet to show trends.</p></div>
                ) : (
                    <>
                        <h2 style={{ marginBottom: 16 }}>🏷️ Price Summary by Fish</h2>
                        <table className="price-table" style={{ marginBottom: 24 }}>
                            <thead>
                                <tr><th>Fish Type</th><th>Sales</th><th>Avg Price</th><th>Min</th><th>Max</th></tr>
                            </thead>
                            <tbody>
                                {trendCards.map(t => (
                                    <tr key={t.name}>
                                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{t.name}</td>
                                        <td>{t.sales}</td>
                                        <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>₹{t.avgPrice}</td>
                                        <td style={{ color: 'var(--accent)' }}>₹{t.minPrice}</td>
                                        <td style={{ color: '#fbbf24', fontWeight: 700 }}>₹{t.maxPrice}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h2 style={{ marginBottom: 16 }}>📋 Recent Auctions</h2>
                        <table className="price-table">
                            <thead>
                                <tr><th>Fish</th><th>Qty</th><th>Base</th><th>Final Sold</th><th>Winner</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                {auctions.map(a => (
                                    <tr key={a._id}>
                                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{a.fishId?.fishName}</td>
                                        <td>{a.fishId?.quantityKg} Kg</td>
                                        <td>₹{a.startingPrice}/kg</td>
                                        <td style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{a.highestBid}</td>
                                        <td>{a.highestBidder?.bidderName || '—'}</td>
                                        <td>{new Date(a.updatedAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </>
    );
}

export default BuyerDashboard;
