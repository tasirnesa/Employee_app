import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use environment variable or fallback to backend port 5000
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to real-time server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from real-time server');
      setIsConnected(false);
    });

    // Handle new notifications
    socketInstance.on('notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Invalidate notifications query to refresh the bell icon
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] });

      // Show toast if desired
      toast.info(`🔔 ${notification.title}: ${notification.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    // Handle new messages
    socketInstance.on('newMessage', (message) => {
      console.log('New message received:', message);
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
      
      // Specifically invalidate the chat history for this sender
      queryClient.invalidateQueries({ queryKey: ['chat', message.senderId] });
    });

    // Handle messages marked as read
    socketInstance.on('messagesRead', (data) => {
      console.log('Messages from partner marked as read:', data.otherUserId);
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
      queryClient.invalidateQueries({ queryKey: ['chat', data.otherUserId] });
    });

    // Handle individual message mark as read (read receipts)
    socketInstance.on('messageRead', (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat', data.receiverId] });
    });

    // Handle system updates (refetch events)
    socketInstance.on('refetch', (queryKey) => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      } else {
        queryClient.invalidateQueries();
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
