import { getIdentifierFields, getPossibleIdentifiers, getEntriesWithIdFields } from '../utils/firestore';

export const generateId = async (email, project, tab, pWantedId, pUserEntries) => {
    let generatedId = '';
    let appendingOptions = [];
    let alreadyUsedCodes = [];
    let hasEmptyIdentifierValue = false;
    let identifierFields = '';

    const setAppendingOptions = async () => {
        let possibleIdentifiers = await getPossibleIdentifiers(email, project, tab);
        if (pWantedId) {
            const pIdArray = pWantedId.split(/[^a-zA-Z]+/).filter(Boolean);
            for (let code of pIdArray) {
                possibleIdentifiers = possibleIdentifiers.filter((id) => !id.includes(code));
            }
        }
        appendingOptions = possibleIdentifiers;
    }

    const setAlreadyUsedCodes = async () => {
        identifierFields = (await getIdentifierFields(email, project, tab));
        identifierFields = identifierFields.filter(field => !field.includes('Entry ID')).sort();

        let userEntriesMap = new Map(Object.entries(pUserEntries || {}));

        const identifierEntries = identifierFields
            .filter(field => userEntriesMap.has(field))
            .reduce((obj, field) => {
                obj[field] = userEntriesMap.get(field);
                return obj;
            }, {});

        hasEmptyIdentifierValue = Object.values(identifierEntries)
            .some(value => value === '' || value === null || value === undefined || value === 'Select');

        alreadyUsedCodes = await getEntriesWithIdFields(project, tab, email, identifierEntries);
    }

    const generate = async () => {
        if (!hasEmptyIdentifierValue) {
            let match = alreadyUsedCodes.filter((codes) => codes === pWantedId).length > 0;
            if (pWantedId && !match) {
                generatedId = pWantedId;
            } else {
                if (appendingOptions.length !== 0) {
                    const wantedArray = pWantedId.split('-').filter(Boolean);
                    let tempArray = [];

                    for (let option of appendingOptions) {
                        let optionArray = option.match(/[A-Z]+[0-9]+/gi) || [];
                        tempArray = [...wantedArray, ...optionArray];
                        tempArray.sort();

                        match = alreadyUsedCodes.filter((codes) => codes === tempArray.join('-')).length > 0;
                        if (!match) {
                            generatedId = tempArray.join('-');
                            break;
                        }
                    };
                }
                if (!generatedId) {
                    generatedId = `No codes available.`
                }
            }
        } else {
            generatedId = `Enter ${identifierFields.join(', ')} before generating code.`;
        }
    }

    await setAlreadyUsedCodes();
    await setAppendingOptions();
    await generate();

    return generatedId;
}
