import React, { useState } from 'react';
import { QuestionNavigator } from './QuestionNavigator';

interface Question {
    id: string;
    certification: string;
    topic: string;
    subtopic: string;
    detail: string;
    type: string;
    question: string;
    options: string[];
    correctAnswer: string[];
    explanation: string;
    order: string;
}

const GetQuestionsComponent: React.FC = () => {
    const [certification, setCertification] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCertification(e.target.value);
    };

    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:7071/api/GetQuestions?certification=${encodeURIComponent(certification)}`, {
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
            <h1>Get Questions for Certification</h1>
            <input
                type="text"
                value={certification}
                onChange={handleInputChange}
                placeholder="Enter Certification"
            />
            <button onClick={fetchQuestions} disabled={!certification || loading}>
                {loading ? 'Loading...' : 'Get Questions'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {questions.length > 0 && (
                <QuestionNavigator questions={questions} />
            )}
        </div>
    );
};

export default GetQuestionsComponent;