import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import NewAccount from './NewAccount';
import { accountExists, createAccount } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';

// Mock the firestore functions
jest.mock('../utils/firestore');
jest.mock('../components/Notifier');

describe('NewAccount', () => {
    beforeEach(() => {
        accountExists.mockClear();
        createAccount.mockClear();
        notify.mockClear();
    });

    // Test to check if the NewAccount component renders correctly
    test('renders NewAccount component', () => {
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    // Test to check if an error message is shown for empty name
    test('shows error message for empty name', async () => {
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Please enter a name.');
        });
    });

    // Test to check if an error message is shown for invalid email
    test('shows error message for invalid email', async () => {
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Please enter a valid email address.');
        });
    });

    // Test to check if an error message is shown for invalid password
    test('shows error message for invalid password', async () => {
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } });
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Password must be at least 8 characters long and include at least one number and one special character.');
        });
    });

    // Test to check if an error message is shown for non-matching passwords
    test('shows error message for non-matching passwords', async () => {
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password2!' } });
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Passwords do not match.');
        });
    });

    // Test to check if an error message is shown when account already exists
    test('shows error message when account already exists', async () => {
        accountExists.mockResolvedValue(true);
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } });
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Account already exists.');
        });
    });

    // Test to check if account is created successfully
    test('creates account successfully', async () => {
        accountExists.mockResolvedValue(false);
        createAccount.mockResolvedValue(true);
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        
        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } });
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.success, 'Account created successfully.');
        });
    });

    // Test to check if an error message is shown when failing to create account
    test('shows error message when failing to create account', async () => {
        accountExists.mockResolvedValue(false);
        createAccount.mockResolvedValue(false);
        render(<NewAccount CancelAccount={() => {}} OpenNewAccount={() => {}} SetEmail={() => {}} />);
        
        fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } });
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Failed to create account.');
        });
    });
});