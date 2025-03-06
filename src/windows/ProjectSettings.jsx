import React, { useEffect, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import InputLabel from '../components/InputLabel.jsx';
import { DropdownSelector } from '../components/FormFields.jsx';
import { AiFillDelete } from 'react-icons/ai';
import {
    getProjectFields,
    updateDocInCollection,
    addMemberToProject,
    getDocumentIdByEmailAndProjectName,
    deleteProjectWithDocId,
} from '../utils/firestore.js';
import Button from '../components/Button.jsx';
import { notify, Type } from '../components/Notifier.jsx';
import { useAtomValue, useAtom } from 'jotai';
import { currentUserEmail, currentProjectName, allProjectNames } from '../utils/jotai.js';

export default function ProjectSettings({ CloseProjectSettings }) {
    // State definitions
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [documentId, setDocumentId] = useState(null);
    const [newMemberSelectedRole, setNewMemberSelectedRole] = useState('Select Role');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectName, setProjectName] = useAtom(currentProjectName);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [projectNames, setProjectNames] = useAtom(allProjectNames);
    const userEmail = useAtomValue(currentUserEmail);

    // Fetch document ID when project name is available
    useEffect(() => {
        let isMounted = true;
        console.log('fetching doc ID for project:', projectName);

        const fetchDocId = async () => {
            try {
                const docId = await getDocumentIdByEmailAndProjectName(userEmail, projectName);
                console.log('got doc ID:', docId);
                if (docId && isMounted) {
                    setDocumentId(docId);
                } else if (isMounted) {
                    console.error('No document ID found for project:', projectName);
                    notify(Type.error, 'Project not found');
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching doc ID:', err);
                    notify(Type.error, 'Error loading project');
                }
            }
        };

        if (projectName) {
            fetchDocId();
        }

        return () => { isMounted = false; };
    }, [projectName]);

    // Fetch project data when document ID is available
    useEffect(() => {
        if (documentId) {
            console.log('documentId changed:', documentId);
            fetchProjectData();
        }
    }, [documentId]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            console.log('Fetching project data for:', projectName);

            const membersData = await getProjectFields(projectName, [
                'contributors',
                'admins',
                'owners',
            ]);

            if (membersData) {
                console.log('In if(membersData');
                const { contributors = [], admins = [], owners = [] } = membersData;
                const updatedMembers = [
                    ...contributors.map((email) => ({ email, role: 'Contributor' })),
                    ...admins.map((email) => ({ email, role: 'Admin' })),
                    ...owners.map((email) => ({ email, role: 'Owner' })),
                ];

                updatedMembers.sort((a, b) => {
                    const rolePriority = { Owner: 1, Admin: 2, Contributor: 3 };
                    if (rolePriority[a.role] !== rolePriority[b.role]) {
                        return rolePriority[a.role] - rolePriority[b.role];
                    }
                    return a.email.localeCompare(b.email);
                });

                console.log('Setting members:', updatedMembers);
                setMembers(updatedMembers);

                const currUser = updatedMembers.find((member) => member.email === userEmail);
                const isUserOwner = owners.includes(userEmail);
                const isUserAdmin = admins.includes(userEmail);
                setIsOwner(isUserOwner);
                setCanEdit(isUserOwner || isUserAdmin);
                setIsAuthorized(!!currUser);
            }
        } catch (err) {
            console.error('Error fetching project data:', err);
            notify(Type.error, 'Failed to fetch project data');
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    };

    // Update member roles only when not initial load
    useEffect(() => {
        if (!isInitialLoad && members.length > 0) {
            updateMemberRole();
        }
    }, [members, isInitialLoad, documentId]);

    async function updateMemberRole() {
        try {
            if (!documentId) {
                console.error('No document ID available');
                return;
            }

            // Create arrays for each role, allowing users to have multiple roles
            const contributors = members
                .filter((member) => member.role === 'Contributor')
                .map((member) => member.email);
            const admins = members
                .filter((member) => member.role === 'Admin')
                .map((member) => member.email);
            const owners = members
                .filter((member) => member.role === 'Owner')
                .map((member) => member.email);

            // Ensure at least one owner
            if (owners.length === 0) {
                notify(Type.error, 'Project must have at least one owner');
                await fetchProjectData();
                return;
            }

            const updatedData = { contributors, admins, owners };
            const success = await updateDocInCollection('Projects', documentId, updatedData);

            if (!success) {
                console.error('updateDocInCollection returned false');
                notify(Type.error, 'Failed to update member roles');
                await fetchProjectData();
            }
        } catch (error) {
            console.error('Error updating roles:', error);
            notify(Type.error, 'Failed to update member roles');
            await fetchProjectData();
        }
    }

    async function addMember() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!newMemberEmail || newMemberEmail.length === 0) {
            notify(Type.error, 'Please enter member email.');
            return;
        }
        if (!emailRegex.test(newMemberEmail)) {
            notify(Type.error, 'Please enter a valid email address.');
            return;
        }
        if (newMemberSelectedRole === 'Select Role') {
            notify(Type.error, 'Please select a role.');
            return;
        }

        // Check permissions for role assignment
        if (newMemberSelectedRole === 'Owner' && !isOwner) {
            notify(Type.error, 'Only owners can add new owners');
            return;
        }

        if (newMemberSelectedRole === 'Admin' && !isOwner) {
            notify(Type.error, 'Only owners can add new admins');
            return;
        }

        // Check if member already exists in any role
        const existingMember = members.find(member => member.email === newMemberEmail);
        if (existingMember) {
            notify(Type.error, `Member ${newMemberEmail} already exists with role ${existingMember.role}`);
            return;
        }

        try {
            await addMemberToProject(
                documentId,
                newMemberSelectedRole.toLowerCase() + 's',
                newMemberEmail,
            );
            await fetchProjectData();

            // Reset fields only on success
            setNewMemberEmail('');
            setNewMemberSelectedRole('Select Role');
            notify(Type.success, `Added ${newMemberEmail} as ${newMemberSelectedRole}`);
        } catch (error) {
            notify(Type.error, 'Failed to add member');
        }
    }

    async function saveChanges() {
        try {
            await updateDocInCollection('Projects', documentId, { project_name: projectName });
            setProjectName(projectName);
            notify(Type.success, 'Project updated successfully');
            CloseProjectSettings();
        } catch (error) {
            notify(Type.error, 'Failed to update project');
        }
    }


    async function deleteProject() {
        if (!isOwner) {
            notify(Type.error, 'Only project owners can delete the project');
            return;
        }

        if (!documentId) {
            notify(Type.error, 'Project not found');
            return;
        }

        try {
            setLoading(true);

            const deleted = await deleteProjectWithDocId(documentId);

            if (deleted) {
                notify(Type.success, 'Project deleted successfully');
                const tempProjectNames = (projectNames.filter((name) => name !== projectName));
                setProjectNames(tempProjectNames);
                setProjectName(tempProjectNames[0] || '');
                CloseProjectSettings();
            }

        } catch (error) {
            console.error('Error deleting project:', error);
            notify(Type.error, 'Failed to delete project: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    // Confirmation dialog for project deletion
    if (showDeleteConfirm) {
        return (
            <WindowWrapper
                header="Confirm Delete Project"
                onLeftButton={() => setShowDeleteConfirm(false)}
                onRightButton={deleteProject}
                leftButtonText="Cancel"
                rightButtonText="Delete Project"
            >
                <div className="p-5 space-y-4">
                    <p className="text-red-500 font-bold">Are you sure you want to delete this project?</p>
                    <p>This will permanently delete:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>All project data</li>
                        <li>All tabs and their contents</li>
                        <li>All member associations</li>
                    </ul>
                    <p className="font-bold">This action cannot be undone.</p>
                    {loading && <p className="text-yellow-500">Deleting project... Please wait...</p>}
                </div>
            </WindowWrapper>
        );
    }

    const renderMembersList = () => {
        console.log('Rendering members list with:', members);
        if (!members || members.length === 0) {
            return <div>No members found</div>;
        }

        return members.map((member, index) => (
            <div key={index} className="flex items-center space-x-4 p-2">
                {canEdit && (
                    <button
                        className="text-red-500 font-bold"
                        onClick={() => removeMember(member.email, member.role)}
                    >
                        <AiFillDelete />
                    </button>
                )}
                <span className="flex-grow">{member.email}</span>
                {canEdit ? (
                    <DropdownSelector
                        options={['Owner', 'Admin', 'Contributor']}
                        selection={member.role}
                        setSelection={(newRole) => {
                            if (member.role === 'Owner' && !isOwner) {
                                notify(Type.error, 'Only project owners can modify owner roles');
                                return;
                            }
                            const updatedMembers = members.map((m) => {
                                if (m.email === member.email) {
                                    return { ...m, role: newRole };
                                }
                                return m;
                            });
                            setMembers(updatedMembers);
                        }}
                    />
                ) : (
                    <span className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">{member.role}</span>
                )}
            </div>
        ));
    };

    return (
        <WindowWrapper
            header={`Manage ${projectName} Project`}
            onLeftButton={CloseProjectSettings}
            onRightButton={canEdit ? saveChanges : undefined}
            leftButtonText="Close"
            rightButtonText={canEdit ? "Save Project" : undefined}
        >
            <div className="flex flex-col space-y-4 p-5 text-neutral-900 dark:text-white">
                {/* Project Name Input */}
                <InputLabel
                    label="Project Name"
                    layout="horizontal-single"
                    input={
                        <input
                            type="text"
                            className="border rounded px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            disabled={!canEdit}
                        />
                    }
                />

                {/* Members List */}
                <div>
                    <h3 className="font-semibold">Members</h3>
                    <div className="space-y-2">
                        {renderMembersList()}
                    </div>
                </div>

                {/* Add new member section - only visible to admins/owners */}
                {canEdit && (
                    <div>
                        <h3 className="font-semibold">Add a new Member:</h3>
                        <InputLabel
                            label="Member Email"
                            layout="horizontal-single"
                            input={
                                <input
                                    type="text"
                                    className="border rounded px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                />
                            }
                        />
                        <br />
                        <InputLabel
                            label="Member Role"
                            layout="horizontal-single"
                            input={
                                <select
                                    className="border rounded px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={newMemberSelectedRole}
                                    onChange={(e) => setNewMemberSelectedRole(e.target.value)}
                                >
                                    <option value="Select Role">Select Role</option>
                                    <option value="Contributor">Contributor</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Owner">Owner</option>
                                </select>
                            }
                        />
                        <br />
                        <div className="flex justify-end mt-4">
                            <Button text="Add member" onClick={addMember} />
                        </div>
                    </div>
                )}

                {/* Edit Tabs Button */}
                {canEdit && (
                    <div className="flex justify-end mt-4">
                        <Button
                           text="Edit Tab"
                        />
                    </div>
                )}

                {/* Delete Tabs Button */}
                {canEdit && (
                    <div className="flex justify-end mt-4">
                        <Button
                           text="Delete Tab"
                        />
                    </div>
                )}


                {/* Delete Project Button (Only shown to owners) */}
                {isOwner && (
                    <div className="flex justify-end mt-4">
                        <Button
                            text="Delete Project"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-red-600 hover:bg-red-700"
                        />
                    </div>
                )}
            </div>
        </WindowWrapper>
    );
}