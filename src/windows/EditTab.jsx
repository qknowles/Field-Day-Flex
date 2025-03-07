import React, { useState, useEffect } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import { updateTabName, getTabNames } from '../utils/firestore';
import { useAtom, useAtomValue } from 'jotai';
import { currentProjectName, allTableNames, currentUserEmail } from '../utils/jotai';
import { notify, Type } from '../components/Notifier';
import Button from '../components/Button';

export default function EditTab({ CloseEditTab }) {
    const projectName = useAtomValue(currentProjectName);
    const email = useAtomValue(currentUserEmail);
    const [tabNames, setTabNames] = useAtom(allTableNames);

    const [tabsToRename, setTabsToRename] = useState([{ tab: tabNames[0] || '', newName: '' }]); 
    useEffect(() => {
        if (!tabNames.length) {
            (async () => {
                const tabs = await getTabNames(email, projectName);
                setTabNames(tabs);
            })();
        }
    }, [email, projectName, setTabNames, tabNames]);

    const handleTabChange = (index, value) => {
        const updatedTabs = [...tabsToRename];
        updatedTabs[index].tab = value;
        setTabsToRename(updatedTabs);
    };

    const handleNameChange = (index, value) => {
        const updatedTabs = [...tabsToRename];
        updatedTabs[index].newName = value;
        setTabsToRename(updatedTabs);
    };

    const addAnotherRename = () => {
        const availableTabs = tabNames.filter(
            (tab) => !tabsToRename.some((entry) => entry.tab === tab)
        );

        if (availableTabs.length > 0) {
            setTabsToRename([...tabsToRename, { tab: availableTabs[0], newName: '' }]);
        } else {
            notify(Type.error, 'No more tabs left to rename.');
        }
    };

    const saveTabNames = async () => {
        let successCount = 0;

        for (const { tab, newName } of tabsToRename) {
            if (!newName.trim()) {
                notify(Type.error, `New name for "${tab}" cannot be empty.`);
                return;
            }

            try {
                const success = await updateTabName(projectName, tab, newName, email);

                if (success) {
                    successCount++;
                } else {
                    notify(Type.error, `Failed to update "${tab}".`);
                }
            } catch (error) {
                console.error(`Error updating tab "${tab}":`, error);
                notify(Type.error, `Error renaming "${tab}".`);
            }
        }

        if (successCount > 0) {
            const updatedTabs = await getTabNames(email, projectName);
            setTabNames(updatedTabs);
            notify(Type.success, `Renamed ${successCount} tab(s) successfully.`);
            CloseEditTab();
        }
    };

    return (
        <WindowWrapper
            header="Edit Tab Names"
            onLeftButton={CloseEditTab}
            onRightButton={saveTabNames}
            leftButtonText="Cancel"
            rightButtonText="Save"
        >
            <div className="p-4 w-80 max-w-[300px] mx-auto space-y-4">
                {tabsToRename.map((entry, index) => (
                    <div key={index} className="space-y-2">
                        {/* Dropdown to select tab */}
                        <label className="block text-sm font-medium">Select Tab</label>
                        <select
                            value={entry.tab}
                            onChange={(e) => handleTabChange(index, e.target.value)}
                            className="border rounded px-2 py-1 w-full bg-white dark:bg-neutral-800"
                        >
                            {tabNames.map((tab) => (
                                <option key={tab} value={tab} disabled={tabsToRename.some((t) => t.tab === tab && t !== entry)}>
                                    {tab}
                                </option>
                            ))}
                        </select>

                        {/* Input field for new tab name */}
                        <label className="block text-sm font-medium">New Tab Name</label>
                        <input
                            type="text"
                            className="border rounded px-2 py-1 w-full"
                            placeholder="Enter new tab name"
                            value={entry.newName}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                        />
                    </div>
                ))}

                {/* Button to add another rename */}
                {tabNames.length > tabsToRename.length && (
                    <Button text="Rename Another Tab" onClick={addAnotherRename} />
                )}
            </div>
        </WindowWrapper>
    );
}
