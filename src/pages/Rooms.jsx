import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { username, logout } = useAuth();

    // Runs once when page loads
    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Failed to fetch rooms', err);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/rooms', { name: roomName });
            setRoomName('');
            fetchRooms(); // refresh list after creating
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Welcome, {username}</h2>
                <button onClick={handleLogout}>Logout</button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="New room name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                    style={{ padding: '10px', marginRight: '10px' }}
                />
                <button type="submit">Create Room</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h3>Available Rooms</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {rooms.map((room) => (
                    <li
                        key={room.id}
                        onClick={() => navigate(`/chat/${room.id}`)}
                        style={{
                            padding: '15px',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            cursor: 'pointer',
                        }}
                    >
                        <strong>{room.name}</strong> — created by {room.createdBy}
                    </li>
                ))}
            </ul>
        </div>
    );
}