import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { QuestionNavigator } from './QuestionNavigator';
import { questionsAtom, loadingAtom, errorAtom } from '../atoms';
import SelectCertificationQuestions from './SelectCertificationQuestions';
import { Question } from '../interfaces';

const GetQuestionsComponent: React.FC = () => {
    const [questions] = useAtom(questionsAtom); // Fetched questions
    const [loading] = useAtom(loadingAtom);
    const [error] = useAtom(errorAtom);
    const [showQuestions, setShowQuestions] = useState(false); // Control visibility of questions
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]); // Store filtered questions

    const handleGenerateQuestions = (selectedTypes: string[], selectedTopics: string[], selectedQuestionCount: number) => {
        // Apply filters to the fetched questions
        const filtered = questions
            .filter(question =>
                selectedTypes.includes(question.type) &&
                selectedTopics.includes(question.topic)
            )
            .slice(0, selectedQuestionCount); // Limit to the selected number of questions

        setFilteredQuestions(filtered);
        setShowQuestions(true);
    };

    const handleApprove = async (id: string) => {
        const questionToUpdate = filteredQuestions.find(question => question.id === id);
    
        if (questionToUpdate) {
            const newApprovedStatus = !questionToUpdate.approved;
            setFilteredQuestions(prevQuestions =>
                prevQuestions.map(question =>
                    question.id === id ? { ...question, approved: newApprovedStatus } : question
                )
            );
    
            try {
                const response = await fetch(`http://localhost:7071/api/UpdateQuestionApproval`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: id,
                        certification: questionToUpdate.certification,
                        approved: newApprovedStatus
                    })
                });
    
                if (!response.ok) {
                    setFilteredQuestions(prevQuestions =>
                        prevQuestions.map(question =>
                            question.id === id ? { ...question, approved: questionToUpdate.approved } : question
                        )
                    );
                    console.error('Failed to update approval status in the database');
                }
            } catch (error) {
                console.error('Error updating approval status:', error);
                setFilteredQuestions(prevQuestions =>
                    prevQuestions.map(question =>
                        question.id === id ? { ...question, approved: questionToUpdate.approved } : question
                    )
                );
            }
        }
    };

    const handleDelete = async (id: string, certification: string) => {
        try {
            await fetch(`http://localhost:7071/api/DeleteQuestion?id=${id}&certification=${encodeURIComponent(certification)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            setFilteredQuestions(prevQuestions =>
                prevQuestions.filter(question => question.id !== id)
            );
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };

    return (
        <div>
            <SelectCertificationQuestions onGenerateQuestions={handleGenerateQuestions} />
            {loading ? 'Loading...' : ''}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {showQuestions && filteredQuestions.length > 0 && (
                <QuestionNavigator
                    questions={filteredQuestions} // Pass filtered questions
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default GetQuestionsComponent;