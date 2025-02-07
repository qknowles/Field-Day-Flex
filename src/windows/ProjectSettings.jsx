import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { currentProjectName } from '../utils/jotai';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import InputLabel from '../components/InputLabel.jsx';
import { DropdownSelector } from '../components/FormFields.jsx';
import { AiFillDelete } from 'react-icons/ai';
import {
    getProjectFields,
    updateDocInCollection,
    addMemberToProject,
    getDocumentIdByProjectName,
} from '../utils/firestore.js';
import Button from '../components/Button.jsx';
import { notify, Type } from '../components/Notifier.jsx';
import { updateProjectName } from '../components/TabBar.jsx';

export default function ProjectSettings({
    projectNameProp = 'NoNamePassed',
    CloseProjectSettings,
    emailProp,
}) {
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

    // Initialize project name from prop
    useEffect(() => {
        if (projectNameProp && projectName !== projectNameProp) {
            console.log('initializing with projectNameProp:', projectNameProp);
            setProjectName(projectNameProp);
        }
    }, [projectNameProp, projectName, setProjectName]);

    // Fetch document ID when project name is available
    useEffect(() => {
        let isMounted = true;
        console.log('fetching doc ID for project:', projectNameProp);
        
        const fetchDocId = async () => {
            try {
                const docId = await getDocumentIdByProjectName(projectNameProp);
                console.log('got doc ID:', docId);
                if (docId && isMounted) {
                    setDocumentId(docId);
                } else if (isMounted) {
                    console.error('No document ID found for project:', projectNameProp);
                    notify(Type.error, 'Project not found');
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching doc ID:', err);
                    notify(Type.error, 'Error loading project');
                }
            }
        };

        if (projectNameProp) {
            fetchDocId();
        }

        return () => { isMounted = false; };
    }, [projectNameProp]);

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
            
            const membersData = await getProjectFields(documentId, [
                'contributors',
                'admins',
                'owners',
            ]);

            if (membersData) {
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

                const currUser = updatedMembers.find((member) => member.email === emailProp);
                const isUserOwner = owners.includes(emailProp);
                const isUserAdmin = admins.includes(emailProp);
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
            setProjectName(projectName); // Update Jotai state
            updateProjectName(projectName); // Keep legacy support
            notify(Type.success, 'Project updated successfully');
            CloseProjectSettings();
        } catch (error) {
            notify(Type.error, 'Failed to update project');
        }
    }

    async function deleteProject() {
        try {
            if (!isOwner) {
                notify(Type.error, 'Only project owners can delete the project');
                return;
            }
            
            if (!documentId) {
                notify(Type.error, 'Project not found');
                return;
            }

            await updateDocInCollection('Projects', documentId, { 
                deleted: true,
                deletedAt: new Date().toISOString()
            });
            
            notify(Type.success, 'Project deleted successfully');
            CloseProjectSettings();
            // Force refresh project list
            window.location.reload();
        } catch (error) {
            console.error('Error deleting project:', error);
            notify(Type.error, 'Failed to delete project');
        }
    }

    async function removeMember(email, role) {
        // Check if trying to remove last owner
        if (role === 'Owner' && members.filter(m => m.role === 'Owner').length <= 1) {
            notify(Type.error, 'Cannot remove the last owner');
            return;
        }

        // Check if user has permission to modify owner roles
        if (role === 'Owner' && !isOwner) {
            notify(Type.error, 'Only project owners can modify owner roles');
            return;
        }

        try {
            const field = role.toLowerCase() + 's';
            const updatedFieldMembers = members
                .filter((member) => !(member.email === email && member.role === role))
                .filter((member) => member.role.toLowerCase() + 's' === field)
                .map((member) => member.email);

            const updateData = {
                [field]: updatedFieldMembers,
            };
            await updateDocInCollection('Projects', documentId, updateData);

            setMembers((prevMembers) =>
                prevMembers.filter((member) => !(member.email === email && member.role === role))
            );

            notify(Type.success, `${email} has been removed as a ${role}`);
        } catch (err) {
            notify(Type.error, `Failed to remove ${email}`);
        }
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