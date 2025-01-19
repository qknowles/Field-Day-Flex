import React from 'react';
import WindowWrapper from '../wrappers/WindowWrapper';
import { DropdownFlex } from '../components/FormFields';
import Button from '../components/Button';
//import { currentProjectName } from '../utils/jotai';
// TODO: These imports need to be implemented
// import { SetRole } from '../components/FormFields';
// import { editProject_Details } from '../utils/firestore';
// import { auth } from '../utils/authenticator';

export default function ManageProject({ CloseManageProject/*, setCurrentWindow, userProjectData */ }) {
    // Required by architecture diagram
    /*
    const handleProjectDetails = async () => {
        // Will use editProject_Details from firestore
    };
    
    const handleSetRole = () => {
        // Will use SetRole component
    };

    const handleAuth = () => {
        // Will use auth/Authenticator
    };
    */
    return (
        <WindowWrapper
            header="Manage Project"
            onLeftButton={CloseManageProject}
            leftButtonText="Cancel"
            rightButtonText="Save Changes"
            onRightButton={handleProjectDetails}
        >
            <div className="flex flex-col space-y-4">
                <DropdownFlex />
                {/* SetRole component will go here */}
                <Button />
            </div>
        </WindowWrapper>
    );
}
