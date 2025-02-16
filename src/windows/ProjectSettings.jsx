import React, { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { currentProjectName, currentUserEmail } from '../utils/jotai.js';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import InputLabel from '../components/InputLabel.jsx';
import { AiFillDelete } from 'react-icons/ai';
import { getProjectFields, updateDocInCollection, addMemberToProject, getDocumentIdByEmailAndProjectName } from '../utils/firestore.js';
import Button from '../components/Button.jsx';
import { notify, Type } from '../components/Notifier.jsx';
import { updateProjectName } from '../components/TabBar.jsx';

export default function ProjectSettings({ CloseProjectSettings }) {
    // Jotai State
    const [projectName, setProjectName] = useAtom(currentProjectName);
    const userEmail = useAtomValue(currentUserEmail);

    // Local State
    const [documentId, setDocumentId] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [members, setMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberSelectedRole, setNewMemberSelectedRole] = useState('Select Role');
    const [loading, setLoading] = useState(true);

    // Fetch Project Data on Mount
    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                setLoading(true);

                // Fetch Document ID
                const docId = await getDocumentIdByEmailAndProjectName(userEmail, projectName);
                if (!docId) {
                    notify(Type.error, 'Project not found');
                    setLoading(false);
                    return;
                }
                setDocumentId(docId);

                // Fetch Project Members
                const membersData = await getProjectFields(projectName, ['contributors', 'admins', 'owners']);
                console.log('Members:', membersData);
                if (!membersData) {
                    notify(Type.error, 'Failed to load project data');
                    setLoading(false);
                    return;
                }

                const formattedMembers = formatMembers(membersData);
                setMembers(formattedMembers);

                // Determine User Authorization
                const userRole = getUserRole(membersData, userEmail);
                setIsAuthorized(userRole === 'Owner' || userRole === 'Admin');

            } catch (error) {
                console.error('Error loading project:', error);
                notify(Type.error, 'Error loading project');
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();
    }, [projectName, userEmail]);

    // Helper Functions
    const formatMembers = (membersData) => {
        const { contributors = [], admins = [], owners = [] } = membersData;
        return [
            ...contributors.map((email) => ({ email, role: 'Contributor' })),
            ...admins.map((email) => ({ email, role: 'Admin' })),
            ...owners.map((email) => ({ email, role: 'Owner' })),
        ].sort((a, b) => {
            const rolePriority = { Owner: 1, Admin: 2, Contributor: 3 };
            return rolePriority[a.role] - rolePriority[b.role] || a.email.localeCompare(b.email);
        });
    };

    const getUserRole = (membersData, userEmail) => {
        if (!userEmail) return 'None';
        if (membersData.owners?.includes(userEmail)) return 'Owner';
        if (membersData.admins?.includes(userEmail)) return 'Admin';
        return 'None';
    };

    const handleAddMember = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!newMemberEmail || !emailRegex.test(newMemberEmail)) {
            notify(Type.error, 'Please enter a valid member email.');
            return;
        }
        if (newMemberSelectedRole === 'Select Role') {
            notify(Type.error, 'Please select a role.');
            return;
        }

        try {
            await addMemberToProject(documentId, newMemberSelectedRole.toLowerCase() + 's', newMemberEmail);
            setNewMemberEmail('');
            setNewMemberSelectedRole('Select Role');
            notify(Type.success, `Added ${newMemberEmail} as ${newMemberSelectedRole}`);
            setMembers(await getProjectFields(projectName, ['contributors', 'admins', 'owners'])); // Refresh members
        } catch (error) {
            notify(Type.error, 'Failed to add member');
            console.log("ERROR", error);
        }
    };

    const handleSaveChanges = async () => {
        try {
            await updateDocInCollection('Projects', documentId, { project_name: projectName });
            updateProjectName(projectName);
            notify(Type.success, 'Project updated successfully');
        } catch (error) {
            notify(Type.error, 'Failed to update project');
        }
    };

    const handleRemoveMember = async (email, role) => {
        if (role === 'Owner') {
            notify(Type.error, 'Cannot remove an owner from the project.');
            return;
        }

        try {
            const field = role.toLowerCase() + 's';
            const updatedMembers = members
                .filter((member) => member.email !== email || member.role !== role)
                .filter((member) => member.role.toLowerCase() + 's' === field)
                .map((member) => member.email);

            await updateDocInCollection('Projects', documentId, { [field]: updatedMembers });

            setMembers((prev) => prev.filter((member) => member.email !== email || member.role !== role));
            notify(Type.success, `${email} has been removed as a ${role}.`);
        } catch (error) {
            notify(Type.error, `Failed to remove ${email}.`);
        }
    };

    if (loading) return <div>Loading project settings...</div>;

    if (!isAuthorized) {
        return (
            <WindowWrapper header={`Manage ${projectName} Project`} onLeftButton={CloseProjectSettings} leftButtonText="Close">
                <div className="p-5">
                    <p>You do not have permission to view this page.</p>
                    <p>You must be the project owner or an administrator.</p>
                </div>
            </WindowWrapper>
        );
    }

    return (
        <WindowWrapper
            header={`Manage ${projectName} Project`}
            onLeftButton={CloseProjectSettings}
            onRightButton={handleSaveChanges()}
            leftButtonText="Close"
            rightButtonText="Save Project"
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
                        />
                    }
                />

                {/* Members List */}
                <div>
                    <h3 className="font-semibold">Members</h3>
                    <div className="space-y-4">
                        {members && Object.keys(members).length > 0 ? (
                            Object.keys(members).map((role) => (
                                <div key={role}>
                                    <h4 className="font-semibold">{role.charAt(0).toUpperCase() + role.slice(1)}</h4>
                                    <div className="space-y-2">
                                        {Array.isArray(members[role]) && members[role].map((email) => (
                                            <div key={email} className="flex items-center space-x-4 p-2">
                                                <button className="text-red-500 font-bold" onClick={() => handleRemoveMember(email, role)}>
                                                    <AiFillDelete />
                                                </button>
                                                <span className="flex-grow">{email}</span>
                                                <span className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">
                                    {role.charAt(0).toUpperCase() + role.slice(1, -1)}
                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>No members found</div>
                        )}
                    </div>
                </div>


                {/* Add new member section - only visible to admins/owners */}
                {<div>
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
                        <Button text="Add member" onClick={handleAddMember()} />
                    </div>
                </div>
                }

                {/* Delete Project Button (Only shown to owners) */}

                <div className="flex justify-end mt-4">
                    <Button
                        text="Delete Project"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 hover:bg-red-700"
                    />
                </div>

            </div>
        </WindowWrapper>
    );
}
