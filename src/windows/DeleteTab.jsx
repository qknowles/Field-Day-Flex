import React, { useState, useEffect } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import { deleteTab, getTabNames } from '../utils/firestore';
import { useAtom, useAtomValue } from 'jotai';
import { currentProjectName, allTableNames, currentUserEmail } from '../utils/jotai';
import { notify, Type } from '../components/Notifier';
import Button from '../components/Button';

export default function DeleteTab({ CloseDeleteTab }) {
    const projectName = useAtomValue(currentProjectName);
    const email = useAtomValue(currentUserEmail);
    const [tabNames, setTabNames] = useAtom(allTableNames);
    const [selectedTab, setSelectedTab] = useState('');

    useEffect(() => {
        if (!tabNames.length) {
            (async () => {
                const tabs = await getTabNames(email, projectName);
                setTabNames(tabs);
            })();
        }
    }, [email, projectName, setTabNames, tabNames]);

    const handleDelete = async () => {
        if (!selectedTab) {
            notify(Type.error, 'Please select a tab to delete.');
            return;
        }

        try {
            const success = await deleteTab(projectName, selectedTab, email);
            if (success) {
                const updatedTabs = await getTabNames(email, projectName);
                setTabNames(updatedTabs);
                notify(Type.success, `Tab "${selectedTab}" deleted successfully.`);
                CloseDeleteTab();
                window.location.reload();
            } else {
                notify(Type.error, `Failed to delete tab "${selectedTab}".`);
            }
        } catch (error) {
            console.error('Error deleting tab:', error);
            notify(Type.error, `Error deleting tab "${selectedTab}".`);
        }
    };

    return (
        <WindowWrapper
            header="Delete Tab"
            onLeftButton={CloseDeleteTab}
            onRightButton={handleDelete}
            leftButtonText="Cancel"
            //rightButtonText="Delete"
        >
            <div className="p-4 w-80 max-w-[300px] mx-auto space-y-4">
                {/* Dropdown to select tab */}
                <label className="block text-sm font-medium">Select Tab to Delete</label>
                <select
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    className="border rounded px-2 py-1 w-full bg-white dark:bg-neutral-800"
                >
                    <option value="" disabled>Select a tab</option>
                    {tabNames.map((tab) => (
                        <option key={tab} value={tab}>
                            {tab}
                        </option>
                    ))}
                </select>

                {/* Delete Button */}
                <Button text="Delete Tab" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 w-full" />
            </div>
        </WindowWrapper>
    );
}
