import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Login from './Login';

// Test to check if the Login component renders correctly
test('renders Login component', () => {
    render(<Login CancelLogin={() => {}} OpenAccount={() => {}} SetEmail={() => {}} />);
    expect(screen.getByText('Login')).toBeInTheDocument();
});

// Test to check if an error message is shown for an invalid email
test('shows error message for invalid email', async () => {
    render(<Login CancelLogin={() => {}} OpenAccount={() => {}} SetEmail={() => {}} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByText('Login'));
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
});

// Test to check if an error message is shown for an empty password
test('shows error message for empty password', async () => {
    render(<Login CancelLogin={() => {}} OpenAccount={() => {}} SetEmail={() => {}} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@asu.edu' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '' } });
    fireEvent.click(screen.getByText('Login'));
    expect(await screen.findByText('Please enter a password.')).toBeInTheDocument();
});