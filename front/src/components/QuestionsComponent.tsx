import React from 'react';
import { useAtom } from 'jotai';
import { QuestionNavigator } from './QuestionNavigator';
import { certificationAtom, questionsAtom, loadingAtom, errorAtom } from '../atoms';

const GetQuestionsComponent: React.FC = () => {
    const [certification, setCertification] = useAtom(certificationAtom);
    const [questions, setQuestions] = useAtom(questionsAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);

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

    const handleApprove = async (id: string) => {
        // Get the current question to determine the new approved value
        const questionToUpdate = questions.find(question => question.id === id);
    
        if (questionToUpdate) {
            // Optimistically update the local state
            const newApprovedStatus = !questionToUpdate.approved;
            setQuestions(prevQuestions =>
                prevQuestions.map(question =>
                    question.id === id ? { ...question, approved: newApprovedStatus } : question
                )
            );
    
            try {
                // Send the update request to the Azure Function
                const response = await fetch(`http://localhost:7071/api/UpdateQuestionApproval`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: id,
                        certification: questionToUpdate.certification, // Include certification as PartitionKey
                        approved: newApprovedStatus
                    })
                });
    
                if (!response.ok) {
                    // If the update failed, revert the local state change
                    setQuestions(prevQuestions =>
                        prevQuestions.map(question =>
                            question.id === id ? { ...question, approved: questionToUpdate.approved } : question
                        )
                    );
                    console.error('Failed to update approval status in the database');
                }
            } catch (error) {
                console.error('Error updating approval status:', error);
                // If the update failed, revert the local state change
                setQuestions(prevQuestions =>
                    prevQuestions.map(question =>
                        question.id === id ? { ...question, approved: questionToUpdate.approved } : question
                    )
                );
            }
        }
    };

    const handleDelete = async (id: string, certification: string) => {
        try {
            // Call the API endpoint to delete the question, passing both id (RowKey) and certification (PartitionKey)
            await fetch(`http://localhost:7071/api/DeleteQuestion?id=${id}&certification=${encodeURIComponent(certification)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    certification: certification,
                })
            });
    
            // Update the local state to remove the deleted question from the list
            setQuestions(prevQuestions =>
                prevQuestions.filter(question => question.id !== id)
            );
        } catch (error) {
            console.error('Error deleting question:', error);
            setError('Failed to delete the question');
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
                <QuestionNavigator
                    questions={questions}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default GetQuestionsComponent;