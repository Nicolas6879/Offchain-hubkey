/**
 * Authentication Events Service
 * 
 * Provides a centralized event system for authentication state changes
 * Components can listen to these events to update UI when login/logout occurs
 */

import EventEmitter from 'events';

export type AuthEventType = 'login' | 'logout' | 'wallet-connected' | 'wallet-disconnected';

export interface AuthEventData {
  walletAddress?: string;
  authMethod?: 'email' | 'wallet';
  userName?: string;
  userEmail?: string;
}

class AuthEventService extends EventEmitter {
  // Event names
  static readonly LOGIN = 'auth:login';
  static readonly LOGOUT = 'auth:logout';
  static readonly WALLET_CONNECTED = 'auth:wallet-connected';
  static readonly WALLET_DISCONNECTED = 'auth:wallet-disconnected';

  /**
   * Emit login event
   */
  emitLogin(data: AuthEventData) {
    console.log('🔔 Auth Event: LOGIN', data);
    this.emit(AuthEventService.LOGIN, data);
  }

  /**
   * Emit logout event
   */
  emitLogout() {
    console.log('🔔 Auth Event: LOGOUT');
    this.emit(AuthEventService.LOGOUT);
  }

  /**
   * Emit wallet connected event
   */
  emitWalletConnected(walletAddress: string) {
    console.log('🔔 Auth Event: WALLET_CONNECTED', walletAddress);
    this.emit(AuthEventService.WALLET_CONNECTED, { walletAddress });
  }

  /**
   * Emit wallet disconnected event
   */
  emitWalletDisconnected() {
    console.log('🔔 Auth Event: WALLET_DISCONNECTED');
    this.emit(AuthEventService.WALLET_DISCONNECTED);
  }

  /**
   * Subscribe to login events
   */
  onLogin(callback: (data: AuthEventData) => void) {
    this.on(AuthEventService.LOGIN, callback);
    return () => this.off(AuthEventService.LOGIN, callback);
  }

  /**
   * Subscribe to logout events
   */
  onLogout(callback: () => void) {
    this.on(AuthEventService.LOGOUT, callback);
    return () => this.off(AuthEventService.LOGOUT, callback);
  }

  /**
   * Subscribe to wallet connected events
   */
  onWalletConnected(callback: (data: AuthEventData) => void) {
    this.on(AuthEventService.WALLET_CONNECTED, callback);
    return () => this.off(AuthEventService.WALLET_CONNECTED, callback);
  }

  /**
   * Subscribe to wallet disconnected events
   */
  onWalletDisconnected(callback: () => void) {
    this.on(AuthEventService.WALLET_DISCONNECTED, callback);
    return () => this.off(AuthEventService.WALLET_DISCONNECTED, callback);
  }
}

export const authEvents = new AuthEventService();
export default authEvents;

