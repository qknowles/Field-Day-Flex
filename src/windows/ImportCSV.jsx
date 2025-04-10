import React, { useRef, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import { Type, notify } from '../components/Notifier.jsx';
import InputLabel from '../components/InputLabel.jsx';
import { } from '../utils/firestore';
import { useAtom } from 'jotai';
import { currentUserEmail } from '../utils/jotai.js';
import Button from '../components/Button';
import SelectImportColumn from './SelectImportColumns.jsx';

export default function ImportCSV({ CloseImportWindow }) {
    const [email, setEmail] = useAtom(currentUserEmail);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState([]);

    const importCSV = async () => {

    }

    return (
        <>
            {showColumnSelector && (
                <SelectImportColumn
                    CloseColumnSelector={() => setShowColumnSelector(false)}
                    Columns={['a', 'b']}
                    SetSelectedColumns={setSelectedColumns}
                />
            )}

            {!showColumnSelector && (
                <WindowWrapper
                    header="Import CSV to tab"
                    onLeftButton={CloseImportWindow}
                    onRightButton={importCSV}
                    leftButtonText="Back"
                    rightButtonText="Import"
                >
                    <div className="flex justify-between items-center px-4 py-1 mb-2 rounded bg-neutral-200 dark:bg-neutral-800">
                        <label className="text-black dark:text-white">
                            This will contain important information for the user.
                        </label>
                    </div>

                    <div className="flex items-center pt-5 space-x-2">
                        <Button
                            onClick={() => setShowColumnSelector(true)}
                            text="Select file to import"
                            enabled={true}
                        />


                        <label className="text-black dark:text-white pl-5">
                            File:
                        </label>

                        <div className="flex items-center px-5 py-1 rounded bg-neutral-200 dark:bg-neutral-800">
                            <label className="text-black dark:text-white">
                                Example.csv
                            </label>
                        </div>

                    </div>

                </WindowWrapper>
            )}
        </>
    );
}
