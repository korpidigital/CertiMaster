import React, { useState } from 'react';
import './QuestionNavigator.css'; // Ensure the path is correct
import { Question } from '../interfaces/question';

interface QuestionNavigatorProps {
    questions: Question[];
    onApprove: (id: string) => void; // Callback for approving a question
    onDelete: (id: string, certification: string) => void; // Callback for deleting a question
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ questions, onApprove, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];

    console.log(currentQuestion);

    // Parse options and correctAnswer
    let options = currentQuestion.options;
    let correctAnswer = currentQuestion.correctAnswer;

    if (typeof options === 'string') {
        try {
            options = JSON.parse(options);
        } catch (e) {
            console.error('Error parsing options:', e);
            options = [];  // fallback to empty array
        }
    }
    if (!Array.isArray(options)) {
        console.error('Options is not an array:', options);
        options = [];  // fallback to empty array
    }

    if (typeof correctAnswer === 'string') {
        try {
            correctAnswer = JSON.parse(correctAnswer);
        } catch (e) {
            console.error('Error parsing correctAnswer:', e);
            correctAnswer = [];  // fallback to empty array
        }
    }
    if (!Array.isArray(correctAnswer)) {
        console.error('CorrectAnswer is not an array:', correctAnswer);
        correctAnswer = [];  // fallback to empty array
    }

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleApprove = () => {
        onApprove(currentQuestion.id);
    };

    const handleDelete = () => {
        onDelete(currentQuestion.id, currentQuestion.certification);
    };

    return (
        <div>
            <div className='questionInfo'>
                <strong>Topic:</strong> {currentQuestion.topic || 'N/A'}
                <strong>Subtopic:</strong> {currentQuestion.subtopic || 'N/A'}
                <strong>Detail:</strong> {currentQuestion.detail || 'N/A'}
                <strong>Type:</strong> {currentQuestion.type || 'N/A'}
                <strong>Question:</strong> {currentIndex + 1} of {totalQuestions}
                {currentQuestion.approved && <span className="approvedCheckmark">✔️</span>}
            </div>
            <div className='actionButtons'>
                <button className='button approveButton' onClick={handleApprove} disabled={currentQuestion.approved}>
                    {currentQuestion.approved ? 'Approved' : 'Approve'}
                </button>
                <button className='button deleteButton' onClick={handleDelete}>
                    Delete
                </button>
            </div>
            <div className='navigationButtons'>
                <button className='button' onClick={handleBack} disabled={currentIndex === 0}>
                    Back
                </button>
                <button className='button' onClick={handleNext} disabled={currentIndex === totalQuestions - 1}>
                    Next
                </button>
            </div>
            <div className='questionText'>
                <div className='questionItem'>
                    <strong>Question:</strong>
                    <div className='questionContent'>{currentQuestion.question}</div>
                </div>

                <div className='questionItem'>
                    <strong>Options:</strong>
                    <div className='questionContent'>
                        <ul>
                            {options.map((option, optionIndex) => (
                                <li key={optionIndex}>{option}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className='questionItem'>
                    <strong>Correct Answer:</strong>
                    <div className='questionContent'>{correctAnswer.join(', ')}</div>
                </div>

                <div className='questionItem'>
                    <strong>Explanation:</strong>
                    <div className='questionContent'>{currentQuestion.explanation || 'N/A'}</div>
                </div>

                <div className='questionItem'>
                    <strong>Order:</strong>
                    <div className='questionContent'>{currentQuestion.order || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
};