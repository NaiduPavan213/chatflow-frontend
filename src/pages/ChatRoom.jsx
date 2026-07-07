import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#e67e22', '#e74c3c', '#9b59b6', '#1abc9c', '#3498db', '#e91e63', '#ff5722'];

function getColor(name) {
    let hash = 0;
    for (let i = 0; i < name?.length; i++) hash += name.charCodeAt(i);
    return COLORS[hash % COLORS.length];
}

function formatTime(sentAt) {
    if (!sentAt) return '';
    return new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { token, username } = useAuth();
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchRooms();
        fetchRoomDetails();
        fetchHistory();
        connectWebSocket();
        return () => { stompClientRef.current?.disconnect(); };
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchRoomDetails = async () => {
        try {
            const res = await api.get(`/rooms/${roomId}`);
            setRoomName(res.data.name);
        } catch (err) { console.error(err); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/rooms/${roomId}/messages`);
            setMessages(res.data);
        } catch (err) { console.error(err); }
    };

    const connectWebSocket = () => {
        const backendUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace('/api', '')
            : 'http://localhost:8080';
        const stompClient = Stomp.over(() => new SockJS(`${backendUrl}/ws`));
        stompClient.debug = () => {};
        stompClient.connect({}, () => {
            setConnected(true);
            stompClient.subscribe(`/topic/room/${roomId}`, (msg) => {
                const newMessage = JSON.parse(msg.body);
                setMessages((prev) => [...prev, newMessage]);
            });
        });
        stompClientRef.current = stompClient;
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!content.trim() || !connected) return;
        stompClientRef.current.send(
            `/app/chat/${roomId}`, {},
            JSON.stringify({ content, sender: token })
        );
        setContent('');
    };

    // Group consecutive messages by same sender
    const groupedMessages = messages.reduce((acc, msg, idx) => {
        const prev = messages[idx - 1];
        const isGrouped = prev && prev.sender === msg.sender;
        acc.push({ ...msg, isGrouped });
        return acc;
    }, []);

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>

            {/* Server Rail */}
            <div style={{
                width: '72px', background: '#1e1f22',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '12px 0', gap: '8px', flexShrink: 0
            }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#5865f2', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '600'
                }}>C</div>
                <div style={{ width: '32px', height: '1px', background: '#3f4147', margin: '4px 0' }} />
                {rooms.slice(0, 4).map((room) => (
                    <div
                        key={room.id}
                        onClick={() => navigate(`/chat/${room.id}`)}
                        title={room.name}
                        style={{
                            width: '48px', height: '48px',
                            borderRadius: room.id === parseInt(roomId) ? '16px' : '50%',
                            background: room.id === parseInt(roomId) ? '#5865f2' : '#2b2d31',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: room.id === parseInt(roomId) ? 'white' : '#80848e',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.15s',
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

            {/* Channel Sidebar */}
            <div style={{
                width: '280px', background: '#2b2d31',
                display: 'flex', flexDirection: 'column', flexShrink: 0
            }}>
                <div style={{
                    padding: '16px', borderBottom: '0.5px solid #1e1f22',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span
                        onClick={() => navigate('/rooms')}
                        style={{ color: '#80848e', cursor: 'pointer', fontSize: '16px' }}
                    >←</span>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>💬 ChatFlow</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    <div style={{
                        color: '#80848e', fontSize: '11px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: '8px 10px 4px'
                    }}>Text Rooms</div>

                    {rooms.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => navigate(`/chat/${room.id}`)}
                            style={{
                                padding: '8px 10px', borderRadius: '4px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '16px', transition: 'background 0.1s',
                                background: room.id === parseInt(roomId) ? '#404249' : 'transparent',
                                color: room.id === parseInt(roomId) ? 'white' : '#80848e',
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
                            color: 'white', fontSize: '15px', fontWeight: '500',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{username}</div>
                        <div style={{ color: '#23a55a', fontSize: '11px' }}>
                            {connected ? 'Online' : 'Connecting...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, background: '#313338', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Header */}
                <div style={{
                    padding: '12px 20px', borderBottom: '0.5px solid #1e1f22',
                    display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0
                }}>
                    <span style={{ color: '#80848e', fontSize: '24px', fontWeight: '300' }}>#</span>
                    <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>{roomName}</span>
                    <div style={{ width: '1px', height: '20px', background: '#3f4147', margin: '0 8px' }} />
                    <span style={{ color: '#80848e', fontSize: '13px' }}>
                        {messages.length} messages
                    </span>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#80848e', marginTop: '80px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>#</div>
                            <div style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                                Welcome to #{roomName}!
                            </div>
                            <div style={{ fontSize: '14px' }}>This is the start of the channel.</div>
                        </div>
                    )}

                    {groupedMessages.map((msg, idx) => {
                        const isMe = msg.sender === username;
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    flexDirection: isMe ? 'row-reverse' : 'row',
                                    gap: '12px',
                                    padding: '4px 0',
                                    alignItems: 'flex-end',
                                }}
                            >
                                {/* Avatar — only show for first in group */}
                                {!msg.isGrouped ? (
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '50%',
                                        background: getColor(msg.sender),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '15px', fontWeight: '600', flexShrink: 0
                                    }}>
                                        {msg.sender?.charAt(0).toUpperCase()}
                                    </div>
                                ) : (
                                    <div style={{ width: '38px', flexShrink: 0 }} />
                                )}

                                {/* Bubble */}
                                <div style={{ maxWidth: '60%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                    {!msg.isGrouped && (
                                        <div style={{
                                            display: 'flex', gap: '8px', marginBottom: '4px',
                                            flexDirection: isMe ? 'row-reverse' : 'row',
                                            alignItems: 'baseline'
                                        }}>
                                            <span style={{
                                                color: isMe ? '#5865f2' : 'white',
                                                fontSize: '13px', fontWeight: '600'
                                            }}>
                                                {isMe ? 'You' : msg.sender}
                                            </span>
                                            <span style={{ color: '#80848e', fontSize: '11px' }}>
                                                {formatTime(msg.sentAt)}
                                            </span>
                                        </div>
                                    )}
                                    <div style={{
                                        background: isMe ? '#5865f2' : '#383a40',
                                        color: 'white',
                                        padding: '10px 14px',
                                        borderRadius: isMe
                                            ? '18px 18px 4px 18px'
                                            : '18px 18px 18px 4px',
                                        fontSize: '15px',
                                        lineHeight: '1.4',
                                        wordBreak: 'break-word',
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} style={{ height: '20px' }} />
                </div>

                {/* Input */}
                <div style={{ padding: '0 16px 20px', flexShrink: 0 }}>
                    <form onSubmit={handleSend}>
                        <div style={{
                            background: '#383a40', borderRadius: '10px',
                            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <span style={{ color: '#80848e', fontSize: '22px', cursor: 'pointer' }}>+</span>
                            <input
                                type="text"
                                placeholder={`Message #${roomName}`}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                style={{
                                    flex: 1, background: 'transparent', border: 'none',
                                    color: 'white', fontSize: '16px', outline: 'none',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!connected}
                                style={{
                                    background: connected ? '#5865f2' : '#4e505880',
                                    border: 'none', borderRadius: '6px',
                                    padding: '6px 14px', color: 'white',
                                    fontSize: '14px', cursor: connected ? 'pointer' : 'not-allowed',
                                    fontWeight: '500'
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}