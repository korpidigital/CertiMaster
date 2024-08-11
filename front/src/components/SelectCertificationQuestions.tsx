/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { useAtom } from 'jotai';
import { certificationAtom, questionsAtom, loadingAtom, errorAtom } from '../atoms';


export default function SelectCertificationQuestions() {
    const [certification, setCertification] = useAtom(certificationAtom);
    const [questions, setQuestions] = useAtom(questionsAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);

    const fetchQuestions = async (certi: string) => {
        setCertification(certi);
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:7071/api/GetQuestions?certification=${encodeURIComponent(certi)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                try {
                    const data = await response.json();
                    console.log('Parsed data:', data);
                    setQuestions(data);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setError('Failed to parse response as JSON');
                }
            } else {
                const errorText = await response.text();
                setError(`Error: ${response.status} - ${errorText}`);
            }
        } catch (err) {
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div>
            <h1>Certification</h1>
            <button onClick={()=>fetchQuestions('AZ-204')} disabled={loading}>
                AZ-204
            </button>
        </div>
    )
}
