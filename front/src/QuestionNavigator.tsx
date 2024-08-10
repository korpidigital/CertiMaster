import React, { useState } from 'react';

// Define the structure of a question
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

interface QuestionNavigatorProps {
    questions: Question[];
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ questions }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];

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

    return (
        <div>
            <h2>
                Question {currentIndex + 1} of {totalQuestions}
            </h2>
            <div>
                <strong>Question:</strong> {currentQuestion.question}
                <br />
                <strong>Topic:</strong> {currentQuestion.topic || 'N/A'}
                <br />
                <strong>Subtopic:</strong> {currentQuestion.subtopic || 'N/A'}
                <br />
                <strong>Detail:</strong> {currentQuestion.detail || 'N/A'}
                <br />
                <strong>Type:</strong> {currentQuestion.type || 'N/A'}
                <br />
                <strong>Options:</strong>
                <ul>
                    {options.map((option, optionIndex) => (
                        <li key={optionIndex}>{option}</li>
                    ))}
                </ul>
                <strong>Correct Answer:</strong> {correctAnswer.join(', ')}
                <br />
                <strong>Explanation:</strong> {currentQuestion.explanation || 'N/A'}
                <br />
                <strong>Order:</strong> {currentQuestion.order || 'N/A'}
            </div>
            <div style={{ marginTop: '20px' }}>
                <button onClick={handleBack} disabled={currentIndex === 0}>
                    Back
                </button>
                <button onClick={handleNext} disabled={currentIndex === totalQuestions - 1}>
                    Next
                </button>
            </div>
        </div>
    );
};