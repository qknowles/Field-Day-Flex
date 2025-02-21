import toast, { Toaster } from 'react-hot-toast';
import React from 'react';

const Type = {
    error: 0,
    success: 1,
    plain: 2,
};

const style = {
    padding: '8px',
};

const config = {
    duration: 3000,
    style: style,
};

const notify = (type, text) => {
    switch (type) {
        case Type.error:
            toast.error(text, config);
            return;
        case Type.success:
            toast.success(text, config);
            return;
        default:
            toast(text, config);
            return;
    }
};

function Notifier() {
    return (
        <Toaster
            position="bottom-center"
            toastOptions={{
                // this is purely to make sure no modals or other site components are displayed
                // above the notifications. Had some issues with this prior.
                style: {
                    zIndex: 1000,
                },
            }}
        />
    );
}

export { notify, Notifier, Type };
