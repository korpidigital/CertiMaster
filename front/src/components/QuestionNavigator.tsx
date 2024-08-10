import React from 'react';
import './QuestionNavigator.css'; // Ensure the path is correct
import { useAtom } from 'jotai';
import { selectedOptionsPerQuestionAtom, questionSubmissionStateAtom } from '../atoms'; // Import your atoms
import { Question } from '../interfaces/question';

interface QuestionNavigatorProps {
    questions: Question[];
    onApprove: (id: string) => void; // Callback for approving a question
    onDelete: (id: string, certification: string) => void; // Callback for deleting a question
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ questions, onApprove, onDelete }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [selectedOptionsPerQuestion, setSelectedOptionsPerQuestion] = useAtom(selectedOptionsPerQuestionAtom);
    const [questionSubmissionState, setQuestionSubmissionState] = useAtom(questionSubmissionStateAtom);

    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];

    // Initialize the selected options and submission state for each question
    React.useEffect(() => {
        if (selectedOptionsPerQuestion.length === 0) {
            setSelectedOptionsPerQuestion(new Array(totalQuestions).fill([]));
        }
        if (questionSubmissionState.length === 0) {
            setQuestionSubmissionState(new Array(totalQuestions).fill(null));
        }
    }, [totalQuestions, selectedOptionsPerQuestion, setSelectedOptionsPerQuestion, questionSubmissionState, setQuestionSubmissionState]);

    // Ensure the selectedOptions array exists for the current question
    const selectedOptions = selectedOptionsPerQuestion[currentIndex] || [];
    const currentSubmissionState = questionSubmissionState[currentIndex];

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

    const handleOptionSelect = (option: string) => {
        if (currentSubmissionState) return; // Disable selection after submission
        const updatedSelectedOptions = selectedOptions.includes(option)
            ? selectedOptions.filter(o => o !== option)
            : [...selectedOptions, option];
        const updatedSelectedOptionsPerQuestion = [...selectedOptionsPerQuestion];
        updatedSelectedOptionsPerQuestion[currentIndex] = updatedSelectedOptions;
        setSelectedOptionsPerQuestion(updatedSelectedOptionsPerQuestion);
    };

    const keepPrefix = (option: string) => option.match(/^[A-D]\)/)?.[0] || '';

    const handleSubmit = () => {
        const isCorrect = selectedOptions
            .map(option => keepPrefix(option)) // Keep only the prefix of the selected options
            .sort()
            .join() === correctAnswer
            .map(answer => keepPrefix(answer)) // Keep only the prefix of the correct answers
            .sort()
            .join();
        const updatedSubmissionState = [...questionSubmissionState];
        updatedSubmissionState[currentIndex] = isCorrect ? 'correct' : 'wrong';
        setQuestionSubmissionState(updatedSubmissionState);
    };

    return (
        <div>
            <div className='questionInfo'>
                <div className="infoBlock">
                    <div className="infoItem">
                        <strong>Topic:</strong> {currentQuestion.topic || 'N/A'}
                    </div>
                    <div className="infoItem">
                        <strong>Subtopic:</strong> {currentQuestion.subtopic || 'N/A'}
                    </div>
                    <div className="infoItem">
                        <strong>Detail:</strong> {currentQuestion.detail || 'N/A'}
                    </div>
                    <div className="infoItem">
                        <strong>Type:</strong> {currentQuestion.type || 'N/A'}
                    </div>
                </div>
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
                <div className="questionNumber">
                    <strong>Question:</strong> {currentIndex + 1} of {totalQuestions}
                    {currentQuestion.approved && <span className="approvedCheckmark">✔️</span>}
                </div>
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
                                <li
                                    key={optionIndex}
                                    className={selectedOptions.includes(option) ? 'selectedOption' : ''}
                                    onClick={() => handleOptionSelect(option)}
                                    style={{
                                        cursor: currentSubmissionState ? 'not-allowed' : 'pointer',
                                        border: selectedOptions.includes(option) ? '2px solid #4CAF50' : 'none'
                                    }}
                                >
                                    {option}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className='questionItem'>
                    <button
                        className='button submitButton'
                        onClick={handleSubmit}
                        disabled={selectedOptions.length === 0 || currentSubmissionState !== null}
                    >
                        Submit
                    </button>
                    {currentSubmissionState && (
                        <div className={`submissionResult ${currentSubmissionState}`}>
                            {currentSubmissionState === 'correct' ? 'Correct!' : 'Wrong!'}
                        </div>
                    )}
                </div>

                {currentSubmissionState && (
                    <>
                        <div className='questionItem'>
                            <strong>Your Answer:</strong>
                            <div className='questionContent'>{selectedOptions.map(keepPrefix).join(', ')}</div>
                        </div>

                        <div className='questionItem'>
                            <strong>Correct Answer:</strong>
                            <div className='questionContent'>{correctAnswer.map(keepPrefix).join(', ')}</div>
                        </div>

                        <div className='questionItem'>
                            <strong>Explanation:</strong>
                            <div className='questionContent'>{currentQuestion.explanation || 'N/A'}</div>
                        </div>
                    </>
                )}

                <div className='questionItem'>
                    <strong>Order:</strong>
                    <div className='questionContent'>{currentQuestion.order || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
};