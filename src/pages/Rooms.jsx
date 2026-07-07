import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { username, logout } = useAuth();

    useEffect(() => { fetchRooms(); }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rooms', { name: roomName });
            setRoomName('');
            setShowInput(false);
            fetchRooms();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>

            {/* Server Icon Rail */}
            <div style={{
                width: '72px', background: '#1e1f22',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '12px 0', gap: '8px', flexShrink: 0
            }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#5865f2', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '600'
                }}>
                    C
                </div>
                <div style={{ width: '32px', height: '1px', background: '#3f4147', margin: '4px 0' }} />
                {rooms.slice(0, 4).map((room) => (
                    <div
                        key={room.id}
                        onClick={() => navigate(`/chat/${room.id}`)}
                        title={room.name}
                        style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            background: '#2b2d31', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#80848e', fontSize: '12px',
                            fontWeight: '600', cursor: 'pointer',
                        }}
                    >
                        #{room.name.slice(0, 2)}
                    </div>
                ))}
                <div style={{ marginTop: 'auto' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: '#23a55a', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: '600'
                    }}>
                        {username?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div style={{
                width: '280px', background: '#2b2d31',
                display: 'flex', flexDirection: 'column', flexShrink: 0
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px', borderBottom: '0.5px solid #1e1f22',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>💬 ChatFlow</div>
                        <div style={{ color: '#80848e', fontSize: '12px', marginTop: '2px' }}>
                            {rooms.length} rooms
                        </div>
                    </div>
                </div>

                {/* Rooms */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    <div style={{
                        color: '#80848e', fontSize: '11px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: '8px 10px 4px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        Text Rooms
                        <span
                            onClick={() => setShowInput(!showInput)}
                            style={{ fontSize: '18px', cursor: 'pointer', color: '#80848e' }}
                            title="Add room"
                        >+</span>
                    </div>

                    {showInput && (
                        <form onSubmit={handleCreateRoom} style={{ padding: '4px 8px', marginBottom: '4px' }}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="room-name"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                style={{
                                    width: '100%', background: '#1e1f22', border: '1px solid #5865f2',
                                    borderRadius: '4px', padding: '6px 10px', color: 'white',
                                    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            {error && <p style={{ color: '#f04747', fontSize: '11px', margin: '4px 0 0' }}>{error}</p>}
                        </form>
                    )}

                    {rooms.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => navigate(`/chat/${room.id}`)}
                            style={{
                                padding: '8px 10px', borderRadius: '4px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: '#80848e', fontSize: '16px',
                                transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#35373c';
                                e.currentTarget.style.color = '#dcddde';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#80848e';
                            }}
                        >
                            <span style={{ fontSize: '18px', fontWeight: '300' }}>#</span>
                            {room.name}
                        </div>
                    ))}
                </div>

                {/* User Footer */}
                <div style={{
                    background: '#232428', padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: '#5865f2', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '600'
                        }}>
                            {username?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: '#23a55a', border: '2px solid #232428'
                        }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            color: 'white', fontSize: '13px', fontWeight: '500',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{username}</div>
                        <div style={{ color: '#80848e', fontSize: '11px' }}>Online</div>
                    </div>
                    <div
                        onClick={() => { logout(); navigate('/login'); }}
                        title="Logout"
                        style={{ color: '#80848e', fontSize: '18px', cursor: 'pointer' }}
                    >⏻</div>
                </div>
            </div>

            {/* Main Area */}
            <div style={{
                flex: 1, background: '#313338',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#80848e' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
                    <div style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                        Select a room
                    </div>
                    <div style={{ fontSize: '14px' }}>
                        Choose a room from the sidebar to start chatting
                    </div>
                </div>
            </div>
        </div>
    );
}