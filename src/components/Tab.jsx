import classNames from 'classnames';
import React from 'react';

export default function Tab({ text, active, onClick }) {
    const background = classNames({
        'bg-white dark:bg-neutral-950': active,
        'bg-neutral-200 dark:bg-neutral-800': !active,
    });
    const containerClasses = classNames(
        background,
        'max-w-fit flex py-2 px-4 rounded-t-2xl text-lg items-center item cursor-pointer hover:border-asu-gold border-transparent border-b-2',
        { 'active:bg-neutral-300 dark:active:bg-neutral-600': active }
    );

    return (
        <div className={containerClasses} onClick={onClick}>
            {[
                <div key="text">{text}</div>,
            ]}
        </div>
    );
}