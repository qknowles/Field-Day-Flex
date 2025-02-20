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
    // Jotai state: Stores project name and user email
    const [projectName, setProjectName] = useAtom(currentProjectName);
    const userEmail = useAtomValue(currentUserEmail);

    // Local state variables
    const [documentId, setDocumentId] = useState(null); // Stores Firestore document ID for the project
    const [isAuthorized, setIsAuthorized] = useState(false); // Determines if the user has admin/owner privileges
    const [members, setMembers] = useState([]); // Stores the list of project members
    const [newMemberEmail, setNewMemberEmail] = useState(''); // Stores input for adding a new member
    const [newMemberSelectedRole, setNewMemberSelectedRole] = useState('Select Role'); // Stores the role selected for the new member
    const [loading, setLoading] = useState(true); // Indicates if project data is being fetched

    // Fetch project data when the component mounts or projectName/userEmail changes
    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                setLoading(true);

                // Fetch the document ID based on project name and user email
                const docId = await getDocumentIdByEmailAndProjectName(userEmail, projectName);
                if (!docId) {
                    notify(Type.error, 'Project not found');
                    setLoading(false);
                    return;
                }
                setDocumentId(docId);

                // Fetch project members (contributors, admins, owners)
                const membersData = await getProjectFields(projectName, ['contributors', 'admins', 'owners']);
                if (!membersData) {
                    notify(Type.error, 'Failed to load project data');
                    setLoading(false);
                    return;
                }

                setMembers(membersData);

                // Determine if the current user has admin/owner privileges
                const userRole = getUserRole(membersData, userEmail);
                setIsAuthorized(userRole === 'Owner' || userRole === 'Admin');

            } catch (error) {
                console.log(error);
                notify(Type.error, 'Error loading project');
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();
    }, [projectName, userEmail]);

    /**
     * Determines the user's role in the project.
     * @param {Object} membersData - Object containing lists of project members categorized by role.
     * @param {string} userEmail - Email of the current user.
     * @returns {string} - The user's role ('Owner', 'Admin', or 'None').
     */
    const getUserRole = (membersData, userEmail) => {
        if (!userEmail) return 'None';
        if (membersData.owners?.includes(userEmail)) return 'Owner';
        if (membersData.admins?.includes(userEmail)) return 'Admin';
        return 'None';
    };

    /**
     * Adds a new member to the project.
     * Validates email and role selection before adding.
     */
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

            // Refresh the members list after adding a new member
            let newMembers = await getProjectFields(projectName, ['contributors', 'admins', 'owners']);
            console.log(newMembers);
            setMembers(newMembers);
        } catch (error) {
            notify(Type.error, 'Failed to add member');
            console.log("ERROR", error);
        }
    };

    /**
     * Saves changes made to the project, such as renaming it.
     * Updates Firestore with the new project name.
     */
    const handleSaveChanges = async () => {
        try {
            await updateDocInCollection('Projects', documentId, { project_name: projectName });
            updateProjectName(projectName);
            notify(Type.success, 'Project updated successfully');
        } catch (error) {
            notify(Type.error, 'Failed to update project');
            console.log("ERROR", error);
        }
    };

    /**
     * Removes a member from the project.
     * Prevents removing owners and ensures updates persist in Firestore.
     * @param {string} email - The email of the member to remove.
     * @param {string} role - The role of the member.
     */
    const handleRemoveMember = async (email, role) => {
        if (role === 'Owner') {
            notify(Type.error, 'Cannot remove an owner from the project.');
            return;
        }

        try {
            let newMembers = { ...members };
            const index = newMembers[role].indexOf(email);
            if (index > -1) {
                newMembers[role].splice(index, 1);
                console.log("newMembers after splice", newMembers);
            } else {
                notify(Type.error, 'Member could not be found in list.');
                return;
            }

            if (await updateDocInCollection('Projects', documentId, newMembers)) {
                setMembers(newMembers);
                console.log("members after setting members to newMembers", members);
                notify(Type.success, `${email} has been removed as a ${role}.`);
            } else {
                notify(Type.error, 'Failed to update project');
            }
        } catch (error) {
            notify(Type.error, `Failed to remove ${email}.`);
            console.log("ERROR", error);
        }
    };

    // Show loading message while fetching data
    if (loading) return <div>Loading project settings...</div>;

    // Display a message if the user does not have permission
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
            onRightButton={handleSaveChanges}
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
                                                <Button className="text-red-500 font-bold" onClick={() => handleRemoveMember(email, role)}>
                                                    <AiFillDelete />
                                                </Button>
                                                <span className="flex-grow">{email}</span>
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
            </div>
        </WindowWrapper>
    );
}
