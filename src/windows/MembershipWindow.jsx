import React, { useState, useEffect } from 'react';
import { editMemberships, getProjectNames } from '../utils/firestore';
import Button from '../components/Button';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from '../components/Notifier';

export default function ManageMembership({ 
    Email,
    CancelMemberships,
    setCurrentWindow
}) {
    const [userProjectData, setUserProjectData] = useState([]);

    useEffect(() => {
        const loadProjects = async () => {
            const projects = await getProjectNames(Email);
            setUserProjectData(projects);
        };
        loadProjects();
    }, [Email]);

    const handleLeaveProject = async (project) => {
        const success = await editMemberships(Email, project);
        if (success) {
            notify(Type.success, `Left project: ${project}`);
            const updatedProjects = await getProjectNames(Email);
            setUserProjectData(updatedProjects);
            if(updatedProjects.length === 0) {
                setCurrentWindow('HomePage');
            }
        } else {
            notify(Type.error, 'Could not leave project. Project owners cannot leave their projects.');
        }
    };

    return (
        <WindowWrapper
            header="Project Memberships"
            onLeftButton={CancelMemberships}
            leftButtonText="Close"
        >
            <div className="flex flex-col space-y-4 p-4">
                {userProjectData.length === 0 ? (
                    <p className="text-center">You are not a member of any projects</p>
                ) : (
                    userProjectData.map((project) => (
                        <div key={project} className="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
                            <span className="text-lg">{project}</span>
                            <Button
                                text="Leave Project"
                                onClick={() => handleLeaveProject(project)}
                            />
                        </div>
                    ))
                )}
            </div>
        </WindowWrapper>
    );
}