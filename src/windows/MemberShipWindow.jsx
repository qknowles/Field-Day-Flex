import React, { useState, useEffect } from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from '../components/Notifier';
import { getProjectNames } from '../utils/firestore';
import Button from '../components/Button';

export default function MembershipsWindow({ CancelMemberships, Email }) {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const loadProjects = async () => {
            const projectList = await getProjectNames(Email);
            setProjects(projectList);
        };
        loadProjects();
    }, [Email]);

    const handleLeaveProject = async (projectName) => {
        // Firebase logic for leaving project would go here
        notify(Type.plain, `Would leave project: ${projectName}`);
    };

    return (
        <WindowWrapper
            header="Project Memberships"
            onLeftButton={CancelMemberships}
            leftButtonText="Close"
        >
            <div className="flex flex-col space-y-4 p-4 max-h-96 overflow-auto">
                {projects.length === 0 ? (
                    <p className="text-center text-gray-500 italic">
                        You are not a member of any projects
                    </p>
                ) : (
                    projects.map((project) => (
                        <div 
                            key={project}
                            className="flex justify-between items-center p-4 bg-white dark:bg-neutral-800 rounded-lg shadow"
                        >
                            <span className="text-lg">{project}</span>
                            <Button
                                text="Leave Project"
                                onClick={() => handleLeaveProject(project)}
                                className="bg-red-600 hover:bg-red-700"
                            />
                        </div>
                    ))
                )}
            </div>
        </WindowWrapper>
    );
}
