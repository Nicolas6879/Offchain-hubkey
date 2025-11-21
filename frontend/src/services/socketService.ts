import { io, Socket } from 'socket.io-client';
import { appConfig } from '../config';

interface SignatureRequest {
  requestId: string;
  message: string;
  hubId: string;
}

interface SignatureResponse {
  requestId: string;
  signature: string;
  message: string;
}

class SocketService {
  private socket: Socket | null = null;
  private walletAddress: string | null = null;
  private isConnected: boolean = false;
  private signatureRequestHandlers: ((request: SignatureRequest) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket) {
      console.log('Socket already connected');
      return;
    }

    const backendUrl = appConfig.networks.testnet.backendUrl;
    console.log('Connecting to WebSocket server at:', backendUrl);

    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server:', this.socket?.id);
      this.isConnected = true;
      this.notifyConnectionHandlers(true);
      
      // Register wallet if we have one
      if (this.walletAddress) {
        this.registerWallet(this.walletAddress);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
    });

    this.socket.on('registered', (data) => {
      console.log('Wallet registered with socket:', data);
    });

    this.socket.on('signature_needed', (data: SignatureRequest) => {
      console.log('Signature request received:', data);
      this.notifySignatureRequestHandlers(data);
    });

    this.socket.on('signature_confirmed', (data) => {
      console.log('Signature confirmed:', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
    }
  }

  /**
   * Register wallet address with the socket server
   */
  registerWallet(walletAddress: string): void {
    this.walletAddress = walletAddress;
    
    if (this.socket && this.isConnected) {
      console.log('Registering wallet with socket:', walletAddress);
      this.socket.emit('register', { walletAddress });
    }
  }

  /**
   * Unregister wallet
   */
  unregisterWallet(): void {
    this.walletAddress = null;
  }

  /**
   * Submit signature response
   */
  submitSignature(response: SignatureResponse): void {
    if (this.socket && this.isConnected) {
      console.log('Submitting signature:', response);
      this.socket.emit('submit_signature', response);
    } else {
      console.error('Cannot submit signature: socket not connected');
    }
  }

  /**
   * Add handler for signature requests
   */
  onSignatureRequest(handler: (request: SignatureRequest) => void): void {
    this.signatureRequestHandlers.push(handler);
  }

  /**
   * Remove handler for signature requests
   */
  offSignatureRequest(handler: (request: SignatureRequest) => void): void {
    const index = this.signatureRequestHandlers.indexOf(handler);
    if (index > -1) {
      this.signatureRequestHandlers.splice(index, 1);
    }
  }

  /**
   * Add handler for connection status changes
   */
  onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Remove handler for connection status changes
   */
  offConnectionChange(handler: (connected: boolean) => void): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  /**
   * Add handler for any custom socket event
   */
  onSocketEvent(eventName: string, handler: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(eventName, handler);
    }
  }

  /**
   * Remove handler for any custom socket event
   */
  offSocketEvent(eventName: string, handler: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(eventName, handler);
    }
  }

  /**
   * Get socket instance (for direct access if needed)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get current wallet address
   */
  getCurrentWallet(): string | null {
    return this.walletAddress;
  }

  private notifySignatureRequestHandlers(request: SignatureRequest): void {
    this.signatureRequestHandlers.forEach(handler => {
      try {
        handler(request);
      } catch (error) {
        console.error('Error in signature request handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

export type { SignatureRequest, SignatureResponse }; 