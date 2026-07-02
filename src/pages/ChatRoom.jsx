import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ChatRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { token, username } = useAuth();
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const stompClientRef = useRef(null);

    useEffect(() => {
        fetchHistory();
        connectWebSocket();

        // Cleanup when leaving the page
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }
        };
    }, [roomId]);

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/rooms/${roomId}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to fetch history', err);
        }
    };

    const connectWebSocket = () => {
        const socket = new SockJS('https://chatflow-backend-xubw.onrender.com/ws');
        const stompClient = Stomp.over(socket);

        stompClient.connect({}, () => {
            stompClient.subscribe(`/topic/room/${roomId}`, (msg) => {
                const newMessage = JSON.parse(msg.body);
                setMessages((prev) => [...prev, newMessage]);
            });
        });

        stompClientRef.current = stompClient;
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        stompClientRef.current.send(
            `/app/chat/${roomId}`,
            {},
            JSON.stringify({ content, sender: token })
        );
        setContent('');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto' }}>
            <button onClick={() => navigate('/rooms')}>← Back to Rooms</button>
            <h2>Room #{roomId}</h2>

            <div
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    height: '400px',
                    overflowY: 'auto',
                    padding: '15px',
                    marginBottom: '15px',
                }}
            >
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '10px' }}>
                        <strong>{msg.sender === username ? 'You' : msg.sender}:</strong> {msg.content}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ flex: 1, padding: '10px' }}
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}