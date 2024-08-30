import React, { useState, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { QuestionNavigator } from './QuestionNavigator';
import { questionsAtom, errorAtom, questionSubmissionStateAtom } from '../atoms';
import SelectCertificationQuestions from './SelectCertificationQuestions';
import QuestionnaireReview from './QuestionnaireReview';
import { Question } from '../interfaces';
import "./QuestionsComponent.css"

const GetQuestionsComponent: React.FC = () => {
    const [questions] = useAtom(questionsAtom); // Fetched questions
    const [error] = useAtom(errorAtom);
    const [showQuestions, setShowQuestions] = useState(false); // Control visibility of questions
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]); // Store filtered questions
    const questionNavigatorRef = useRef<HTMLDivElement>(null); // Ref for scrolling
    const [questionSubmissionState] = useAtom(questionSubmissionStateAtom);
    const [showReview, setShowReview] = useState(false); // State to track when to show the review

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
        // Filter questions by the selected types and topics
        const filtered = questions.filter(
            (question) => selectedTypes.includes(question.type) && selectedTopics.includes(question.topic)
        );
    
        // Group questions by topic and shuffle each group's questions
        const questionsByTopic: Record<string, Question[]> = {};
        selectedTopics.forEach((topic) => {
            questionsByTopic[topic] = shuffleArray(filtered.filter((question) => question.topic === topic));
        });
    
        // Distribute questions evenly across topics
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
    
        // Final shuffle for randomness
        const finalQuestions: Question[] = shuffleArray(evenlyDistributedQuestions);
    
        setFilteredQuestions(finalQuestions);
        setShowQuestions(true);
    };

    useEffect(() => {
        if (showQuestions && questionNavigatorRef.current) {
            questionNavigatorRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [showQuestions]);

    // Check if all questions have been answered to show the review
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
        <div className='componentContainer'>
            <SelectCertificationQuestions onGenerateQuestions={handleGenerateQuestions} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {showQuestions && filteredQuestions.length > 0 && (
                <div ref={questionNavigatorRef}>
                    <QuestionNavigator
                        questions={filteredQuestions} // Pass filtered questions
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