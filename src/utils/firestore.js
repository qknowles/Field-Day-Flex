import {
    addDoc,
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
    getCountFromServer,
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
        const projectQuery = query(
            projectRef,
            where('project_name', '==', projectName)
        );

        const projectSnapshot = await getDocs(projectQuery);

        if (projectSnapshot.empty) {
            console.error(`Project "${projectName}" not found.`);
            return null;
        }

        // assuming a unique project_name
        const projectData = projectSnapshot.docs[0].data();

        const selectedFields = fields.reduce((result, field) => {
            if (field in projectData) {
                result[field] = projectData[field];
            }
            return result;
        }, {});
        return selectedFields;
    } catch (error) {
        console.error('Error retrieving project fields:', error);
        throw error;
    }
};

export const createProject = async (projectName, email, contributors, administrators) => {
    try {
        const projectRef = doc(db, 'Projects', projectName);
        await setDoc(projectRef, {
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
        const userRef = doc(db, 'Users', email);
        await setDoc(userRef, {
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
        'owners'
        const combinedQuery = query(
            projectsRef,
            or(
                where('contributors', 'array-contains', email),
                where('admins', 'array-contains', email),
                where('owners', 'array-contains', email)
            )
        );
        const projectSnapshot = await getDocs(combinedQuery);
        const projectNames = Array.from(new Set(
            projectSnapshot.docs.map((doc) => doc.data().project_name).filter((name) => name)
        ));
        return projectNames;
    } catch (error) {
        console.error('Error retrieving project names:', error);
        return [];
    }
};

export async function addMemberToProject(projectId, field, newMemberEmail) {
    const isValid = ["contributors", "admins", "owners"].some(
        (validField) => validField.toLowerCase() === field.toLowerCase())

    console.log("isValid:", isValid, field);
    if (!["contributors", "admins", "owners"].includes(field)) {
        console.error(`Invalid field: ${field}. Must be 'contributors', 'admins', or 'owners'.`);
        return;
    }

    const projectRef = doc(db, "Projects", projectId);

    try {
        await updateDoc(projectRef, {
            [field]: arrayUnion(newMemberEmail),
        });

        console.log(`Successfully added ${newMemberEmail} to ${field}.`);
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
    }
}

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
    columnNames,
    columnDataTypes,
    columnEntryOptions,
    columnIdentifierDomains,
    columnRequiredFields,
    columnOrder,
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


export const getArthropodLabels = async () => {
    const snapshot = await getDocs(
        query(collection(db, 'AnswerSet'), where('set_name', '==', 'ArthropodSpecies')),
    );

    const answers = snapshot.docs[0]?.data().answers || [];

    // Sort the answers by the 'primary' field alphabetically
    return answers.map((ans) => ans.primary).sort((a, b) => a.localeCompare(b));
};

const getDocsFromCollection = async (collectionName, constraints = []) => {
    if (!Array.isArray(constraints)) constraints = [constraints];
    try {
        const currentQuery = query(
            collection(db, collectionName),
            orderBy('dateTime', 'desc'),
            ...constraints,
        );
        return await getDocs(currentQuery);
    } catch (error) {
        console.error('Error loading entries:', error);
        return null;
    }
};

const addDocToCollection = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        console.log(`Document written to collection: ${collectionName} with ID: ${docRef.id}`);
    } catch (error) {
        console.error('Error adding document:', error);
    }
};

const updateDocInCollection = async (collectionName, docId, data) => {
    try {
        await updateDoc(doc(db, collectionName, docId), data);
        console.log('Document successfully updated!');
        return true;
    } catch (error) {
        console.error('Error updating document:', error);
        return false;
    }
};

const deleteDocFromCollection = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
        console.log('Document successfully deleted!');
    } catch (error) {
        console.error('Error removing document:', error);
    }
};

const getCollectionName = (environment, projectName, tableName) => {
    return `${environment === 'test' ? 'Test' : ''}${projectName}${tableName === 'Session' ? 'Session' : 'Data'}`;
};

const getCollectionNameFromDoc = (snapshot) => snapshot?.ref.parent.id;

const deleteDocumentFromFirestore = async (entrySnapshot, deleteMsg) => {
    let response = [];
    try {
        await deleteDoc(doc(db, entrySnapshot.ref.parent.id, entrySnapshot.id));
        response = [Type.success, deleteMsg || 'Document successfully deleted!'];
    } catch (e) {
        response = [Type.error, `Error deleting document: ${e}`];
    }
    if (entrySnapshot.data().taxa === 'Lizard') updateLizardMetadata('delete', { entrySnapshot });
    return response;
};

const updateLizardMetadata = async (operation, operationDataObject) => {
    const lizardDoc = doc(db, 'Metadata', 'LizardData');
    const { entrySnapshot } = operationDataObject;
    try {
        if (operation === 'update') {
            await updateDoc(lizardDoc, { lastEditTime: operationDataObject.lastEditTime });
        } else if (operation === 'delete') {
            await updateDoc(lizardDoc, {
                deletedEntries: arrayUnion({
                    entryId: entrySnapshot.id,
                    collectionId: entrySnapshot.ref.parent.id,
                }),
            });
        }
        console.log(`Sent ${operation} to the PWA`);
    } catch (e) {
        console.error(`Error sending ${operation} to PWA: ${e}`);
    }
};

const pushEntryChangesToFirestore = async (entrySnapshot, entryData, editMsg) => {
    if (entryData.taxa === 'Lizard') {
        const lastEditTime = new Date().getTime();
        entryData.lastEdit = lastEditTime;
        updateLizardMetadata('update', { lastEditTime });
    }
    let response = [];
    if (entryData.dateTime) {
        const newDate = new Date(entryData.dateTime);
        if (!isNaN(newDate)) {
            entryData.year = newDate.getFullYear();
        }
    }
    await setDoc(doc(db, entrySnapshot.ref.parent.id, entrySnapshot.id), entryData)
        .then(() => {
            response = [Type.success, editMsg || 'Changes successfully written to database!'];
        })
        .catch((e) => {
            response = [Type.error, `Error writing changes to database: ${e}`];
        });
    return response;
};

const editSessionAndItsEntries = async (sessionSnapshot, sessionData) => {
    const collectionId = sessionSnapshot.ref.parent.id.slice(0, -7);
    const entriesQuery = query(
        collection(db, `${collectionId}Data`),
        sessionSnapshot.data().sessionId
            ? where('sessionId', '==', sessionSnapshot.data().sessionId)
            : where('sessionDateTime', '==', sessionSnapshot.data().dateTime),
    );
    const entries = await getDocs(entriesQuery);
    const batch = writeBatch(db);
    entries.docs.forEach((entry) => {
        batch.update(doc(db, entry.ref.parent.id, entry.id), {
            dateTime: sessionData.dateTime,
            sessionDateTime: sessionData.dateTime,
        });
    });
    await batch.commit();
    return pushEntryChangesToFirestore(
        sessionSnapshot,
        sessionData,
        `Session ${entries.size ? `and its ${entries.size} entries` : ''} successfully changed`,
    );
};

export const getSessionEntryCount = async (sessionSnapshot) => {
    const collectionId = sessionSnapshot.ref.parent.id.slice(0, -7);
    const snapshot = await getCountFromServer(
        query(
            collection(db, `${collectionId}Data`),
            where('sessionDateTime', '==', sessionSnapshot.data().dateTime),
        ),
    );
    return snapshot.data().count;
};

const deleteSessionAndItsEntries = async (sessionSnapshot) => {
    const collectionId = sessionSnapshot.ref.parent.id.slice(0, -7);
    const entries = await getDocs(
        query(
            collection(db, `${collectionId}Data`),
            where('sessionDateTime', '==', sessionSnapshot.data().dateTime),
        ),
    );
    const deletePromises = entries.docs.map((entry) => deleteDocumentFromFirestore(entry));
    await Promise.all(deletePromises);
    return deleteDocumentFromFirestore(
        sessionSnapshot,
        `Session ${entries.size ? `and its ${entries.size} entries` : ''} successfully deleted`,
    );
};

const startEntryOperation = async (operationName, operationData) => {
    operationData.setEntryUIState('viewing');
    if (operationName.includes('delete')) operationData.removeEntryFromUI();
    if (operationName === 'uploadEntryEdits') {
        return pushEntryChangesToFirestore(operationData.entrySnapshot, operationData.entryData);
    } else if (operationName === 'deleteEntry') {
        return deleteDocumentFromFirestore(operationData.entrySnapshot);
    } else if (operationName === 'deleteSession') {
        return deleteSessionAndItsEntries(operationData.entrySnapshot);
    } else if (operationName === 'uploadSessionEdits') {
        return editSessionAndItsEntries(operationData.entrySnapshot, operationData.entryData);
    } else {
        return [Type.error, 'Unknown error occurred'];
    }
};

const getAnswerSetOptions = async (setName) => {
    const answerSet = await getDocs(
        query(collection(db, 'AnswerSet'), where('set_name', '==', setName)),
    );
    return answerSet.docs.flatMap((doc) => doc.data().answers.map((answer) => answer.primary));
};

export const getSitesForProject = (projectName) => getAnswerSetOptions(`${projectName}Sites`);
export const getArraysForSite = (projectName, siteName) =>
    getAnswerSetOptions(`${projectName}${siteName}Array`);
export const getTrapStatuses = () => getAnswerSetOptions('trap statuses');
export const getFenceTraps = () => getAnswerSetOptions('Fence Traps');
export const getSexes = () => getAnswerSetOptions('Sexes');

const getSessionsByProjectAndYear = async (environment, projectName, year) => {
    const collectionName = `${environment === 'test' ? 'Test' : ''}${projectName}Session`;
    const sessionsQuery = query(
        collection(db, collectionName),
        where('dateTime', '>=', `${year}/01/01 00:00:00`),
        where('dateTime', '<=', `${year}/12/31 23:59:59`),
        orderBy('dateTime', 'desc'),
    );
    return (await getDocs(sessionsQuery)).docs;
};

const getSpeciesCodesForProjectByTaxa = async (project, taxa) => {
    const answerSet = await getDocs(
        query(collection(db, 'AnswerSet'), where('set_name', '==', `${project}${taxa}Species`)),
    );
    return answerSet.docs.flatMap((doc) =>
        doc.data().answers.map((answer) => ({
            code: answer.primary,
            genus: answer.secondary.Genus,
            species: answer.secondary.Species,
        })),
    );
};

export const getStandardizedDateTimeString = (dateString) => {
    const tempDate = new Date(dateString);
    return `${tempDate.getFullYear()}/${String(tempDate.getMonth() + 1).padStart(2, '0')}/${String(tempDate.getDate()).padStart(2, '0')} ${tempDate.toLocaleTimeString('en-US', { hourCycle: 'h23' })}`;
};

export const uploadNewSession = async (sessionData, project, environment) => {
    const collectionName = `${environment === 'live' ? '' : 'Test'}${project.replace(/\s/g, '')}Session`;
    try {
        await addDoc(collection(db, collectionName), sessionData);
        return true;
    } catch {
        return false;
    }
};

export const getUserName = async (email) => {
    const user = await getDocs(query(collection(db, 'Users'), where('email', '==', email)));
    return user.docs[0].data().name;
}

export const uploadNewEntry = async (entryData, project, environment) => {
    const now = new Date();
    entryData.entryId = entryData.entryId || now.getTime();
    entryData.lastEdit = now.getTime();
    if (entryData.taxa === 'Arthropod') {
        entryData = {
            ...entryData,
            aran: entryData.aran || '0',
            auch: entryData.auch || '0',
            blat: entryData.blat || '0',
            chil: entryData.chil || '0',
            cole: entryData.cole || '0',
            crus: entryData.crus || '0',
            derm: entryData.derm || '0',
            diel: entryData.diel || '0',
            dipt: entryData.dipt || '0',
            hete: entryData.hete || '0',
            hyma: entryData.hyma || '0',
            hymb: entryData.hymb || '0',
            lepi: entryData.lepi || '0',
            mant: entryData.mant || '0',
            orth: entryData.orth || '0',
            pseu: entryData.pseu || '0',
            scor: entryData.scor || '0',
            soli: entryData.soli || '0',
            thys: entryData.thys || '0',
            unki: entryData.unki || '0',
            micro: entryData.micro || '0',
            taxa: 'N/A',
        };
    } else if (entryData.taxa === 'Lizard') {
        await updateDoc(doc(db, 'Metadata', 'LizardData'), { lastEditTime: now.getTime() });
    }
    for (const key in entryData) {
        if (entryData[key] === '') entryData[key] = 'N/A';
    }
    const entryId = `${entryData.site}${entryData.taxa === 'N/A' ? 'Arthropod' : entryData.taxa}${entryData.entryId}`;
    const collectionName = `${environment === 'live' ? '' : 'Test'}${project.replace(/\s/g, '')}Data`;
    try {
        await setDoc(doc(db, collectionName, entryId), entryData);
        return true;
    } catch {
        return false;
    }
};

export {
    getDocsFromCollection,
    addDocToCollection,
    updateDocInCollection,
    deleteDocFromCollection,
    getCollectionName,
    getCollectionNameFromDoc,
    startEntryOperation,
    getSessionsByProjectAndYear,
    getSpeciesCodesForProjectByTaxa,
};
