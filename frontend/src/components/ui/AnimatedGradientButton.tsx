import React from 'react';
import './AnimatedGradientButton.css';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const AnimatedGradientButton: React.FC<Props> = ({ children, onClick, disabled = false }) => {
  return (
    <div className={`animated-btn-wrapper ${disabled ? 'disabled' : ''}`}>
      <button className="animated-btn" onClick={onClick} disabled={disabled}>
        <span className="btn-text">{children}</span>
      </button>
    </div>
  );
};

export default AnimatedGradientButton;
