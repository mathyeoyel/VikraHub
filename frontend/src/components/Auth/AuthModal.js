import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  if (!isOpen) return null;

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  return mode === 'login' ? (
    <LoginForm 
      onClose={onClose}
      switchToRegister={switchToRegister}
    />
  ) : (
    <RegisterForm
      onClose={onClose}
      switchToLogin={switchToLogin}
    />
  );
};

export default AuthModal;
