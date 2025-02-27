import { assign } from 'lodash';
import { getIdentifierFields, getPossibleIdentifiers, getEntriesWithIdFields } from '../utils/firestore';

export const generateId = async (email, project, tab, pWantedId, pUserEntries) => {
    let generatedId = '';
    let assignmentOptions = [];
    let alreadyUsedCodes = [];

    const setAssignmentOptions = async () => {
        let possibleIdentifiers = await getPossibleIdentifiers(email, project, tab);
        if (pWantedId) {
            const pIdArray = pWantedId.split(/[^a-zA-Z]+/).filter(Boolean);
            for (let code of pIdArray) {
                possibleIdentifiers = possibleIdentifiers.filter((id) => !id.includes(code));
            }
        }
        console.log(possibleIdentifiers);
        assignmentOptions = possibleIdentifiers;
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

        let matches = alreadyUsedCodes.filter((codes) => codes.includes(pWantedId));

        if (pWantedId && matches.length < 1) {
            generatedId = pWantedId;
            console.log('here');
        } else {
            console.log('here');
            await setAssignmentOptions();
            if (assignmentOptions.length !== 0) {
                const wantedArray = pWantedId.split('-').filter(Boolean);
                let tempArray = [];

                for (let option of assignmentOptions) {
                    let optionArray = option.match(/[A-Z]+[0-9]+/gi) || [];
                    tempArray = [...wantedArray, ...optionArray];
                    tempArray.sort();
                    console.log('temp', tempArray);

                    matches = alreadyUsedCodes.filter((codes) => codes === tempArray.join('-'));
                    if (matches.length < 1) {
                        generatedId = tempArray.join('-');
                        break;
                    }
                };
            }
        }
    }

    await setAlreadyUsedCodes();
    await generate();

    return generatedId;
}
