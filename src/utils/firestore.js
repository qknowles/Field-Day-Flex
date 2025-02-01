import {
    addDoc,
    getDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    orderBy,
    arrayUnion,
    setDoc,
    where,
    writeBatch,
    or,
    and,
    getCountFromServer,
    runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { Type } from '../components/Notifier';

export const accountExists = async (email) => {
    const usersRef = collection(db, 'Users');
    const emailQuery = query(usersRef, where('email', '==', email));
    const userSnapshot = await getDocs(emailQuery);

    return !userSnapshot.empty;
};

export const projectExists = async (projectName) => {
    const projectRef = collection(db, 'Projects');
    const projectQuery = query(projectRef, where('project_name', '==', projectName));
    const userSnapshot = await getDocs(projectQuery);

    return !userSnapshot.empty;
};

export const getProjectFields = async (projectName, fields) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(projectRef, where('project_name', '==', projectName));
        const projectDocs = await getDocs(projectQuery);

        if (!projectDocs.empty) {
            const doc = projectDocs.docs[0];
            const projectData = doc.data();
            const selectedFields = fields.reduce((result, field) => {
                if (field in projectData) {
                    result[field] = projectData[field];
                }
                return result;
            }, {});

            return selectedFields;
        }
        return false;
    } catch (error) {
        console.error('Error retrieving project fields:', error);
        return false;
    }
};

export const createProject = async (projectName, email, contributors, administrators) => {
    try {
        const projectsCollection = collection(db, 'Projects');
        await addDoc(projectsCollection, {
            project_name: projectName,
            owners: [email],
            contributors: contributors,
            admins: administrators,
            created_at: new Date(),
            next_tab: 0,
        });

        return true;
    } catch (error) {
        console.error('Error creating project:', error);
        return false;
    }
};

export const verifyPassword = async (email, hashedPassword) => {
    try {
        const usersRef = collection(db, 'Users');
        const verifyQuery = query(
            usersRef,
            where('email', '==', email),
            where('password', '==', hashedPassword),
        );
        const userSnapshot = await getDocs(verifyQuery);

        return !userSnapshot.empty;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
};

export const createAccount = async (name, email, hashedPassword) => {
    try {
        const userRef = collection(db, 'Users');
        await addDoc(userRef, {
            name: name,
            email: email,
            password: hashedPassword,
            createdAt: new Date(),
        });

        return true;
    } catch (error) {
        console.error('Error creating account:', error);
        return false;
    }
};

export const getProjectNames = async (email) => {
    try {
        const projectsRef = collection(db, 'Projects');
        ('owners');
        const combinedQuery = query(
            projectsRef,
            or(
                where('contributors', 'array-contains', email),
                where('admins', 'array-contains', email),
                where('owners', 'array-contains', email),
            ),
        );
        const projectSnapshot = await getDocs(combinedQuery);
        const projectNames = Array.from(
            new Set(
                projectSnapshot.docs.map((doc) => doc.data().project_name).filter((name) => name),
            ),
        );
        return projectNames;
    } catch (error) {
        console.error('Error retrieving project names:', error);
        return [];
    }
};

export const getDocumentIdByProjectName = async (projectName) => {
    try {
        const projectQuery = query(
            collection(db, 'Projects'),
            where('project_name', '==', projectName),
        );

        const querySnapshot = await getDocs(projectQuery);

        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            return docId;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching document ID:', error);
        return null;
    }
};

export async function addMemberToProject(projectId, field, newMemberEmail) {
    const isValid = ['contributors', 'admins', 'owners'].some(
        (validField) => validField.toLowerCase() === field.toLowerCase(),
    );

    if (!['contributors', 'admins', 'owners'].includes(field)) {
        console.error(`Invalid field: ${field}. Must be 'contributors', 'admins', or 'owners'.`);
        return;
    }

    const projectRef = doc(db, 'Projects', projectId);

    try {
        await updateDoc(projectRef, {
            [field]: arrayUnion(newMemberEmail),
        });
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
    }
}

export const getTabNames = async (email, projectName) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
            ),
        );
        const projectSnapshot = await getDocs(projectsQuery);

        if (projectSnapshot.empty) {
            return [];
        }

        const projectDoc = projectSnapshot.docs[0];
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabsSnapshot = await getDocs(tabsRef);

        const tabNames = tabsSnapshot.docs
            .map((tabDoc) => tabDoc.data().tab_name)
            .filter((name) => name);

        return tabNames;
    } catch (error) {
        console.error('Error retrieving tab names:', error);
        return [];
    }
};

export const tabExists = async (email, selectedProject, tabName) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            and(
                where('project_name', '==', selectedProject),
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
            ),
        );
        const projectSnapshot = await getDocs(projectsQuery);

        const projectDoc = projectSnapshot.docs[0];
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        return !tabSnapshot.empty;
    } catch (error) {
        console.error('Error checking if tab exists:', error);
        return false;
    }
};

export const createTab = async (
    email,
    selectedProject,
    tabName,
    generateIdentifiers,
    possibleIdentifiers,
    identifierDimension,
    unwantedCodes,
    utilizeUnwantedCodes,
    columnNames = [],
    columnDataTypes = [],
    columnEntryOptions = [],
    columnIdentifierDomains = [],
    columnRequiredFields = [],
    columnOrder = [],
) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            and(
                where('project_name', '==', selectedProject),
                or(
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
            ),
        );
        const projectSnapshot = await getDocs(projectsQuery);
        const projectDoc = projectSnapshot.docs[0];

        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (!tabSnapshot.empty) {
            return false;
        }

        const projectData = projectDoc.data();
        const tabOrder = projectData.next_tab;

        const tabRef = doc(tabsRef, tabName);
        await setDoc(tabRef, {
            tab_name: tabName,
            generate_unique_identifier: generateIdentifiers,
            possible_identifiers: possibleIdentifiers,
            identifier_dimension: identifierDimension,
            unwanted_codes: unwantedCodes,
            utilize_unwanted: utilizeUnwantedCodes,
            created_at: new Date(),
            order: tabOrder,
        });

        const projectToUpdate = doc(projectRef, projectDoc.id);
        await updateDoc(projectToUpdate, {
            next_tab: tabOrder + 1,
        });

        const columnsRef = collection(tabRef, 'Columns');
        for (let i = 0; i < columnNames.length; i++) {
            await addDoc(columnsRef, {
                name: columnNames[i],
                data_type: columnDataTypes[i],
                entry_options: columnEntryOptions[i],
                identifier_domain: columnIdentifierDomains[i],
                required_field: columnRequiredFields[i],
                order: columnOrder[i],
            });
        }

        return true;
    } catch (error) {
        console.error('Error creating tab:', error);
        return false;
    }
};

export const addColumn = async (
    email,
    selectedProject,
    tabName,
    columnName,
    columnDataType,
    columnEntryOptions = [],
    columnIdentifierDomain = null,
    columnRequiredField = false,
) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            and(
                where('project_name', '==', selectedProject),
                or(
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
            ),
        );
        const projectSnapshot = await getDocs(projectsQuery);
        if (projectSnapshot.empty) {
            return false;
        }
        const projectDoc = projectSnapshot.docs[0];

        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);
        if (tabSnapshot.empty) {
            return false;
        }
        const tabDoc = tabSnapshot.docs[0];

        const columnsRef = collection(tabDoc.ref, 'Columns');
        const existingColumns = await getDocs(columnsRef);
        const columnOrder = existingColumns.size;

        await addDoc(columnsRef, {
            name: columnName,
            data_type: columnDataType,
            entry_options: columnEntryOptions[0],
            identifier_domain: columnIdentifierDomain,
            required_field: columnRequiredField,
            order: columnOrder,
        });

        await addColumnToEntries(tabDoc, columnName);

        return true;
    } catch (error) {
        console.error('Error adding column:', error);
        return false;
    }
};

const addColumnToEntries = async (tabDoc, columnName) => {
    try {
        const entriesRef = collection(tabDoc.ref, 'Entries');
        const entriesSnapshot = await getDocs(entriesRef);

        const batch = writeBatch(db);
        entriesSnapshot.forEach((entryDoc) => {
            const entryRef = doc(entriesRef, entryDoc.id);
            batch.update(entryRef, {
                [columnName]: null,
            });
        });

        await batch.commit();
    } catch (error) {
        console.error('Error updating entries with new column:', error);
    }
};

export const getColumnsCollection = async (projectName, tabName, email) => {
    try {
        // Query the Projects collection
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
            ),
        );
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            console.error('No matching project found for:', projectName);
            return [];
        }

        const projectDoc = projectSnapshot.docs[0]; // Get the project document

        // Query the Tabs subcollection
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (tabSnapshot.empty) {
            return [];
        }

        const tabDoc = tabSnapshot.docs[0]; // Get the tab document

        // Query the Columns subcollection
        const columnsRef = collection(tabDoc.ref, 'Columns');
        const columnsSnapshot = await getDocs(columnsRef);

        if (columnsSnapshot.empty) {
            return [];
        }

        // Map the column documents into an array
        const columns = columnsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return columns;
    } catch (error) {
        console.error('Error in getColumnsCollection:', error);
        return [];
    }
};

export const addEntry = async (projectName, tabName, email, newEntry) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
            ),
        );
        const projectSnapshot = await getDocs(projectsQuery);

        if (projectSnapshot.empty) {
            console.error('No matching project found for the given name and email.');
            return false;
        }

        const projectDoc = projectSnapshot.docs[0];

        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabsQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabsQuery);

        if (tabSnapshot.empty) {
            return false;
        }

        const tabDoc = tabSnapshot.docs[0];

        const entriesRef = collection(tabDoc.ref, 'Entries');
        await addDoc(entriesRef, {
            entry_data: newEntry,
            entry_date: new Date(),
            deleted: false,
        });

        return true;
    } catch (error) {
        console.error('Error adding entry:', error);
        return false;
    }
};

export const getEntriesForTab = async (projectName, tabName, email) => {
    try {
        // Get project reference
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
            ),
        );
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            return false;
        }

        const projectDoc = projectSnapshot.docs[0];

        // Get tab reference
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (tabSnapshot.empty) {
            return false;
        }

        const tabDoc = tabSnapshot.docs[0];

        // Get entries
        const entriesRef = collection(tabDoc.ref, 'Entries');
        const entriesSnapshot = await getDocs(entriesRef);

        return entriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            entry_date: doc.data().entry_date?.toDate?.() || doc.data().entry_date,
        }));
        
    } catch (error) {
        console.error('Error in getEntriesForTab');
    }
};
export const updateDocInCollection = async (collectionName, docId, data) => {
    try {
        await updateDoc(doc(db, collectionName, docId), data);
        return true;
    } catch (error) {
        console.error('Error updating document:', error);
        return false;
    }
};

// TODO: Update this function to use Firestore's Transactions.
export const updateEmailInProjects = async (oldEmail, newEmail) => {
    try {
        const projectsRef = collection(db, 'Projects');
        const projectSnapshots = await getDocs(projectsRef);

        for (const projectDoc of projectSnapshots.docs) {
            const projectData = projectDoc.data();
            const updatedData = {};

            if (projectData.contributors && projectData.contributors.includes(oldEmail)) {
                updatedData.contributors = projectData.contributors.map((email) =>
                    email === oldEmail ? newEmail : email,
                );
            }
            if (projectData.admins && projectData.admins.includes(oldEmail)) {
                updatedData.admins = projectData.admins.map((email) =>
                    email === oldEmail ? newEmail : email,
                );
            }
            if (projectData.owners && projectData.owners.includes(oldEmail)) {
                updatedData.owners = projectData.owners.map((email) =>
                    email === oldEmail ? newEmail : email,
                );
            }
            if (Object.keys(updatedData).length > 0) {
                const projectRef = doc(db, 'Projects', projectDoc.id);
                await updateDoc(projectRef, updatedData);
            }
        }
        return true;
    } catch (error) {
        console.error('Error updating email in projects:', error);
        return false;
    }
};

export async function getDocumentIdByUserName(userEmail) {
    try {
        const userQuery = query(collection(db, 'Users'), where('email', '==', userEmail));

        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            return docId;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching document ID:', error);
        return null;
    }
}

export const getCollectionName = async (environment, projectName, tableName) => {
    try {
        // First get project doc ID
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(projectRef, where('project_name', '==', projectName));
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            throw new Error('Project not found');
        }

        const projectDoc = projectSnapshot.docs[0];

        // Then get tab doc ID
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tableName));
        const tabSnapshot = await getDocs(tabQuery);

        if (tabSnapshot.empty) {
            throw new Error('Tab not found');
        }

        const tabDoc = tabSnapshot.docs[0];

        // Return the full path
        return `Projects/${projectDoc.id}/Tabs/${tabDoc.id}/Columns`;
    } catch (error) {
        console.error('Error in getCollectionName:', error);
        throw error;
    }
};
export const getDocsFromCollection = async (projectName, tabName, constraints = []) => {
    try {
        if (!projectName || !tabName) {
            throw new Error('projectName or tabName is missing');
        }

        const projectRef = collection(db, 'Projects');
        const projectQuery = query(projectRef, where('project_name', '==', projectName));
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            console.error('No matching project found:', projectName);
            return [];
        }

        const projectDoc = projectSnapshot.docs[0];
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (tabSnapshot.empty) {
            return [];
        }

        const tabDoc = tabSnapshot.docs[0];
        const columnsRef = collection(tabDoc.ref, 'Columns');
        const queryConstraints = query(columnsRef, ...constraints);
        const columnsSnapshot = await getDocs(queryConstraints);

        if (columnsSnapshot.empty) {
            return [];
        }

        const columns = columnsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return columns;
    } catch (error) {
        console.error('Error in getDocsFromCollection:', error);
        return [];
    }
};
export const editMemberships = async (email, projectName) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(projectRef, where('project_name', '==', projectName));
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            return false;
        }

        const projectDoc = projectSnapshot.docs[0];
        const projectData = projectDoc.data();

        // Check if user is owner
        if (projectData.owners.includes(email)) {
            return false; // Can't remove owners
        }

        // Remove user from contributors and admins
        const updatedContributors = projectData.contributors.filter((c) => c !== email);
        const updatedAdmins = projectData.admins.filter((a) => a !== email);

        await updateDoc(projectDoc.ref, {
            contributors: updatedContributors,
            admins: updatedAdmins,
        });

        return true;
    } catch (error) {
        console.error('Error editing memberships:', error);
        return false;
    }
};
export const getUserName = async (email) => {
    const user = await getDocs(query(collection(db, 'Users'), where('email', '==', email)));
    return user.docs[0].data().name || 'null';
};

export async function saveUserAccountChanges(fieldsChanged, originalEmail) {
    try {
        const userDocRef = doc(db, "Users", await getDocumentIdByUserName(originalEmail));
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                console.error("User does not exist in saveUserAccountChanges", originalEmail);
                throw new Error("User document does not exist.");
            }
            // TODO: Once updateEmailInProjects uses transactions, refactor this to use that change.
            transaction.update(userDocRef, {
                ...fieldsChanged,
                lastUpdated: new Date()
            });
            if(fieldsChanged.email) {
                console.log("email field changed");
                await updateEmailInProjects(originalEmail, fieldsChanged.email);
            }
            console.log("Transaction completed successfully:", fieldsChanged);
        });
        return true;
    } catch (error) {
        console.error("Error in saveUserAccountChanges:", error);
        return false;
    }
}
export const deleteEntry = async (projectName, tabName, entryId) => {
    try {
        const projectId = await getDocumentIdByProjectName(projectName);
        if (!projectId) {
            throw new Error('Project ID not found for the selected project');
        }
        const docRef = doc(db, 'Projects', projectId, 'Tabs', tabName, 'Entries', entryId);
        console.log('Deleting document:', docRef.path); // Log the document path
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting entry:', error);
        throw error;
    }
};

export const getEntryDetails = async (projectName, tabName, entryId) => {
    try {
        const projectId = await getDocumentIdByProjectName(projectName);
        if (!projectId) {
            throw new Error('Project ID not found for the selected project');
        }
        const docRef = doc(db, 'Projects', projectId, 'Tabs', tabName, 'Entries', entryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log('Entry details:', docSnap.data()); // Log the entry details
            return { id: entryId, ...docSnap.data() }; // Ensure the entry ID is included in the returned data
        } else {
            console.error('Entry not found');
            throw new Error('Entry not found');
        }
    } catch (error) {
        console.error('Error fetching entry details:', error);
        throw error;
    }
};

export const updateEntry = async (projectName, tabName, email, entryId, updatedData) => {
    try {
        const projectId = await getDocumentIdByProjectName(projectName);
        if (!projectId) {
            throw new Error('Project ID not found for the selected project');
        }
        const docRef = doc(db, 'Projects', projectId, 'Tabs', tabName, 'Entries', entryId);
        await updateDoc(docRef, {
            entry_data: updatedData // Update the entry_data field
        });
        console.log('Entry updated:', docRef.path); // Log the document path
    } catch (error) {
        console.error('Error updating entry:', error);
        throw error;
    }
};
