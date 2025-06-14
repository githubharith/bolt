import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('guardshare_token');
      if (!token) return;

      const serverUrl = Constants.expoConfig?.extra?.socketUrl || 'http://localhost:5000';
      
      this.socket = io(serverUrl, {
        auth: {
          token,
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

    } catch (error) {
      console.error('Error connecting to socket:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();