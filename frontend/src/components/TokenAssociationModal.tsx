/**
 * Token Association Modal
 * 
 * Prompts users to associate tokens with their non-custodial wallets
 */

import React, { useState } from 'react';
import './TokenAssociationModal.css';
import { TokenId } from '@hashgraph/sdk';

export interface TokenInfo {
  tokenId: string;
  tokenName: string;
  description: string;
  type: 'NFT' | 'FUNGIBLE';
}

interface TokenAssociationModalProps {
  isOpen: boolean;
  token: TokenInfo;
  onAssociate: (tokenId: TokenId) => Promise<void>;
  onCancel: () => void;
  onSuccess: () => void;
}

type AssociationState = 'idle' | 'associating' | 'success' | 'error';

const TokenAssociationModal: React.FC<TokenAssociationModalProps> = ({
  isOpen,
  token,
  onAssociate,
  onCancel,
  onSuccess,
}) => {
  const [state, setState] = useState<AssociationState>('idle');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleAssociate = async () => {
    try {
      setState('associating');
      setError('');

      const tokenId = TokenId.fromString(token.tokenId);
      await onAssociate(tokenId);

      setState('success');
      
      // Auto-close after success and call onSuccess
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Association error:', err);
      setState('error');
      setError(err.message || 'Failed to associate token. Please try again.');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setError('');
  };

  const handleClose = () => {
    if (state === 'associating') {
      return; // Don't allow closing while associating
    }
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content token-association-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Token Association Required</h2>
          {state !== 'associating' && (
            <button className="close-button" onClick={handleClose} aria-label="Close">
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {state === 'idle' && (
            <>
              <div className="info-section">
                <p className="info-text">
                  To receive <strong>{token.tokenName}</strong>, you need to associate it with your wallet first.
                </p>
                <p className="info-subtext">
                  This is a one-time action that allows your wallet to hold this token.
                </p>
              </div>

              <div className="token-details">
                <div className="token-detail-row">
                  <span className="detail-label">Token:</span>
                  <span className="detail-value">{token.tokenName}</span>
                </div>
                <div className="token-detail-row">
                  <span className="detail-label">Token ID:</span>
                  <span className="detail-value token-id">{token.tokenId}</span>
                </div>
                <div className="token-detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{token.type}</span>
                </div>
                <div className="token-detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{token.description}</span>
                </div>
              </div>

              <div className="cost-info">
                <p>💡 Gas fee: Usually free or ~$0.05</p>
              </div>
            </>
          )}

          {state === 'associating' && (
            <div className="loading-section">
              <div className="spinner"></div>
              <p className="loading-text">Associating token...</p>
              <p className="loading-subtext">Please confirm the transaction in your wallet</p>
            </div>
          )}

          {state === 'success' && (
            <div className="success-section">
              <div className="success-icon">✓</div>
              <p className="success-text">Token associated successfully!</p>
              <p className="success-subtext">You can now receive {token.tokenName}</p>
            </div>
          )}

          {state === 'error' && (
            <div className="error-section">
              <div className="error-icon">⚠</div>
              <p className="error-text">Association Failed</p>
              <p className="error-message">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {state === 'idle' && (
            <>
              <button className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAssociate}>
                Associate Token
              </button>
            </>
          )}

          {state === 'error' && (
            <>
              <button className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRetry}>
                Try Again
              </button>
            </>
          )}

          {state === 'associating' && (
            <p className="footer-note">Please wait...</p>
          )}

          {state === 'success' && (
            <p className="footer-note">Closing...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenAssociationModal;

