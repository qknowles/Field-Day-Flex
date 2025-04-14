import React, { useRef, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import { Type, notify } from '../components/Notifier.jsx';
import { addEntryBulk } from '../utils/firestore';
import { useAtom } from 'jotai';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';
import Button from '../components/Button';
import SelectImportColumn from './SelectImportColumns.jsx';

export default function ImportCSV({ CloseImportWindow, onEntryUpdated }) {
    const [email] = useAtom(currentUserEmail);
    const [projectName] = useAtom(currentProjectName);
    const [tabName] = useAtom(currentTableName);

    const [selectedFileName, setSelectedFileName] = useState("No file selected");
    const fileInputRef = useRef(null);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columnOptions, setColumnOptions] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [file, setFile] = useState(null);

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        if (selectedFile) {
            setSelectedFileName(selectedFile.name);
            loadCSV(selectedFile);
        }
    };

    const openFileDialog = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const loadCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/\r?\n/);
            if (lines.length > 0) {
                const headerLine = lines[0];
                const columns = headerLine.split(',').map((col) => col.trim());
                setColumnOptions(columns);
                setSelectedColumns(columns);
                setShowColumnSelector(true);
                notify(Type.success, "CSV file imported successfully. Columns extracted.");
            } else {
                notify(Type.error, "CSV file is empty.");
            }
        };
        reader.onerror = () => {
            notify(Type.error, "Error reading the file. Please try again.");
        };
        reader.readAsText(file);
    };

    const importCSV = async () => {
        if (!file) {
            notify(Type.error, "Please select a CSV file before importing.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/);
                if (lines.length < 2) {
                    notify(Type.error, "CSV file has no data rows to import.");
                    return;
                }

                const header = lines[0]
                    .split(',')
                    .map((col) => col.trim());

                const selectedColumnsInfo = header
                    .map((col, idx) => ({ col, idx }))
                    .filter((item) => selectedColumns.includes(item.col));

                const entries = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const row = lines[i].split(',').map((field) => field.trim());
                    let entry = {};
                    selectedColumnsInfo.forEach(({ col, idx }) => {
                        entry[col] = row[idx];
                    });
                    entries.push(entry);
                }

                console.log(projectName + " " + tabName + " " + email);
                const success = await addEntryBulk(projectName, tabName, email, ...entries);
                if (success) {
                    notify(Type.success, "CSV data imported successfully.");
                    if (onEntryUpdated) {
                        await onEntryUpdated();
                    }
                    CloseImportWindow();
                } else {
                    notify(Type.error, "Error importing CSV data.");
                }
            } catch (error) {
                console.error("Error during CSV import:", error);
                notify(Type.error, "An unexpected error occurred during CSV import.");
            }
        };

        reader.onerror = () => {
            notify(Type.error, "Error reading the CSV file for import.");
        };

        reader.readAsText(file);
    };

    return (
        <>
            {showColumnSelector && (
                <SelectImportColumn
                    CloseColumnSelector={() => setShowColumnSelector(false)}
                    Columns={columnOptions}
                    SelectedColumns={selectedColumns}
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

                    <div className="flex items-center py-5 space-x-2">
                        <Button
                            onClick={openFileDialog}
                            text={"Select file to import"}
                            disabled={false}
                        />

                        <label className="text-black dark:text-white pl-5">
                            File:
                        </label>

                        <div className="flex items-center px-5 py-1 rounded bg-neutral-200 dark:bg-neutral-800">
                            <label className="text-black dark:text-white">
                                {selectedFileName}
                            </label>
                        </div>
                    </div>

                    <Button
                        onClick={() => { setShowColumnSelector(true); }}
                        text={"Select columns from CSV"}
                        disabled={selectedFileName === 'No file selected'}
                    />

                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                </WindowWrapper>
            )}
        </>
    );
}
