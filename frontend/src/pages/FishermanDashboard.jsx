import { useState, useEffect } from 'react';
import '../dashboard.css';
import AddFish from '../components/AddFish';
import LiveAuction from '../components/LiveAuction';

const API_URL = 'http://localhost:5000/api';

const NAV_ITEMS = [
    { key: 'home', emoji: '🏠', label: 'Dashboard' },
    { key: 'add', emoji: '➕', label: 'Add Fish' },
    { key: 'prices', emoji: '📊', label: 'Current Prices' },
    { key: 'auctions', emoji: '🔔', label: 'Auction Status' },
    { key: 'history', emoji: '📈', label: 'Price History' },
];

function FishermanDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('home');
    const [myFish, setMyFish] = useState([]);
    const [myAuctions, setMyAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchMyFish = () => { };
    const fetchAuctions = () => { };

    useEffect(() => {
        // Static UI mode: Use hardcoded data
        setMyFish([
            { _id: 'f1', fishName: 'Rohu', quantityKg: 40, basePrice: 180, status: 'available', createdAt: new Date().toISOString() },
            { _id: 'f2', fishName: 'Pomfret', quantityKg: 15, basePrice: 450, status: 'auctioning', createdAt: new Date().toISOString() }
        ]);
        setMyAuctions([
            {
                _id: 'auc1',
                fishId: { fishName: 'Pomfret', quantityKg: 15, basePrice: 450 },
                highestBid: 520,
                endTime: new Date(Date.now() + 1000000).toISOString(),
                status: 'active',
                bids: [{ bidderName: 'John', amount: 520 }]
            }
        ]);
    }, []);

    const handleStartAuction = (fishId) => {
        alert("Auction Started (UI Only)");
        setActiveTab('live-auction');
    };

    const stats = [
        { icon: '🐟', color: 'blue', label: 'Total Fish', value: myFish.length },
        { icon: '⚡', color: 'amber', label: 'Live Auctions', value: myAuctions.filter(a => a.status === 'active').length },
        { icon: '✅', color: 'green', label: 'Sold', value: myFish.filter(f => f.status === 'sold').length },
        { icon: '💰', color: 'purple', label: 'Available', value: myFish.filter(f => f.status === 'available').length },
    ];

    const renderContent = () => {
        if (activeTab === 'live-auction' && selectedAuction) {
            return (
                <LiveAuction
                    auction={selectedAuction}
                    user={user}
                    onBack={() => { setActiveTab('auctions'); fetchAuctions(); fetchMyFish(); }}
                />
            );
        }

        switch (activeTab) {
            case 'home':
                return <HomeTab stats={stats} myFish={myFish} onStartAuction={handleStartAuction} onGoAdd={() => setActiveTab('add')} onRefresh={fetchMyFish} />;
            case 'add':
                return (
                    <AddFish
                        user={user}
                        onSuccess={() => { fetchMyFish(); setActiveTab('home'); }}
                    />
                );
            case 'prices':
                return <PricesTab myFish={myFish} />;
            case 'auctions':
                return (
                    <AuctionsTab
                        auctions={myAuctions}
                        onView={(a) => { setSelectedAuction(a); setActiveTab('live-auction'); }}
                        onRefresh={fetchAuctions}
                    />
                );
            case 'history':
                return <HistoryTab auctions={myAuctions} />;
            default:
                return null;
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">🐟</div>
                    <div className="sidebar-brand-text">
                        <h2>Smart Fisher</h2>
                        <p>Fish Market Platform</p>
                    </div>
                </div>

                <div className="sidebar-user">
                    <div className="sidebar-avatar">🎣</div>
                    <div className="sidebar-user-info">
                        <span>{user.name}</span>
                        <span>{user.role}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.key}
                            className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(item.key);
                                if (item.key === 'home') fetchMyFish();
                                if (item.key === 'auctions') fetchAuctions();
                            }}
                        >
                            <span className="nav-emoji">{item.emoji}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
}

/* ---- Home Tab ---- */
function HomeTab({ stats, myFish, onStartAuction, onGoAdd, onRefresh }) {
    return (
        <>
            <div className="content-header">
                <h1>🎣 Fisherman Dashboard</h1>
                <p>Manage your catch, run auctions, and track prices.</p>
            </div>

            <div className="stats-row">
                {stats.map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                        <div className="stat-info">
                            <span>{s.label}</span>
                            <strong>{s.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            <div className="panel-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2>🐟 My Fish Listings</h2>
                    <button className="view-btn" onClick={onRefresh}>🔄 Refresh</button>
                </div>
                <p className="panel-desc">All fish you have added. Start an auction to sell.</p>

                {myFish.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🎣</span>
                        <p>No fish yet. <button style={{ color: 'var(--primary-light)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={onGoAdd}>Add your first catch!</button></p>
                    </div>
                ) : (
                    <div className="fish-grid">
                        {myFish.map(fish => (
                            <div className="fish-card" key={fish._id}>
                                <div className="fish-card-img">🐠</div>
                                <div className="fish-card-body">
                                    <h4>{fish.fishName}</h4>
                                    <div className="fish-meta">
                                        <span>⚖️ {fish.quantityKg} Kg</span>
                                        <span>₹{fish.basePrice}/kg</span>
                                    </div>
                                    <span className={`fish-status ${fish.status}`}>
                                        {fish.status === 'auctioning' ? '⚡' : fish.status === 'sold' ? '✅' : '🟢'} {fish.status}
                                    </span>
                                    {fish.status === 'available' && (
                                        <button className="auction-trigger-btn" onClick={() => onStartAuction(fish._id)}>
                                            ⚡ Start Auction
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

/* ---- Prices Tab ---- */
function PricesTab({ myFish }) {
    return (
        <>
            <div className="content-header">
                <h1>📊 Current Prices</h1>
                <p>View the base prices of all your fish listings.</p>
            </div>
            <div className="panel-card">
                {myFish.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon">📊</span><p>No fish added yet.</p></div>
                ) : (
                    <table className="price-table">
                        <thead>
                            <tr>
                                <th>Fish Name</th>
                                <th>Quantity (Kg)</th>
                                <th>Base Price</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myFish.map(f => (
                                <tr key={f._id}>
                                    <td style={{ textTransform: 'capitalize' }}>{f.fishName}</td>
                                    <td>{f.quantityKg} Kg</td>
                                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{f.basePrice}/kg</td>
                                    <td><span className={`fish-status ${f.status}`}>{f.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

/* ---- Auctions Tab ---- */
function AuctionsTab({ auctions, onView, onRefresh }) {
    return (
        <>
            <div className="content-header">
                <h1>🔔 Auction Status</h1>
                <p>Track all your ongoing and completed auctions.</p>
            </div>
            <div className="panel-card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button className="view-btn" onClick={onRefresh}>🔄 Refresh</button>
                </div>
                {auctions.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon">🔔</span><p>No auctions yet. Go to Dashboard and start one!</p></div>
                ) : (
                    <div className="auction-list">
                        {auctions.map(a => (
                            <div className="auction-list-item" key={a._id} onClick={() => onView(a)}>
                                <div>
                                    <div className="fish-name">{a.fishId?.fishName || 'Unknown Fish'}</div>
                                    <div className="auction-meta">
                                        Highest Bid: <strong style={{ color: 'var(--accent)' }}>₹{a.highestBid}</strong> &bull; Ends: {new Date(a.endTime).toLocaleTimeString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className={`fish-status ${a.status === 'active' ? 'auctioning' : 'sold'}`}>
                                        {a.status === 'active' ? '⚡ Live' : '✅ Done'}
                                    </span>
                                    <button className="view-btn">View →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

/* ---- History Tab ---- */
function HistoryTab({ auctions }) {
    const completed = auctions.filter(a => a.status === 'completed');
    return (
        <>
            <div className="content-header">
                <h1>📈 Price History</h1>
                <p>Review previously completed auctions and final selling prices.</p>
            </div>
            <div className="panel-card">
                {completed.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon">📈</span><p>No completed auctions yet.</p></div>
                ) : (
                    <table className="price-table">
                        <thead>
                            <tr>
                                <th>Fish</th>
                                <th>Base Price</th>
                                <th>Final Bid</th>
                                <th>Winner</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completed.map(a => (
                                <tr key={a._id}>
                                    <td style={{ textTransform: 'capitalize' }}>{a.fishId?.fishName || '—'}</td>
                                    <td>₹{a.startingPrice}/kg</td>
                                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{a.highestBid}</td>
                                    <td>{a.highestBidder?.bidderName || 'No bids'}</td>
                                    <td>{new Date(a.updatedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

export default FishermanDashboard;
