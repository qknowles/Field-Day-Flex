import { getIdentifierFields, getPossibleIdentifiers, getEntriesWithIdFields } from '../utils/firestore';

export const generateId = async (email, project, tab, pWantedId, pUserEntries) => {
    let generatedId = '';
    let appendingOptions = [];
    let alreadyUsedCodes = [];

    const setAppendingOptions = async () => {
        let possibleIdentifiers = await getPossibleIdentifiers(email, project, tab);
        if (pWantedId) {
            const pIdArray = pWantedId.split(/[^a-zA-Z]+/).filter(Boolean);
            for (let code of pIdArray) {
                possibleIdentifiers = possibleIdentifiers.filter((id) => !id.includes(code));
            }
        }
        console.log('poss', possibleIdentifiers);
        appendingOptions = possibleIdentifiers;
    }

    const setAlreadyUsedCodes = async () => {
        let identifierFields = (await getIdentifierFields(email, project, tab));
        identifierFields = identifierFields.filter(field => !field.includes('Entry ID'));

        let userEntriesMap = new Map(Object.entries(pUserEntries || {}));

        const identifierEntries = identifierFields
            .filter(field => userEntriesMap.has(field))
            .reduce((obj, field) => {
                obj[field] = userEntriesMap.get(field);
                return obj;
            }, {});

        alreadyUsedCodes = await getEntriesWithIdFields(project, tab, email, identifierEntries);
        console.log('already', alreadyUsedCodes);
    }

    const generate = async () => {

        let match = alreadyUsedCodes.filter((codes) => codes === pWantedId).length > 0;
        console.log('already', match);
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
                        console.log('temp', tempArray);

                        match = alreadyUsedCodes.filter((codes) => codes === tempArray.join('-')).length > 0;
                        console.log('match', match);
                        if (!match) {
                            generatedId = tempArray.join('-');
                            console.log('here');
                            break;
                        }
                    };
                }
                if (!generatedId) {
                    generatedId = `No codes available.`
                }
            }
    }

    await setAlreadyUsedCodes();
    await setAppendingOptions();
    await generate();

    return generatedId;
}
