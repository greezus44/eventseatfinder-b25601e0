import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast('Please enter your email and password.', 'error');
      return;
    }
    setLoading(true);
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setLoading(false);

    if (result.error) {
      toast(result.error, 'error');
      return;
    }

    toast(isSignUp ? 'Account created successfully!' : 'Signed in successfully!', 'success');
    navigate('/dashboard');
  };

  return React.createElement(
    'div',
    { className: 'loading-screen' },
    React.createElement(
      'div',
      { className: 'card', style: { width: '100%', maxWidth: '400px', padding: '32px' } },
      React.createElement('h1', { style: { fontSize: '28px', fontWeight: 700, marginBottom: '4px' } }, 'Seatly'),
      React.createElement('p', { className: 'text-muted text-sm', style: { marginBottom: '24px' } }, 'Event seating made simple'),
      React.createElement(
        'form',
        { onSubmit: handleSubmit, className: 'flex-col gap-4' },
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Email'),
          React.createElement('input', {
            type: 'email',
            value: email,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
            placeholder: 'you@example.com',
            autoComplete: 'email',
          }),
        ),
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Password'),
          React.createElement('input', {
            type: 'password',
            value: password,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
            placeholder: '••••••••',
            autoComplete: isSignUp ? 'new-password' : 'current-password',
          }),
        ),
        React.createElement(
          'button',
          { type: 'submit', className: 'btn btn-primary w-full', disabled: loading },
          loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In',
        ),
        React.createElement(
          'div',
          { className: 'text-center text-sm text-muted' },
          isSignUp ? 'Already have an account? ' : "Don't have an account? ",
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'btn btn-secondary ee-btn-sm',
              style: { display: 'inline-flex', padding: '4px 10px', height: 'auto' },
              onClick: () => setIsSignUp(!isSignUp),
            },
            isSignUp ? 'Sign In' : 'Sign Up',
          ),
        ),
      ),
    ),
  );
}
