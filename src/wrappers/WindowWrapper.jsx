import Button from '../components/Button';
import { AnimatePresence, motion } from 'framer-motion';
import { windowVariant } from '../utils/variants';
import React from 'react';

export default function WindowWrapper({
    header,
    onLeftButton,
    onRightButton,
    leftButtonText,
    rightButtonText,
    children,
}) {
    return (
        <motion.div
            className="relative z-50"
            aria-labelledby="modal-header"
            role="dialog"
            aria-modal="true"
        >
            <AnimatePresence>
                    <WindowOverlay key="window-overlay" />
                    <motion.div
                        className="fixed inset-0 backdrop-blur-sm"
                        key="modal"
                        variants={windowVariant}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <WindowBuffer>
                            <ContentWrapper>
                                <WindowHeader header={header} />
                                <div className="bg-neutral-100 dark:bg-neutral-700 flex-shrink-0 h-window-bar" />
                                <div className="flex-grow overflow-auto">
                                    <div className="flex-col space-y-1 h-window-content">
                                        <div className="p-4">
                                            <WindowContent>{children}</WindowContent>
                                        </div>
                                    </div>
                                </div>

                                <WindowFooter>
                                    {leftButtonText && (
                                        <Button
                                            key="left-button"
                                            onClick={() => onLeftButton?.()}
                                            text={leftButtonText}
                                            enabled={true}
                                        />
                                    )}
                                    {rightButtonText && (
                                        <Button
                                            key="right-button"
                                            onClick={() => onRightButton?.()}
                                            text={rightButtonText}
                                            enabled={true}
                                        />
                                    )}
                                </WindowFooter>
                            </ContentWrapper>
                        </WindowBuffer>
                    </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

function WindowOverlay() {
    return (
        <motion.div
            className="fixed inset-0 bg-neutral-300 dark:bg-neutral-800 opacity-0"
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
        />
    );
}

function WindowBuffer({ children }) {
    return <div className="flex h-full justify-center text-center items-center">{children}</div>;
}

function ContentWrapper({ children }) {
    return (
        <div className="relative overflow-hidden rounded-lg bg-white dark:bg-neutral-950 text-left shadow-xl max-w-full-modal-width">
            {children}
        </div>
    );
}

function WindowHeader({ header }) {
    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 p-3">
            <h1 className="text-2xl p-2">{header}</h1>
        </div>
    );
}

function WindowContent({ children }) {
    return (
        <div className="bg-white dark:bg-neutral-950 max-h-full-modal-content-height overflow-auto p-2">
            {children}
        </div>
    );
}

function WindowFooter({ children }) {
    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 p-4 flex justify-between space-x-5">
            {children}
        </div>
    );
}
