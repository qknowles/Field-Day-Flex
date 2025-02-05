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
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [documentId, setDocumentId] = useState(null);
    const [newMemberSelectedRole, setNewMemberSelectedRole] = useState('Select Role');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectName, setProjectName] = useAtom(currentProjectName);

    useEffect(() => {
        const fetchDocumentId = async () => {
            try {
                const docId = await getDocumentIdByProjectName(projectNameProp);
                setDocumentId(docId);
            } catch (err) {
                console.error(`Error fetching docId for project ${projectNameProp}`, err);
            }
        };

        fetchDocumentId();
    }, [projectNameProp]);

    useEffect(() => {
        if (documentId) {
            fetchProjectData();
        }
    }, [documentId]);

    useEffect(() => {
        updateMemberRole();
    }, [members]);

    const fetchProjectData = async () => {
        try {
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

                setMembers(updatedMembers);

                const currUser = updatedMembers.find((member) => member.email === emailProp);
                const isUserOwner = currUser && currUser.role === 'Owner';
                setIsOwner(isUserOwner);
                setIsAuthorized(currUser && (currUser.role === 'Owner' || currUser.role === 'Admin'));
            }
        } catch (err) {
            console.error('Error fetching project data:', err);
            notify(Type.error, 'Failed to fetch project data');
        }
    };

    async function addMember() {
        if (!newMemberEmail || newMemberEmail.length === 0) {
            notify(Type.error, 'Please enter member email.');
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

    async function updateMemberRole() {
        try {
            const contributors = members
                .filter((member) => member.role === 'Contributor')
                .map((member) => member.email);
            const admins = members
                .filter((member) => member.role === 'Admin')
                .map((member) => member.email);
            const owners = members
                .filter((member) => member.role === 'Owner')
                .map((member) => member.email);

            const updatedData = { contributors, admins, owners };
            const success = await updateDocInCollection('Projects', documentId, updatedData);

            if (!success) {
                notify(Type.error, 'Failed to update member roles');
            }
        } catch (error) {
            console.error('Error updating Firebase:', error);
            notify(Type.error, 'Failed to update member roles');
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
            await updateDocInCollection('Projects', documentId, { deleted: true });
            notify(Type.success, 'Project deleted successfully');
            CloseProjectSettings();
        } catch (error) {
            notify(Type.error, 'Failed to delete project');
        }
    }

    async function removeMember(email, role) {
        // Only owners can modify owner roles
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
                prevMembers.filter((member) => !(member.email === email && member.role === role)),
            );

            notify(Type.success, `${email} has been removed as a ${role}`);
        } catch (err) {
            notify(Type.error, `Failed to remove ${email}`);
        }
    }

    if (!documentId) {
        return <div>Loading project settings...</div>;
    }

    if (!isAuthorized) {
        return (
            <WindowWrapper
                header={`Manage ${projectNameProp} Project`}
                onLeftButton={CloseProjectSettings}
                leftButtonText="Close"
            >
                <div className="p-5">
                    <p>You do not have permission to view this page.</p>
                    <p>You must be the project owner or an administrator.</p>
                </div>
            </WindowWrapper>
        );
    }

    if (showDeleteConfirm) {
        return (
            <WindowWrapper
                header="Confirm Delete Project"
                onLeftButton={() => setShowDeleteConfirm(false)}
                onRightButton={deleteProject}
                leftButtonText="Cancel"
                rightButtonText="Delete Project"
            >
                <div className="p-5">
                    <p className="text-red-500 font-bold">Are you sure you want to delete this project?</p>
                    <p>This action cannot be undone.</p>
                </div>
            </WindowWrapper>
        );
    }

    return (
        <WindowWrapper
            header={`Manage ${projectNameProp} Project`}
            onLeftButton={CloseProjectSettings}
            onRightButton={saveChanges}
            leftButtonText="Cancel"
            rightButtonText="Save Project"
        >
            <div className="flex flex-col space-y-4 p-5">
                {/* Project Name Input */}
                <InputLabel
                    label="Project Name"
                    layout="horizontal-single"
                    input={
                        <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                    }
                />

                {/* Add a new member */}
                <div>
                    <h3 className="font-semibold">Add a new Member:</h3>
                    <InputLabel
                        label="Member Email"
                        layout="horizontal-single"
                        input={
                            <input
                                type="text"
                                className="border rounded px-2 py-1"
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
                                className="border rounded px-2 py-1"
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

                {/* Members List */}
                <div>
                    <h3 className="font-semibold">Members</h3>
                    <div className="space-y-2">
                        {members.map((member, index) => (
                            <div key={index} className="flex items-center space-x-4 p-2">
                                <button
                                    className="text-red-500 font-bold"
                                    onClick={() => removeMember(member.email, member.role)}
                                >
                                    <AiFillDelete />
                                </button>
                                <span className="flex-grow">{member.email}</span>
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
                            </div>
                        ))}
                    </div>
                </div>

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