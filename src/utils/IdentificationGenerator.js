import { getIdentifierFields, getPossibleIdentifiers, getEntriesWithIdFields } from '../utils/firestore';

const setAppendingOptions = async (email, project, tab, pWantedId) => {
    let possibleIdentifiers = await getPossibleIdentifiers(email, project, tab);
    if (pWantedId) {
        const pIdArray = pWantedId.split(/[^a-zA-Z]+/).filter(Boolean);
        for (let code of pIdArray) {
            possibleIdentifiers = possibleIdentifiers.filter((id) => !id.includes(code));
        }
    }
    return possibleIdentifiers;
};

const setAlreadyUsedCodes = async (email, project, tab, pUserEntries) => {
    let identifierFields = await getIdentifierFields(email, project, tab);
    identifierFields = identifierFields.filter(field => !field.includes('Entry ID')).sort();

    let userEntriesMap = new Map(Object.entries(pUserEntries || {}));
    const identifierEntries = identifierFields
        .filter(field => userEntriesMap.has(field))
        .reduce((obj, field) => {
            obj[field] = userEntriesMap.get(field);
            return obj;
        }, {});

    const hasEmptyIdentifierValue = Object.values(identifierEntries)
        .some(value => value === '' || value === null || value === undefined || value === 'Select');

    const alreadyUsedCodes = await getEntriesWithIdFields(project, tab, email, identifierEntries);
    return { alreadyUsedCodes, hasEmptyIdentifierValue, identifierFields };
};

export const generateId = async (email, project, tab, pWantedId, pUserEntries) => {
    let generatedId = '';
    const appendingOptions = await setAppendingOptions(email, project, tab, pWantedId);
    const { alreadyUsedCodes, hasEmptyIdentifierValue, identifierFields } = await setAlreadyUsedCodes(email, project, tab, pUserEntries);

    if (!hasEmptyIdentifierValue) {
        let match = alreadyUsedCodes.filter((codes) => codes === pWantedId).length > 0;
        if (pWantedId && !match) {
            generatedId = pWantedId;
        } else {
            if (appendingOptions.length !== 0) {
                const wantedArray = pWantedId.split('-').filter(Boolean);
                let tempArray = [];
                for (let option of appendingOptions) {
                    const optionArray = option.match(/[A-Z]+[0-9]+/gi) || [];
                    tempArray = [...wantedArray, ...optionArray];
                    tempArray.sort();
                    match = alreadyUsedCodes.filter((codes) => codes === tempArray.join('-')).length > 0;
                    if (!match) {
                        generatedId = tempArray.join('-');
                        break;
                    }
                }
            }
            if (!generatedId) {
                generatedId = `No codes available.`;
            }
        }
    } else {
        generatedId = `Enter ${identifierFields.join(', ')} before generating code.`;
    }
    return generatedId;
};

export const idAlreadyUsed = async (email, project, tab, pWantedId, pUserEntries) => {
    const { alreadyUsedCodes, hasEmptyIdentifierValue, identifierFields } = await setAlreadyUsedCodes(email, project, tab, pUserEntries);
    await setAppendingOptions(email, project, tab, pWantedId);

    if (!hasEmptyIdentifierValue) {
        let match = alreadyUsedCodes.filter((codes) => codes === pWantedId).length > 0;
        if (pWantedId && !match) {
            return false;
        } else {
            return `That code is already used.`;
        }
    } else {
        return `Enter ${identifierFields.join(', ')} before generating code and submitting entry.`;
    }
};
