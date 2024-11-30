import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    setDoc,
    where,
} from 'firebase/firestore';
import { db } from './firebase';

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

export const createProject = async (projectName, email, contributors, administrators) => {
    try {
        const projectsCollection = collection(db, 'Projects');
        await addDoc(projectsCollection, {
            project_name: projectName,
            owners: [email],
            contributors: contributors,
            admins: administrators,
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

        const contributorQuery = query(projectsRef, where('contributors', 'array-contains', email));
        const contributorSnapshot = await getDocs(contributorQuery);

        const projectNames = Array.from(new Set(
            contributorSnapshot.docs.map((doc) => doc.data().project_name).filter((name) => name)
        ));

        return projectNames;

    } catch (error) {
        console.error('Error retrieving project names:', error);
        return [];
    }
};

export const getTabNames = async (email, projectName) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            where('project_name', '==', projectName),
            where('contributors', 'array-contains', email),
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

export const tabExists = async (Email, SelectedProject, tabName) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            where('project_name', '==', SelectedProject),
            where('contributors', 'array-contains', Email)
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
    Email,
    SelectedProject,
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
            where('project_name', '==', SelectedProject),
            where('contributors', 'array-contains', Email)
        );
        const projectSnapshot = await getDocs(projectsQuery);
        const projectDoc = projectSnapshot.docs[0];

        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (!tabSnapshot.empty) {
            console.log('A tab with this name already exists.');
            return false;
        }

        const tabRef = doc(tabsRef, tabName);
        await setDoc(tabRef, {
            tab_name: tabName,
            generate_unique_identifier: generateIdentifiers,
            possible_identifiers: possibleIdentifiers,
            identifier_dimension: identifierDimension,
            unwanted_codes: unwantedCodes,
            utilize_unwanted: utilizeUnwantedCodes,
            created_at: new Date(),
            next_entry: 1,
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

export const getColumnsCollection = async (projectName, tabName, email) => {
    try {
        console.log('Fetching columns for project:', projectName, 'and tab:', tabName);

        // Query the Projects collection
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(
            projectRef,
            where('project_name', '==', projectName),
            where('contributors', 'array-contains', email)
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
            console.error('No matching tab found for:', tabName);
            return [];
        }

        const tabDoc = tabSnapshot.docs[0]; // Get the tab document

        // Query the Columns subcollection
        const columnsRef = collection(tabDoc.ref, 'Columns');
        const columnsSnapshot = await getDocs(columnsRef);

        if (columnsSnapshot.empty) {
            console.warn('No columns found in the specified tab:', tabName);
            return [];
        }

        // Map the column documents into an array
        const columns = columnsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log('Fetched columns:', columns);
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
            where('project_name', '==', projectName),
            where('contributors', 'array-contains', email)
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
            console.error('No matching tab found in the specified project.');
            return false;
        }

        const tabDoc = tabSnapshot.docs[0];
        const tabData = tabDoc.data();

        const entryNumber = tabData.next_entry_number;

        const entriesRef = collection(tabDoc.ref, 'Entries');
        await addDoc(entriesRef, {
            entry_data: newEntry,
            entry_date: new Date(),
            deleted: false,
            entry_number: entryNumber,
        });

        const tabRef = doc(tabsRef, tabDoc.id);
        await updateDoc(tabRef, {
            next_entry_number: entryNumber + 1,
        });

        console.log('Entry added successfully.');
        return true;

    } catch (error) {
        console.error('Error adding entry:', error);
        return false;
    }
};

export const addDocToCollection = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        console.log(`Document written to collection: ${collectionName} with ID: ${docRef.id}`);
    } catch (error) {
        console.error('Error adding document:', error);
    }
};
export const getEntriesForTab = async (projectName, tabName, email) => {
    try {
        // Get project reference
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(
            projectRef,
            where('project_name', '==', projectName),
            where('contributors', 'array-contains', email)
        );
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            throw new Error('Project not found');
        }

        const projectDoc = projectSnapshot.docs[0];

        // Get tab reference
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (tabSnapshot.empty) {
            throw new Error('Tab not found');
        }

        const tabDoc = tabSnapshot.docs[0];

        // Get entries
        const entriesRef = collection(tabDoc.ref, 'Entries');
        const entriesSnapshot = await getDocs(entriesRef);

        return entriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            entry_date: doc.data().entry_date?.toDate?.() || doc.data().entry_date
        }));

    } catch (error) {
        console.error('Error fetching entries:', error);
        throw error;
    }
};
export const updateDocInCollection = async (collectionName, docId, data) => {
    try {
        await updateDoc(doc(db, collectionName, docId), data);
        console.log('Document successfully updated!');
        return true;
    } catch (error) {
        console.error('Error updating document:', error);
        return false;
    }
};

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
            console.error('No matching tab found:', tabName);
            return [];
        }

        const tabDoc = tabSnapshot.docs[0];
        const columnsRef = collection(tabDoc.ref, 'Columns');
        const queryConstraints = query(columnsRef, ...constraints);
        const columnsSnapshot = await getDocs(queryConstraints);

        if (columnsSnapshot.empty) {
            console.warn('No columns found in the specified tab:', tabName);
            return [];
        }

        const columns = columnsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log('Fetched columns:', columns);
        return columns;
    } catch (error) {
        console.error('Error in getDocsFromCollection:', error);
        return [];
    }
};

export const getUserName = async (email) => {
    const user = await getDocs(query(collection(db, 'Users'), where('email', '==', email)));
    return user.docs[0].data().name;
}