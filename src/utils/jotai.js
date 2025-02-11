import { atomWithStorage } from 'jotai/utils';
import { RESET } from 'jotai/utils';

export const currentUserEmail = atomWithStorage('currentUserEmail', false);

export const isAuthenticated = atomWithStorage('isAuthenticated', false);

export const currentTableName = atomWithStorage('currentTableName', '');

export const allTableNames = atomWithStorage('allTableNames', []);

export const currentProjectName = atomWithStorage('currentProjectName', '');

export const allProjectNames = atomWithStorage('allProjectNames', []);

export const currentBatchSize = atomWithStorage('currentBatchSize', 15);

export const clearLocalStorage = ({
    setUserEmail,
    setIsAuthenticated,
    setTableName,
    setAllTableNames,
    setProjectName,
    setAllProjectNames,
    setBatchSize,
}) => {
    setUserEmail(RESET);
    setIsAuthenticated(RESET);
    setTableName(RESET);
    setAllTableNames(RESET);
    setProjectName(RESET);
    setAllProjectNames(RESET);
    setBatchSize(RESET);
};