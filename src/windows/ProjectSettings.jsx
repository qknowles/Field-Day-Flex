import React, { useEffect, useState } from 'react';
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
    const [documentId, setDocumentId] = useState(null); // Start with null, indicating it's unresolved
    const [projectName, setProjectName] = useState(projectNameProp);
    const [newMemberSelectedRole, setNewMemberSelectedRole] = useState('Select Role');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [members, setMembers] = useState([
        { email: 'There is no project selected!', role: 'Contributor' },
        { email: 'Does the project exist in the DB?', role: 'Owner' },
    ]);

    useEffect(() => {
        // Fetch document ID on mount
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

    // on component mount we fetch everything.. but we need docId first.
    useEffect(() => {
        if (documentId) {
            fetchProjectData();
        }
    }, [documentId]); // we run this whenever docId gets resolved from the promise

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

                // This was accidentally commited in the same commit as Task 420. These lines are for Task 418:
                const currUser = updatedMembers.find((member) => member.email === emailProp);
                if(currUser && ((currUser.role === "Owner") || (currUser.role === "Admin"))) {
                    setIsAuthorized(true);
                } else setIsAuthorized(false);
            }
        } catch (err) {
            console.error('Error fetching project data:', err);
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
        await addMemberToProject(
            documentId,
            newMemberSelectedRole.toLowerCase() + 's',
            newMemberEmail,
        );
        await fetchProjectData();
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

            if (success) {
                console.log('Members successfully synced to Firebase:', updatedData);
            } else {
                console.error('Failed to sync members to Firebase.');
            }
        } catch (error) {
            console.error('Error updating Firebase:', error);
        }
    }

    async function saveChanges() {
        await updateDocInCollection('Projects', documentId, { project_name: `${projectName}` });
        await fetchProjectData();
        updateProjectName(`${projectName}`);
    }

    async function removeMember(email, role) {
        if (role === 'Owner') {
            notify(Type.error, 'Cannot remove an owner from the project.');
            return;
        }
        try {
            // Map the role to the appropriate Firestore field
            const field = role.toLowerCase() + 's'; // "Contributor" -> "contributors", "Admin" -> "admins", etc.

            // Get the current list of members in the field
            const updatedFieldMembers = members
                .filter((member) => !(member.email === email && member.role === role)) // Remove the matching member
                .filter((member) => member.role.toLowerCase() + 's' === field) // Filter only those in the same role field
                .map((member) => member.email); // Only keep the email

            // Update Firestore
            const updateData = {
                [field]: updatedFieldMembers,
            };
            await updateDocInCollection('Projects', documentId, updateData);

            // Update local state
            setMembers((prevMembers) =>
                prevMembers.filter((member) => !(member.email === email && member.role === role)),
            );

            notify(Type.success, `${email} has been successfully removed as a ${role}.`);
        } catch (err) {
            console.error(`Error removing member: ${email}`, err);
            notify(Type.error, `Failed to remove ${email}.`);
        }
    }

    // Component depends on the docID ... we do nothing until that promise resolves.
    if (!documentId) {
        return <div>Loading project settings...</div>;
    }

    if (!isAuthorized) {
        return (
            <WindowWrapper
                header={`Manage ${projectNameProp} Project`}
                onLeftButton={() => { CloseProjectSettings() }}
                leftButtonText="Close"
            >
                <div className="p-5">
                    <p>You do not have permission to view this page.</p>
                    <p>You must be the project owner or an administrator.</p>
                </div>
            </WindowWrapper>
        );
    }


    return (
        <WindowWrapper
            header={`Manage ${projectNameProp} Project`}
            onLeftButton={() => {
                CloseProjectSettings();
            }}
            onRightButton={() => {
                saveChanges();
            }}
            leftButtonText="Cancel"
            rightButtonText="Save Project Name"
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
                                onChange={(e) => {
                                    setNewMemberSelectedRole(e.target.value);
                                }}
                            >
                                <option value="Select Role">Select Role</option>
                                <option value="Contributor">Contributor</option>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                            </select>
                        }
                    />{' '}
                    <br />
                    <div className="flex justify-end mt-4">
                        <Button
                            text="Add member"
                            onClick={() => {
                                addMember();
                            }}
                        />
                    </div>
                </div>

                {/* Members List */}
                <div>
                    <h3 className="font-semibold">Members</h3>
                    <div className="space-y-2">
                        {members.map((member, index) => (
                            <div key={index} className="flex items-center space-x-4 p-2">
                                {/* Delete Button */}
                                <button
                                    className="text-red-500 font-bold"
                                    onClick={() => {
                                        console.log('Calling remove member');
                                        removeMember(member.email, member.role);
                                    }}
                                >
                                    <AiFillDelete />
                                </button>
                                {/* Email Display */}
                                <span className="flex-grow">{member.email}</span>

                                {/* Role Selector */}
                                <DropdownSelector
                                    options={['Owner', 'Admin', 'Contributor']}
                                    selection={member.role}
                                    setSelection={(newRole) => {
                                        console.log('old members', members);
                                        const oldMembers = members;
                                        setMembers(() => {
                                            return oldMembers.map((m) => {
                                                if (m.email === member.email) {
                                                    return { ...m, role: newRole };
                                                }
                                                return m;
                                            });
                                        });
                                        console.log('new members', members);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </WindowWrapper>
    );
}
