import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { QuestionNavigator } from './QuestionNavigator';
import { questionsAtom, errorAtom, questionSubmissionStateAtom, selectedOptionsPerQuestionAtom } from '../atoms';
import SelectCertificationQuestions from './SelectCertificationQuestions';
import QuestionnaireReview from './QuestionnaireReview';
import { Question } from '../interfaces';
import "./QuestionsComponent.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import the default CSS


const GetQuestionsComponent: React.FC<{ selectedCloud: string | null }> = ({ selectedCloud }) => {
    const [questions] = useAtom(questionsAtom);
    const [error] = useAtom(errorAtom);
    const [showQuestions, setShowQuestions] = useState(false);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [questionSubmissionState, setQuestionSubmissionState] = useAtom(questionSubmissionStateAtom);
    const [showReview, setShowReview] = useState(false);
    const [, setSelectedOptionsPerQuestion] = useAtom(selectedOptionsPerQuestionAtom);

    const shuffleArray = <T,>(array: T[]): T[] => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const handleGenerateQuestions = (
        selectedTypes: string[],
        selectedTopics: string[],
        selectedQuestionCount: number
    ): void => {
        const filtered = questions.filter(
            (question) => selectedTypes.includes(question.type) && selectedTopics.includes(question.topic)
        );

        const questionsByTopic: Record<string, Question[]> = {};
        selectedTopics.forEach((topic) => {
            questionsByTopic[topic] = shuffleArray(filtered.filter((question) => question.topic === topic));
        });

        const evenlyDistributedQuestions: Question[] = [];
        let topicIndex = 0;

        while (evenlyDistributedQuestions.length < selectedQuestionCount) {
            const currentTopic = selectedTopics[topicIndex];
            const topicQuestions = questionsByTopic[currentTopic];

            if (topicQuestions.length > 0) {
                evenlyDistributedQuestions.push(topicQuestions.pop() as Question);
            }

            topicIndex = (topicIndex + 1) % selectedTopics.length;
        }

        const finalQuestions: Question[] = shuffleArray(evenlyDistributedQuestions);

        setFilteredQuestions(finalQuestions);
        setShowQuestions(true);
    };

    useEffect(() => {
        if (filteredQuestions.length > 0 && questionSubmissionState.length === filteredQuestions.length) {
            setShowReview(true);
        }
    }, [questionSubmissionState, filteredQuestions]);

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
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/UpdateQuestionApproval`, {
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
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/DeleteQuestion?id=${id}&certification=${encodeURIComponent(certification)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                // Show a success toast notification
                toast.success('Question successfully deleted!', {
                    autoClose: 3000, // Automatically close after 3 seconds
                });

                setFilteredQuestions((prevQuestions) => {
                    // Create the updated filteredQuestions array
                    const updatedQuestions = prevQuestions.filter((question) => question.id !== id);

                    // Remove the submission state for the deleted question
                    setQuestionSubmissionState((prevState) =>
                        prevState.filter((_, index) => prevQuestions[index]?.id !== id)
                    );

                    // Remove the selected options state for the deleted question
                    setSelectedOptionsPerQuestion((prevState) =>
                        prevState.filter((_, index) => prevQuestions[index]?.id !== id)
                    );

                    return updatedQuestions; // Return the new filtered questions
                });
            } else {
                const errorMessage = await response.text();
                // Show an error toast notification
                toast.error(`Failed to delete question: ${errorMessage}`, {
                    autoClose: 5000, // Automatically close after 5 seconds
                });
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            // Show a general error toast
            toast.error('An error occurred while deleting the question. Please try again.', {
                autoClose: 5000, // Automatically close after 5 seconds
            });
        }
    };

    return (
        <div className='componentContainer'>
            {selectedCloud ? (
                <SelectCertificationQuestions
                    onGenerateQuestions={handleGenerateQuestions}
                    cloud={selectedCloud}
                />
            ) : (
                <br />
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {showQuestions && filteredQuestions.length > 0 && (
                <div>
                    <QuestionNavigator
                        questions={filteredQuestions}
                        onApprove={handleApprove}
                        onDelete={handleDelete}
                    />
                </div>
            )}
            {showReview && <QuestionnaireReview />}
        </div>
    );
};

export default GetQuestionsComponent;