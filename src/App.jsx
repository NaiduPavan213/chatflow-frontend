import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Rooms from './pages/Rooms';
import ChatRoom from './pages/ChatRoom';

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
                path="/rooms" 
                element={
                    <ProtectedRoute>
                        <Rooms />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/chat/:roomId" 
                element={
                    <ProtectedRoute>
                        <ChatRoom />
                    </ProtectedRoute>
                } 
            />
            <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}