import React, { useRef, useEffect } from 'react';
import './QuestionNavigator.css'; // Ensure the path is correct
import { useAtom } from 'jotai';
import { selectedOptionsPerQuestionAtom, questionSubmissionStateAtom } from '../atoms';
import { Question } from '../interfaces';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faClipboardList, faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

interface QuestionNavigatorProps {
    questions: Question[];
    onApprove: (id: string) => void;
    onDelete: (id: string, certification: string) => void;
    scrollToInfo?: boolean; // New prop to indicate if we need to scroll to questionInfo
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
    questions, 
    onApprove, 
    onDelete, 
    scrollToInfo = false // Default to false
}) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [selectedOptionsPerQuestion, setSelectedOptionsPerQuestion] = useAtom(selectedOptionsPerQuestionAtom);
    const [questionSubmissionState, setQuestionSubmissionState] = useAtom(questionSubmissionStateAtom);

    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];

    // Reference to the questionInfo div
    const questionInfoRef = useRef<HTMLDivElement>(null);

    // Scroll to questionInfo when scrollToInfo prop is true
    useEffect(() => {
        if (scrollToInfo && questionInfoRef.current) {
            questionInfoRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [scrollToInfo]);

    React.useEffect(() => {
        if (selectedOptionsPerQuestion.length === 0) {
            setSelectedOptionsPerQuestion(new Array(totalQuestions).fill([]));
        }
        if (questionSubmissionState.length === 0) {
            setQuestionSubmissionState(new Array(totalQuestions).fill(null));
        }
    }, [totalQuestions, selectedOptionsPerQuestion, setSelectedOptionsPerQuestion, questionSubmissionState, setQuestionSubmissionState]);

    const selectedOptions = selectedOptionsPerQuestion[currentIndex] || [];
    const currentSubmissionState = questionSubmissionState[currentIndex];

    let options: string[] = currentQuestion.options;
    let correctAnswer: string[] = currentQuestion.correctAnswer;

    if (typeof options === 'string') {
        try {
            options = JSON.parse(options);
        } catch (e) {
            console.error('Error parsing options:', e);
            options = [];
        }
    }
    if (!Array.isArray(options)) {
        console.error('Options is not an array:', options);
        options = [];
    }

    if (typeof correctAnswer === 'string') {
        try {
            correctAnswer = JSON.parse(correctAnswer);
        } catch (e) {
            console.error('Error parsing correctAnswer:', e);
            correctAnswer = [];
        }
    }
    if (!Array.isArray(correctAnswer)) {
        console.error('CorrectAnswer is not an array:', correctAnswer);
        correctAnswer = [];
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
        if (currentSubmissionState) return;

        let updatedSelectedOptions: string[];
        if (selectedOptions.includes(option)) {
            updatedSelectedOptions = selectedOptions.filter(o => o !== option);
        } else {
            updatedSelectedOptions = [...selectedOptions, option];
        }

        const updatedSelectedOptionsPerQuestion = [...selectedOptionsPerQuestion];
        updatedSelectedOptionsPerQuestion[currentIndex] = updatedSelectedOptions;
        setSelectedOptionsPerQuestion(updatedSelectedOptionsPerQuestion);
    };

    const keepPrefix = (option: string) => option.match(/^[A-D]\)/)?.[0] || '';

    const handleSubmit = () => {
        let selected = selectedOptions.map(option => keepPrefix(option));
        let correct = correctAnswer.map(answer => keepPrefix(answer));

        if (currentQuestion.order === "No") {
            selected = selected.sort();
            correct = correct.sort();
        }

        const isCorrect = selected.join() === correct.join();

        const updatedSubmissionState = [...questionSubmissionState];
        updatedSubmissionState[currentIndex] = isCorrect ? 'correct' : 'wrong';
        setQuestionSubmissionState(updatedSubmissionState);
    };

    return (
        <div>
            <div className='questionInfo' ref={questionInfoRef}>
                <div className="infoBlock">
                    <div className="infoItem">
                        <FontAwesomeIcon icon={faBook} />
                        <strong>Topic:</strong> {currentQuestion.topic || 'N/A'}
                    </div>
                    <div className="infoItem">
                        <FontAwesomeIcon icon={faClipboardList} />
                        <strong>Subtopic:</strong> {currentQuestion.subtopic || 'N/A'}
                    </div>
                    <div className="infoItem">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <strong>Detail:</strong> {currentQuestion.detail || 'N/A'}
                    </div>
                    <div className="infoItem">
                        <FontAwesomeIcon icon={faQuestionCircle} />
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
                                        border: selectedOptions.includes(option) ? '2px solid #4CAF50' : '1px solid #ddd',
                                        backgroundColor: selectedOptions.includes(option) ? '#e0f7fa' : 'transparent',
                                        color: selectedOptions.includes(option) ? '#00796b' : '',
                                        boxShadow: selectedOptions.includes(option) ? '0px 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
                                        transform: selectedOptions.includes(option) ? 'scale(1.05)' : 'none',
                                        transition: 'all 0.3s ease',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        marginBottom: '8px'
                                    }}
                                >
                                    <strong>{option.slice(0, 2)}</strong>{option.slice(2)}
                                    {currentQuestion.order === "Yes" && selectedOptions.includes(option) && (
                                        <span className="optionOrderNumber">
                                            {selectedOptions.indexOf(option) + 1}
                                        </span>
                                    )}
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
                            <div className='questionContent'>
                                {selectedOptions.map((option, index) => (
                                    <span key={index}>
                                        {keepPrefix(option)}
                                        {currentQuestion.order === "Yes" && (
                                            <span style={{ marginLeft: '5px', fontWeight: 'bold', color: '#ff9800' }}>
                                                {index + 1}
                                            </span>
                                        )}
                                        {index < selectedOptions.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className='questionItem'>
                            <strong>Correct Answer:</strong>
                            <div className='questionContent'>
                                {correctAnswer.map((option, index) => (
                                    <span key={index}>
                                        {keepPrefix(option)}
                                        {currentQuestion.order === "Yes" && (
                                            <span style={{ marginLeft: '5px', fontWeight: 'bold', color: '#4CAF50' }}>
                                                {index + 1}
                                            </span>
                                        )}
                                        {index < correctAnswer.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </div>
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