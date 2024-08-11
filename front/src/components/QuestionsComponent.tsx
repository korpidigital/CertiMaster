import React from 'react';
import { useAtom } from 'jotai';
import { QuestionNavigator } from './QuestionNavigator';
import { questionsAtom, loadingAtom, errorAtom } from '../atoms';
import SelectCertificationQuestions from './SelectCertificationQuestions';

const GetQuestionsComponent: React.FC = () => {
    const [questions, setQuestions] = useAtom(questionsAtom);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);



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
            <SelectCertificationQuestions />
            {loading ? 'Loading...' : ''}
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