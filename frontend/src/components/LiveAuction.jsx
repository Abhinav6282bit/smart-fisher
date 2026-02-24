import { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:5000/api';

function LiveAuction({ auction: initialAuction, user, onBack }) {
    const [auction, setAuction] = useState(initialAuction);
    const [bidAmount, setBidAmount] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);
    const pollRef = useRef(null);

    const isEnded = auction.status === 'completed' || timeLeft <= 0;

    // Fetch auction state
    const refreshAuction = async () => {
        try {
            const res = await fetch(`${API_URL}/fisherman/auction/${auction._id}`);
            const data = await res.json();
            if (res.ok) setAuction(data.auction);
        } catch (_) { }
    };

    // Countdown timer
    useEffect(() => {
        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(auction.endTime) - Date.now()) / 1000));
            setTimeLeft(diff);
        };
        tick();
        intervalRef.current = setInterval(tick, 1000);
        return () => clearInterval(intervalRef.current);
    }, [auction.endTime]);

    // Poll auction every 5 seconds
    useEffect(() => {
        pollRef.current = setInterval(refreshAuction, 5000);
        return () => clearInterval(pollRef.current);
    }, [auction._id]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handlePlaceBid = async () => {
        setError('');
        setSuccess('');
        const amount = Number(bidAmount);
        if (!amount || amount <= 0) return setError('Enter a valid bid amount');
        if (amount <= auction.highestBid) return setError(`Bid must be more than ₹${auction.highestBid}`);

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/fisherman/place-bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auctionId: auction._id,
                    bidderId: user.id,
                    bidderName: user.name,
                    amount,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Bid failed');
            setAuction(data.auction);
            setSuccess(`🎉 Bid of ₹${amount} placed!`);
            setBidAmount('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fish = auction.fishId;
    const winner = auction.highestBidder;

    return (
        <>
            <div className="auction-header">
                <div>
                    <div className="content-header" style={{ marginBottom: 0 }}>
                        <h1>⚡ Live Auction</h1>
                        <p style={{ textTransform: 'capitalize' }}>{fish?.fishName || 'Fish Auction'} — {fish?.quantityKg} Kg</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {!isEnded && (
                        <div className="auction-badge">
                            <div className="live-dot"></div>
                            LIVE
                        </div>
                    )}
                    <button className="view-btn" onClick={onBack}>← Back</button>
                </div>
            </div>

            {/* Winner Banner */}
            {isEnded && (
                <div className="winner-banner">
                    <span className="winner-trophy">🏆</span>
                    <h2>Auction Complete!</h2>
                    {winner?.bidderName ? (
                        <>
                            <p>Winner:</p>
                            <p className="winner-name">{winner.bidderName}</p>
                            <p style={{ marginTop: 8, fontSize: '1rem', color: 'var(--accent)', fontWeight: 700 }}>
                                Final Price: ₹{auction.highestBid}
                            </p>
                        </>
                    ) : (
                        <p>No bids were placed for this auction.</p>
                    )}
                </div>
            )}

            <div className="panel-card">
                {/* Countdown & Highest Bid */}
                <div className="auction-grid">
                    <div className="auction-info-box">
                        <label>⏳ Time Remaining</label>
                        <div className={`countdown ${timeLeft > 60 ? 'safe' : ''}`}>
                            {isEnded ? '00:00' : formatTime(timeLeft)}
                        </div>
                        {isEnded && <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 6 }}>Auction Ended</p>}
                    </div>

                    <div className="auction-info-box">
                        <label>💰 Highest Bid</label>
                        <div className="highest-bid-amount">₹{auction.highestBid}</div>
                        {winner?.bidderName && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 6 }}>
                                by {winner.bidderName}
                            </p>
                        )}
                    </div>
                </div>

                {/* Bid Input */}
                {!isEnded && (
                    <>
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        <div className="bid-input-row">
                            <div className="input-wrapper" style={{ flex: 1 }}>
                                <span className="input-icon">💵</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder={`Min bid: ₹${auction.highestBid + 1}`}
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    min={auction.highestBid + 1}
                                    disabled={loading}
                                />
                            </div>
                            <button className="place-bid-btn" onClick={handlePlaceBid} disabled={loading}>
                                {loading ? '⏳' : '🔼 Place Bid'}
                            </button>
                        </div>
                    </>
                )}

                {/* Bid History */}
                <div className="bid-history">
                    <div className="bid-history-header">📋 Bid History ({auction.bids?.length || 0} bids)</div>
                    <div className="bid-history-list">
                        {!auction.bids || auction.bids.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                No bids yet. Be the first to bid!
                            </div>
                        ) : (
                            [...(auction.bids || [])].reverse().map((bid, i) => (
                                <div className="bid-row" key={i}>
                                    <span className="bidder-name">
                                        {i === 0 ? '🏆 ' : ''}{bid.bidderName}
                                    </span>
                                    <span className="bid-amount">₹{bid.amount}</span>
                                    <span className="bid-time">{new Date(bid.placedAt).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Auction Info Footer */}
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(14,165,233,0.05)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    ℹ️ Starting Price: ₹{auction.startingPrice}/kg &bull; Quantity: {fish?.quantityKg} Kg &bull; Started: {new Date(auction.startTime).toLocaleTimeString()}
                </div>
            </div>
        </>
    );
}

export default LiveAuction;
