import React, { useEffect, useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import InputLabel from '../components/InputLabel.jsx';
import { DropdownSelector } from '../components/FormFields.jsx';
import { AiFillDelete } from 'react-icons/ai';
import { getProjectFields, updateDocInCollection, addMemberToProject } from '../utils/firestore.js';
import Button from '../components/Button.jsx';
import { notify, Type } from '../components/Notifier.jsx';

export default function ProjectSettings({ projectNameProp = "NoNamePassed", CloseProjectSettings }) {
    const [projectName, setProjectName] = useState(projectNameProp);
    const [newMemberSelectedRole, setNewMemberSelectedRole] = useState('Select Role');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [members, setMembers] = useState([
        // this should never occur but might as well have some sort of "handling"
        { email: "There is no project selected!", role: "Contributor" },
        { email: "Does the project exist in the DB?", role: "Owner"}
    ]);

    useEffect(() => {
        fetchProjectData();
    }, []); // no deps; run once! also save the DB from excess reads

    const fetchProjectData = async () => {
        let members = await getProjectFields(projectName, ['contributors', 'admins', 'owners']);
        console.log(members);
        if(members) {
            const {contributors = [], admins = [], owners = [] } = members;
            const updatedMembers = [
                ...contributors.map(email => ({email, role: "Contributor"})),
                ...admins.map(email => ({email, role: "Admin"})),
                ...owners.map(email => ({email, role: "Owner"})),
            ]
            // Sort by role first, then by email
            // sort: returns negative if a comes before b, positive if a after b, and 0 if equal.
            updatedMembers.sort((a, b) => {
                const rolePriority = { Owner: 1, Admin: 2, Contributor: 3 };

                if (rolePriority[a.role] !== rolePriority[b.role]) {
                    return rolePriority[a.role] - rolePriority[b.role];
                }

                // if roles are the same, compare emails alphabetically
                return a.email.localeCompare(b.email);
            });
            setMembers(updatedMembers);
        }
    }

    async function addMember() {
        if(!newMemberEmail || newMemberEmail.length === 0) {
            notify(Type.error, "Please enter member email.")
        }
        if(newMemberSelectedRole === 'Select Role') {
            notify(Type.error, "Please select a role.")
            return;
        }
        // roles defined here are "Contributor", "Admin", and "Owner"
        // in the DB these roles are defined as "Contributors", "Admins", and "Owners"... so we need the s.
        await addMemberToProject(projectName, newMemberSelectedRole.toLowerCase() + "s", newMemberEmail);
        await fetchProjectData(); // update the component with new data.
    }

    // Save button (rightButton in WindowWrapper) only used for project name. everything else is real time
    function saveChanges() {
        notify(Type.error, "saveChanges TBD - ask Quinten or Evan about state of DB")
        // console.log('projectNameProp:', projectNameProp);
        // console.log('projectName:', projectName);
        // updateDocInCollection('Projects', projectNameProp(), {project_name: `${projectName}`});
    }

    return (
        <WindowWrapper
            header={`Manage ${projectNameProp()} Project`}
            onLeftButton={() => { CloseProjectSettings() }}
            onRightButton={() => { saveChanges() }}
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
                    <br/>
                    <InputLabel
                        label="Member Role"
                        layout="horizontal-single"
                        input={
                            <select
                                className="border rounded px-2 py-1"
                                value={newMemberSelectedRole}
                                onChange={(e) => {
                                    setNewMemberSelectedRole(e.target.value);
                                    console.log("Selected role:", e.target.value);
                                }}
                            >
                                {/* Dropdown Options */}
                                <option value="Select Role">Select Role</option>
                                <option value="Contributor">Contributor</option>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                            </select>
                        }
                    /> <br/>
                    <div className="flex justify-end mt-4">
                        <Button
                            text="Add member"
                            onClick={() => {addMember()}}
                        />
                    </div>
                </div>


                {/* Members List */}
                <div>
                    <h3 className="font-semibold">Members</h3>
                    <div className="space-y-2">
                        {members.map((member, index) => (
                            <div
                                key={index}
                                className="flex items-center space-x-4 p-2"
                            >
                                {/* Delete Button */}
                                <button
                                    className="text-red-500 font-bold"
                                    onClick={() => {
                                        // TODO: DELETE FROM DB
                                        notify(Type.error, "not implemented; ask quinten or evan about state of DB");
                                        console.log("Delete button clicked!");
                                    }}
                                >
                                    <AiFillDelete />
                                </button>
                                {/* Email Display */}
                                <span className="flex-grow">{member.email}</span>

                                {/* Role Selector */}
                                <DropdownSelector
                                    options={["Owner", "Admin", "Contributor"]}
                                    selection={member.role}
                                    setSelection={(newRole) => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].role = newRole;
                                        setMembers(updatedMembers);
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
