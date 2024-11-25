import React, { useState } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper.jsx';
import InputLabel from '../components/InputLabel.jsx';
import { DropdownSelector } from '../components/FormFields.jsx';
import { AiFillDelete } from 'react-icons/ai';

export default function ProjectSettings({ projectNameProp = "NoNamePassed", CloseProjectSettings }) {
    const [projectName, setProjectName] = useState(projectNameProp);
    const [contributors, setContributors] = useState([]);
    const [administrators, setAdministrators] = useState([]);
    const [members, setMembers] = useState([
        { email: "Heather@email.com", role: "Owner" },
        { email: "Ian@email.com", role: "Admin" },
        { email: "Ayesha@email.com", role: "Contributor" },
        { email: "Evan@email.com", role: "Contributor" },
    ]);

    function saveChanges() {
        console.log("Saved Changes!!");
    }

    return (
        <WindowWrapper
            header={`Manage ${projectName} Project`}
            onLeftButton={() => { CloseProjectSettings() }}
            onRightButton={() => { saveChanges() }}
            leftButtonText="Cancel"
            rightButtonText="Save"
        >
            <div className="flex flex-col space-y-4 p-4">
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

                {/* Contributors Dropdown */}
                <InputLabel
                    label="Contributors"
                    layout="horizontal-single"
                    input={
                        <DropdownSelector
                            options={contributors}
                            setOptions={setContributors}
                            placeholder="Add Here"
                        />
                    }
                />

                {/* Administrators Dropdown */}
                <InputLabel
                    label="Administrators"
                    layout="horizontal-single"
                    input={
                        <DropdownSelector
                            options={administrators}
                            setOptions={setAdministrators}
                            placeholder="Add Here"
                        />
                    }
                />

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
                                        setMembers(members.filter((_, i) => i !== index));
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
                                    onChange={(role) => {
                                        const updatedMembers = [...members];
                                        updatedMembers[index].role = role;
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
