import React, { useState } from 'react';
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

const topics = [
  'Develop Azure Compute Solutions',
  'Develop for Azure Storage',
  'Implement Azure Security',
  'Monitor, Troubleshoot, and Optimize Azure Solutions',
  'Connect to and Consume Azure Services and Third-Party Services'
];

const ChatGPTComponent = () => {
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topicQuestion, setTopicQuestion] = useState('');
  const [answerExplanation, setAnswerExplanation] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleTopicChange = (topic) => {
    setSelectedTopics(prevTopics =>
      prevTopics.includes(topic)
        ? prevTopics.filter(t => t !== topic)
        : [...prevTopics, topic]
    );
  };

  const handleAnswerChange = (option) => {
    setUserAnswers(prevAnswers =>
      prevAnswers.includes(option)
        ? prevAnswers.filter(a => a !== option)
        : [...prevAnswers, option]
    );
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const fetchGeneratedText = async () => {
    setLoading(true);
    try {
      const prompt = `One Az-204 Multiple-Choice Question with headers 
        "Topic", "Question", "Options", "Correct answer" with just a correct alphabet like "A)" or if multiple answers separate with comma like "A), C)" and "Explanation". 
        Format the output using HTML tags <div> and <h3> for headers and <code> only for code snippets and <li> for options also make option Alphabet like "A)" bold. 
        Include a new test-like question that is detailed and reflective of the actual exam format. 
        Do not add any pre-answer like "Sure here is...". 
        Certification exam often includes questions and answers that feature code snippets and CLI syntax. 
        Question from one of these topics: ${selectedTopics.join(', ')}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an official certification program. You know what kind of questions are asked in the latest official certification tests' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 700
      });

      const messageContent = response.choices[0].message?.content || 'No response from the model';

      // Split the messageContent at the point where "Correct answer" appears
      const splitMessageAtCorrectAnswer = (content) => {
        const correctAnswerDelimiter = '<h3>Correct answer';

        const correctAnswerIndex = content.indexOf(correctAnswerDelimiter);

        if (correctAnswerIndex === -1) {
          return {
            topicQuestion: 'Delimiter "Correct answer" not found',
            answerExplanation: 'Delimiter "Correct answer" not found'
          };
        }

        const topicQuestion = content.slice(0, correctAnswerIndex).trim();
        const answerExplanation = content.slice(correctAnswerIndex).trim();

        return { topicQuestion, answerExplanation };
      };

      const { topicQuestion, answerExplanation } = splitMessageAtCorrectAnswer(messageContent);

      // Extract the correct answer for validation later
      const correctAnswerMatch = answerExplanation.match(/<h3>Correct answer<\/h3>\s*([A-Z])/);
      const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1].trim() : '';

      setGeneratedText(messageContent);
      setTopicQuestion(topicQuestion);
      setAnswerExplanation(answerExplanation);
      setCorrectAnswer(correctAnswer);
      setIsSubmitted(false);
      setUserAnswers([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setGeneratedText('Error fetching data');
    }
    setLoading(false);
  };

  const isAnswerCorrect = () => {
    const correctAnswers = correctAnswer.split(',').map(a => a.trim());
    console.log(correctAnswer);
    console.log(userAnswers);
    return correctAnswers.every(answer =>
      userAnswers.some(userAnswer => userAnswer.includes(`<li><b>${answer})</b>`))
    );
  };

  const renderFeedback = () => {
    if (isSubmitted) {
      return (
        <div style={{ color: isAnswerCorrect() ? 'green' : 'red' }}>
          {isAnswerCorrect() ? 'Correct answer' : 'Incorrect answer'}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div>
        <h3>Select Topics:</h3>
        {topics.map(topic => (
          <div key={topic}>
            <label>
              <input
                type="checkbox"
                checked={selectedTopics.includes(topic)}
                onChange={() => handleTopicChange(topic)}
              />
              {topic}
            </label>
          </div>
        ))}
      </div>
      <button onClick={fetchGeneratedText} disabled={loading || selectedTopics.length === 0}>
        {loading ? 'Generating...' : 'Generate Text'}
      </button>
      {!loading && topicQuestion && (
        <div>
          <div style={{ textAlign: 'start' }} dangerouslySetInnerHTML={{ __html: topicQuestion.replace(/<ul>.*<\/ul>/s, '') }} />
          <div style={{ textAlign: 'start' }}>
            {topicQuestion.match(/<li>.*?<\/li>/g)?.map((option, index) => (
              <label key={index}>
                <input
                  type="checkbox"
                  value={option}
                  checked={userAnswers.includes(option)}
                  onChange={() => handleAnswerChange(option)}
                />
                <span dangerouslySetInnerHTML={{ __html: option }} />
              </label>
            ))}
          </div>
          <button onClick={handleSubmit}>Submit</button>
          {renderFeedback()}
        </div>
      )}
      {!loading && isSubmitted && (
        <div style={{ textAlign: 'start' }} dangerouslySetInnerHTML={{ __html: answerExplanation }} />
      )}
    </div>
  );
};

export default ChatGPTComponent;