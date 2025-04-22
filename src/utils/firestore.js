import {
    addDoc,
    getDoc,
    deleteDoc,
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    arrayUnion,
    setDoc,
    where,
    writeBatch,
    or,
    and,
    runTransaction
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
            deleted: false,
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
        const combinedQuery = query(
            projectsRef,
            and(
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email),
                ),
                where('deleted', '==', false),
            )
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

export const getDocumentIdByEmailAndProjectName = async (email, projectName) => {
    try {
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

export const deleteProjectWithDocId = async (docId) => {
    try {
        const docRef = doc(db, "Projects", docId);
        await updateDoc(docRef, { deleted: true });
        return true;
    } catch (error) {
        console.error("Error updating document:", error);
        return false;
    }
};

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

        // Filter out deleted tabs
        const tabNames = tabsSnapshot.docs
            .map((tabDoc) => tabDoc.data())
            .filter((tab) => !tab.deleted)
            .map((tab) => tab.tab_name);

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
    columnName,
    columnDataType,
    columnEntryOptions,
    columnIdentifierDomain,
    columnRequiredField,
    columnOrder,
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
        if (columnName) {
            await addDoc(columnsRef, {
                name: columnName,
                data_type: columnDataType,
                ...(columnEntryOptions.length > 0 && { entry_options: columnEntryOptions[i] }),
                identifier_domain: columnIdentifierDomain,
                required_field: columnRequiredField,
                allow_negative: allowNegativeFlag,
                order: columnOrder,
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
    columnIdentifierDomain = false,
    columnRequiredField = false,
    allowNegativeFlag = false,
    

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
        const columnOrder = existingColumns.size + 1;

        await addDoc(columnsRef, {
            name: columnName,
            data_type: columnDataType,
            ...(columnEntryOptions.length > 0 && { entry_options: columnEntryOptions }),
            identifier_domain: columnIdentifierDomain,
            required_field: columnRequiredField,
            allow_negative: allowNegativeFlag,
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

        return columns.filter(col => !col.deleted);

    } catch (error) {
        console.error('Error in getColumnsCollection:', error);
        return [];
    }
};

import { Timestamp } from 'firebase/firestore';

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

        const columnsRef = collection(tabDoc.ref, 'Columns');
        const columnsSnapshot = await getDocs(columnsRef);

        let columnTypes = {};
        columnsSnapshot.docs.forEach(doc => {
            columnTypes[doc.data().name] = doc.data().data_type;
        });

        // Convert all date-type fields to Firestore Timestamps
        Object.keys(newEntry).forEach(key => {
            if (columnTypes[key] === 'date' && typeof newEntry[key] === 'string') {
                newEntry[key] = Timestamp.fromDate(new Date(newEntry[key]));
            }
        });

        const entriesRef = collection(tabDoc.ref, 'Entries');
        await addDoc(entriesRef, {
            entry_data: newEntry,
            entry_date: Timestamp.now(),
            deleted: false,
        });

        return true;
    } catch (error) {
        console.error('Error adding entry:', error);
        return false;
    }
};

export const addEntryBulk = async (projectName, tabName, email, ...newEntries) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email)
                )
            )
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
            console.error('No matching tab found');
            return false;
        }
        const tabDoc = tabSnapshot.docs[0];

        const columnsRef = collection(tabDoc.ref, 'Columns');
        const columnsSnapshot = await getDocs(columnsRef);
        let columnTypes = {};
        columnsSnapshot.docs.forEach(doc => {
            const { name, data_type } = doc.data();
            columnTypes[name] = data_type;
        });

        const entriesRef = collection(tabDoc.ref, 'Entries');

        const addEntryPromises = newEntries.map(async (entry) => {
            let processedEntry = { ...entry };
            Object.keys(processedEntry).forEach(key => {
                if (columnTypes[key] === 'date' && typeof processedEntry[key] === 'string') {
                    processedEntry[key] = Timestamp.fromDate(new Date(processedEntry[key]));
                }
            });

            return addDoc(entriesRef, {
                entry_data: processedEntry,
                entry_date: Timestamp.now(),
                deleted: false,
            });
        });

        await Promise.all(addEntryPromises);
        return true;

    } catch (error) {
        console.error('Error adding entries in bulk:', error);
        return false;
    }
};


export const updateEntriesToTimestamps = async (projectName, tabName, email) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectsQuery = query(projectRef, where('project_name', '==', projectName));
        const projectSnapshot = await getDocs(projectsQuery);

        if (projectSnapshot.empty) {
            console.error('No matching project found.');
            return;
        }

        const projectDoc = projectSnapshot.docs[0];
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabsQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabsQuery);

        if (tabSnapshot.empty) {
            console.error('No matching tab found.');
            return;
        }

        const tabDoc = tabSnapshot.docs[0];

        const columnsRef = collection(tabDoc.ref, 'Columns');
        const columnsSnapshot = await getDocs(columnsRef);

        let columnTypes = {};
        columnsSnapshot.docs.forEach(doc => {
            columnTypes[doc.data().name] = doc.data().data_type;
        });

        const entriesRef = collection(tabDoc.ref, 'Entries');
        const entriesSnapshot = await getDocs(entriesRef);

        const batch = writeBatch(db);

        entriesSnapshot.forEach((entryDoc) => {
            const entryData = entryDoc.data();
            let updatedFields = {};

            Object.keys(entryData.entry_data).forEach(key => {
                if (columnTypes[key] === 'date' && typeof entryData.entry_data[key] === 'string') {
                    updatedFields[`entry_data.${key}`] = Timestamp.fromDate(new Date(entryData.entry_data[key]));
                }
            });

            if (Object.keys(updatedFields).length > 0) {
                const entryRef = doc(entriesRef, entryDoc.id);
                batch.update(entryRef, updatedFields);
            }
        });

        await batch.commit();
        console.log('Updated all string dates to Firestore Timestamps.');
    } catch (error) {
        console.error('Error updating entries:', error);
    }
};


export const getEntriesForTab = async (projectName, tabName, email) => {
    try {
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
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (tabSnapshot.empty) {
            return false;
        }

        const tabDoc = tabSnapshot.docs[0];

        const columnsRef = collection(tabDoc.ref, 'Columns');
        const columnsSnapshot = await getDocs(columnsRef);

        let columnTypes = {};
        columnsSnapshot.docs.forEach(doc => {
            columnTypes[doc.data().name] = doc.data().data_type;
        });

        const entriesRef = collection(tabDoc.ref, 'Entries');
        const entriesSnapshot = await getDocs(entriesRef);

        // Function to format timestamps in 24-hour format
        const formatDate = (timestamp) => {
            if (!timestamp?.toDate) return timestamp;

            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hourCycle: 'h23'  // 24-hour format
            }).format(timestamp.toDate());
        };

        return entriesSnapshot.docs.map((doc) => {
            const data = doc.data();

            return {
                id: doc.id,
                ...data,
                entry_date: formatDate(data.entry_date),
                entry_data: Object.keys(data.entry_data).reduce((formattedData, key) => {
                    if (columnTypes[key] === 'date') {
                        formattedData[key] = formatDate(data.entry_data[key]);
                    } else {
                        formattedData[key] = data.entry_data[key];
                    }
                    return formattedData;
                }, {}),
            };
        });

    } catch (error) {
        console.error('Error in getEntriesForTab:', error);
        return [];
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
            if (fieldsChanged.email) {
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
export const deleteEntry = async (email, projectName, tabName, entryId) => {
    try {
        const projectId = await getDocumentIdByEmailAndProjectName(email, projectName);
        if (!projectId) {
            throw new Error('Project ID not found for the selected project');
        }
        const docRef = doc(db, 'Projects', projectId, 'Tabs', tabName, 'Entries', entryId);
        console.log('Setting deleted flag to true for entry:', docRef.path); // Log the document path
        await updateDoc(docRef, { deleted: true });
    } catch (error) {
        console.error('Error deleting entry:', error);
        throw error;
    }
};

export const getEntryDetails = async (email, projectName, tabName, entryId) => {
    try {
        const projectId = await getDocumentIdByEmailAndProjectName(email, projectName);
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
        const projectId = await getDocumentIdByEmailAndProjectName(email, projectName);
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

export const saveColumnChanges = async (projectName, tabName, columns, columnsToDelete, editedColumnNames, columnOrder, editedColumnTypes, editedRequiredFields, editedIdentifierDomains, editedDropdownOptions) => {
    try {
        const projectId = await getProjectIdByName(projectName);
        if (!projectId) {
            throw new Error('Project ID not found for the selected project');
        }

        const batch = writeBatch(db);

        for (const column of columns) {
            if (columnsToDelete.includes(column.id)) {
                const columnRef = doc(db, 'Projects', projectId, 'Tabs', tabName, 'Columns', column.id);

                // Soft delete the column by setting a flag
                batch.update(columnRef, { deleted: true });

                // Optional: remove the column from all entries
                const entriesSnapshot = await getDocs(collection(db, 'Projects', projectId, 'Tabs', tabName, 'Entries'));
                entriesSnapshot.docs.forEach(entryDoc => {
                    const entryRef = doc(db, 'Projects', projectId, 'Tabs', tabName, 'Entries', entryDoc.id);
                    const entryData = entryDoc.data();
                    delete entryData.entry_data[column.name];
                    batch.update(entryRef, { entry_data: entryData.entry_data });
                });
            }
            else if (!['actions', 'datetime', 'identifier'].includes(column.id)) {
                // Update column
                const columnRef = doc(db, 'Projects', projectId, 'Tabs', tabName, 'Columns', column.id);
                batch.update(columnRef, {
                    name: editedColumnNames[column.id],
                    order: columnOrder[column.id],
                    data_type: editedColumnTypes[column.id],
                    required_field: editedRequiredFields[column.id],
                    identifier_domain: editedIdentifierDomains[column.id],
                    entry_options: editedColumnTypes[column.id] === 'multiple choice' ?
                        editedDropdownOptions[column.id] : []
                });
            }
        }

        await batch.commit();
    } catch (error) {
        console.error('Error saving column changes:', error);
        throw error;
    }
};

export const getIdDimension = async (email, projectName, tabName) => {
    try {
        const project = await getDocumentIdByEmailAndProjectName(email, projectName);
        if (!project) {
            throw new Error('Project ID not found for the selected project');
        }

        const docRef = doc(db, 'Projects', project, 'Tabs', tabName);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Tab document not found');
        }

        return docSnap.data().identifier_dimension;

    } catch (error) {
        console.error('Error retrieving id dimension:', error);
        return [];
    }
};

export const getPossibleIdentifiers = async (email, projectName, tabName) => {
    try {
        const project = await getDocumentIdByEmailAndProjectName(email, projectName);
        if (!project) {
            throw new Error('Project ID not found for the selected project');
        }

        const docRef = doc(db, 'Projects', project, 'Tabs', tabName);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Tab document not found');
        }

        return docSnap.data().possible_identifiers;

    } catch (error) {
        console.error('Error retrieving possible identifiers:', error);
        return [];
    }
};

export const getIdentifierFields = async (email, projectName, tabName) => {
    try {
        const project = await getDocumentIdByEmailAndProjectName(email, projectName);
        if (!project) {
            throw new Error('Project ID not found for the selected project');
        }

        const columnsRef = collection(db, 'Projects', project, 'Tabs', tabName, 'Columns');

        const q = query(columnsRef, where('identifier_domain', '==', true));

        const querySnapshot = await getDocs(q);

        const identifierFields = querySnapshot.docs.map(doc => doc.data().name);

        return identifierFields;

    } catch (error) {
        console.error('Error retrieving identifier fields:', error);
        return [];
    }
};

export const getEntriesWithIdFields = async (projectName, tabName, email, identifierEntries) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('contributors', 'array-contains', email),
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email)
                )
            )
        );
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
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

        const entriesRef = collection(tabDoc.ref, 'Entries');
        const entriesSnapshot = await getDocs(entriesRef);

        const matchingIdFieldEntries = entriesSnapshot.docs
            .filter(doc => {
                const data = doc.data();
                const entryData = data.entry_data || {};

                if (data.deleted === true) {
                    return false;
                }

                return Object.entries(identifierEntries).every(([key, value]) => {
                    const entryValue = entryData[key];
                    return entryValue !== undefined && String(entryValue) === String(value);
                });
            })
            .map(doc => {
                return doc.data().entry_data['Entry ID'];
            })
            .filter(Boolean);

        return matchingIdFieldEntries;

    } catch (error) {
        console.error('Error in getEntriesWithIdField:', error);
        return [];
    }
};

export const getUnwantedCodeInfo = async (email, projectName, tabName) => {
    try {
        const project = await getDocumentIdByEmailAndProjectName(email, projectName);
        if (!project) {
            throw new Error('Project ID not found for the selected project');
        }

        const docRef = doc(db, 'Projects', project, 'Tabs', tabName);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Tab document not found');
        }

        const unwantedCodes = docSnap.data().unwanted_codes;
        const utilizeUnwanted = docSnap.data().utilize_unwanted

        return { unwantedCodes, utilizeUnwanted };

    } catch (error) {
        console.error('Error retrieving unwanted codes:', error);
        return [];
    }
};

export const getRequiredFields = async (email, projectName, tabName) => {
    try {
        const project = await getDocumentIdByEmailAndProjectName(email, projectName);
        if (!project) {
            throw new Error('Project ID not found for the selected project');
        }

        const columnsRef = collection(db, 'Projects', project, 'Tabs', tabName, 'Columns');

        const q = query(columnsRef, where('required_field', '==', true));

        const querySnapshot = await getDocs(q);

        const identifierFields = querySnapshot.docs.map(doc => doc.data().name);

        return identifierFields;

    } catch (error) {
        console.error('Error retrieving required fields:', error);
        return [];
    }
};

export const updateTabName = async (projectName, oldTabName, newTabName, email) => {
    try {
        // First, check if user has admin or owner permissions
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email)
                )
            )
        );
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            console.error('Project not found or user does not have permission');
            return false;
        }

        const projectDoc = projectSnapshot.docs[0];

        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const oldTabQuery = query(tabsRef, where('tab_name', '==', oldTabName));
        const oldTabSnapshot = await getDocs(oldTabQuery);

        if (oldTabSnapshot.empty) {
            throw new Error('Old tab not found.');
        }

        const oldTabDoc = oldTabSnapshot.docs[0];
        const oldTabData = oldTabDoc.data();

        // Set the new tab_name
        const newTabRef = doc(tabsRef, newTabName);
        await setDoc(newTabRef, {
            ...oldTabData,
            tab_name: newTabName
        });

        // Move subcollections (Columns, Entries)
        const subcollections = ['Columns', 'Entries'];
        for (const sub of subcollections) {
            const subRef = collection(oldTabDoc.ref, sub);
            const subSnap = await getDocs(subRef);
            for (const docSnap of subSnap.docs) {
                const newDocRef = doc(newTabRef, sub, docSnap.id);
                await setDoc(newDocRef, docSnap.data());
            }
        }

        await deleteDoc(oldTabDoc.ref);

        return true;
    } catch (error) {
        console.error('Error updating tab name:', error);
        return false;
    }
};

export const deleteTab = async (projectName, tabName, email) => {
    try {
        // First, check if user has admin or owner permissions
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(
            projectRef,
            and(
                where('project_name', '==', projectName),
                or(
                    where('admins', 'array-contains', email),
                    where('owners', 'array-contains', email)
                )
            )
        );
        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            console.error('Project not found or user does not have permission');
            return false;
        }

        const projectDoc = projectSnapshot.docs[0];

        // Locate the tab document
        const tabsRef = collection(projectDoc.ref, 'Tabs');
        const tabQuery = query(tabsRef, where('tab_name', '==', tabName));
        const tabSnapshot = await getDocs(tabQuery);

        if (tabSnapshot.empty) {
            console.error('Tab not found:', tabName);
            return false;
        }

        const tabDoc = tabSnapshot.docs[0];

        // Update the tab document to mark it as deleted
        await updateDoc(tabDoc.ref, { deleted: true });
        console.log(`Marked tab "${tabName}" as deleted.`);

        return true;
    } catch (error) {
        console.error('Error deleting tab:', error);
        return false;
    }
};

export const getProjectIdByName = async (projectName) => {
    try {
        const projectRef = collection(db, 'Projects');
        const projectQuery = query(projectRef, where('project_name', '==', projectName));
        const snapshot = await getDocs(projectQuery);
        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error in getProjectIdByName:', error);
        return null;
    }
};

