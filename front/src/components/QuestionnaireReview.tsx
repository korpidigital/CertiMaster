import React from 'react';
import { useAtom } from 'jotai';
import { questionSubmissionStateAtom } from '../atoms';
import './QuestionnaireReview.css';

const QuestionnaireReview: React.FC = () => {
    const [questionSubmissionState] = useAtom(questionSubmissionStateAtom);

    // Filter out any null or undefined entries
    const validSubmissions = questionSubmissionState.filter(submission => submission !== null && submission !== undefined);

    const correctAnswers = validSubmissions.filter(q => q.correct).length;
    const incorrectAnswers = validSubmissions.length - correctAnswers;
    const totalQuestions = validSubmissions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    return (
        <div className='reviewContainer'>
            <h2>Questionnaire Review</h2>
            <p>Total Questions: {totalQuestions}</p>
            <p>Correct Answers: {correctAnswers}</p>
            <p>Incorrect Answers: {incorrectAnswers}</p>
            <p>Your Score: {score.toFixed(2)}%</p>

            <h3>Details:</h3>
            <ul>
                {validSubmissions.map((submission, index) => (
                    <li key={submission.questionId}>
                        <strong>Question {index + 1}:</strong> {submission.correct ? 'Correct' : 'Wrong'}
                        <ul>
                            <li><strong>Your Answer(s):</strong> {submission.selectedOptions.join(', ')}</li>
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QuestionnaireReview;
