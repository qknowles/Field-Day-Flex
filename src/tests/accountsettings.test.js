import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AccountSettings from './AccountSettings';
import { verifyPassword, getUserName, updateDocInCollection } from '../utils/firestore';
import { Type, notify } from '../components/Notifier';

// Mock the firestore functions
jest.mock('../utils/firestore');
jest.mock('../components/Notifier');

describe('AccountSettings', () => {
    const emailProp = 'test@example.com';

    beforeEach(() => {
        verifyPassword.mockClear();
        getUserName.mockClear();
        updateDocInCollection.mockClear();
        notify.mockClear();
    });

    // Test to check if the AccountSettings component renders correctly
    test('renders AccountSettings component', () => {
        render(<AccountSettings CloseAccountSettings={() => {}} emailProp={emailProp} />);
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    // Test to check if an error message is shown for incorrect current password
    test('shows error message for incorrect current password', async () => {
        verifyPassword.mockResolvedValue(false);
        render(<AccountSettings CloseAccountSettings={() => {}} emailProp={emailProp} />);
        
        fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'wrongpassword' } });
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Incorrect password');
        });
    });

    // Test to check if an error message is shown for invalid new password
    test('shows error message for invalid new password', async () => {
        verifyPassword.mockResolvedValue(true);
        getUserName.mockResolvedValue('Test User');
        render(<AccountSettings CloseAccountSettings={() => {}} emailProp={emailProp} />);
        
        fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'correctpassword' } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'short' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'short' } });
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Password must be at least 8 characters long and include at least one number and one special character.');
        });
    });

    // Test to check if changes are saved successfully
    test('saves changes successfully', async () => {
        verifyPassword.mockResolvedValue(true);
        getUserName.mockResolvedValue('Test User');
        updateDocInCollection.mockResolvedValue(true);
        render(<AccountSettings CloseAccountSettings={() => {}} emailProp={emailProp} />);
        
        fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'correctpassword' } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPassword1!' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'NewPassword1!' } });
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.success, 'Changes saved successfully');
        });
    });

    // Test to check if an error message is shown when failing to save changes
    test('shows error message when failing to save changes', async () => {
        verifyPassword.mockResolvedValue(true);
        getUserName.mockResolvedValue('Test User');
        updateDocInCollection.mockResolvedValue(false);
        render(<AccountSettings CloseAccountSettings={() => {}} emailProp={emailProp} />);
        
        fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'correctpassword' } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPassword1!' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'NewPassword1!' } });
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(notify).toHaveBeenCalledWith(Type.error, 'Failed to save changes');
        });
    });
});