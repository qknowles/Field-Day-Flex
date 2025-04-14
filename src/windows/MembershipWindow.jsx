import React from 'react';
import { editMemberships } from '../utils/firestore';
import Button from '../components/Button';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from '../components/Notifier';
import { useAtomValue, useAtom } from 'jotai';
import { currentUserEmail, allProjectNames } from '../utils/jotai.js';

export default function ManageMembership({ CancelMemberships, setCurrentWindow }) {
    const [projectNames, setProjectNames] = useAtom(allProjectNames);
    const email = useAtomValue(currentUserEmail);

    const handleLeaveProject = async (project) => {
        const success = await editMemberships(email, project);
        if (success) {
            notify(Type.success, `Left project: ${project}`);
            setProjectNames((prevProjectNames) => [
                ...(prevProjectNames || []).filter((p) => p !== project)
              ]);
            if (projectNames.length === 0) {
                setCurrentWindow('HomePage');
            }
        } else {
            notify(
                Type.error,
                'Could not leave project. Project owners cannot leave their projects.',
            );
        }
    };

    return (
        <WindowWrapper
            header="Project Memberships"
            onLeftButton={CancelMemberships}
            leftButtonText="Close"
        >
            <div className="flex flex-col space-y-4 p-6">
                {projectNames.length === 0 ? (
                    <p className="text-center text-neutral-500 dark:text-neutral-400">
                        You are not a member of any projects
                    </p>
                ) : (
                    projectNames.map((project) => (
                        <div
                            key={project}
                            className="flex justify-between items-center gap-x-8 p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700"
                        >
                        <span className="text-lg font-medium text-neutral-800 dark:text-neutral-100">
                            {project}
                        </span>
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
