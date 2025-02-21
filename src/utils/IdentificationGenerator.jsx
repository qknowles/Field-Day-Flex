import { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { getIdDimension } from '../utils/firestore';
import { currentUserEmail, currentProjectName, currentTableName } from '../utils/jotai.js';

export default function IdentificationGenerator(pWantedId) {
    const [idMaxLetter, setIdMaxLetter] = useState('');
    const [idMaxNumber, setIdMaxNumber] = useState('');
    const [generatedId, setGeneratedId] = useState('');

    const email = useAtomValue(currentUserEmail);
    const project = useAtomValue(currentProjectName);
    const tab = useAtomValue(currentTableName);

    useEffect(() => {

        const fetchIdDimension = async () => {
            const idDimension = await getIdDimension(email, project, tab);
            if (idDimension && idDimension.length > 0) {
                setIdMaxLetter(idDimension[0]);
                setIdMaxNumber(idDimension[1]);
            }
        };

        const generate = () => {
            setGeneratedId(`${pWantedId}_test`);
        }

        fetchIdDimension();
        generate();
        
    }, [email, project, tab, pWantedId]);

    return generatedId;
}
