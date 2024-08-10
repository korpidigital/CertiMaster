import { app } from '@azure/functions';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const isLocal = process.env.NODE_ENV === 'local';
let mockDatabase = []; // In-memory array to act as a mock database

const tableName = 'QuestionsTable';
const account = process.env.STORAGE_ACCOUNT;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const tableClient = new TableClient(`https://${account}.table.core.windows.net`, tableName, new AzureNamedKeyCredential(account, accountKey));

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function numCorrect() {
    return getRandomInt(1, 4);
}

function randomLettersAndOrderABCD(numCorrect) {
    const letters = ['A', 'B', 'C', 'D'];
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const correctAnswers = letters.slice(0, numCorrect).map(letter => `${letter})`);

    return correctAnswers;

}


async function generateQA(certification, topic, subtopic, detail, type, numPairs) {
    const numCorrectAnswers = numCorrect();
    const correctAnswersOrder = randomLettersAndOrderABCD(numCorrectAnswers);


    const prompt = `Generate ${numPairs} unique and diverse questions for a certification exam in JSON format.
    Certification: ${certification}
    Topic: ${topic}
    Subtopic: ${subtopic}
    Detail: ${detail}
    Question type: ${type}
    Question types:
    - Multiple Choice: Single or multiple correct answers.
    - Scenario-Based: Present a scenario with steps to resolve it, requiring ordered steps with varied and randomized orders.
    - Code-Based: Understanding of coding principles in C#, Python, or JavaScript, with code wrapped in single quotes 'code'.
    - CLI Commands: Azure CLI or PowerShell tasks with code wrapped in single quotes.
    
    Do the question so that these commands are true:
        - How many correct answers: ${numCorrectAnswers}
        - Correct answer letters and order: ${correctAnswersOrder}
    
    Output only the questions in JSON format without introductory text in a format like below. JSON objects in array like [{<question1>},{<question2>}]

    "order": "Yes"/"No" - field is telling if question needs to be answered in specific order.
    
    Format:
    [
        {
        "type": "${type}",
        "topic": "${topic}",
        "subtopic": "${subtopic}",
        "detail": "${detail}",
        "question": "",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correctAnswer": ${JSON.stringify(correctAnswersOrder)},
        "explanation": "",
        "order": "Yes"/"No"
        },
        {
        "type": "${type}",
        "topic": "${topic}",
        "subtopic": "${subtopic}",
        "detail": "${detail}",
        "question": "",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correctAnswer": ${JSON.stringify(correctAnswersOrder)},
        "explanation": "",
        "order": "Yes"/"No"
        }
    ]`;


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI assistant that generates official certification exam questions.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 4096,
            n: 1,
            stop: null,
            temperature: 0.7
        })
    });

    const data = await response.json();
    console.log("OpenAI API Response:", JSON.stringify(data, null, 2));

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error("Invalid response from OpenAI API");
    }

    let qaPairs;
    try {
        const responseText = data.choices[0].message.content.trim();
        const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
        qaPairs = JSON.parse(cleanedResponse);

        // Ensure qaPairs is an array
        if (!Array.isArray(qaPairs)) {
            qaPairs = [qaPairs];
        }
    } catch (error) {
        console.error("Error parsing JSON response:", data.choices[0].message.content.trim());
        throw new Error("Failed to parse response from OpenAI API");
    }

    return qaPairs;
}

async function saveToTableStorage(item) {
    const entity = {
        partitionKey: 'AZ-204',
        rowKey: item.id,
        certification: item.certification,
        topic: item.topic,
        subtopic: item.subtopic,
        detail: item.detail,
        type: item.type,
        question: item.question,
        options: JSON.stringify(item.options),
        correctAnswer: JSON.stringify(item.correctAnswer),
        explanation: item.explanation,
        order: item.order
    };
    await tableClient.createEntity(entity);
}

async function generateAllQuestionsFromFile(filePath, numPairs) {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const { Certification, Topics, Types } = jsonData;

    for (const topicObj of Topics) {
        const topic = topicObj.Topic;
        for (const subtopicObj of topicObj.Subtopics) {
            const subtopic = subtopicObj.Subtopic;
            for (const detail of subtopicObj.Details) {
                for (const type of Types) {
                    const qaPairs = await generateQA(Certification, topic, subtopic, detail, type, numPairs);
                    for (const qaPair of qaPairs) {
                        const newItem = {
                            id: uuidv4(),
                            certification: Certification,
                            topic,
                            subtopic,
                            detail,
                            type: qaPair.type,
                            question: qaPair.question,
                            options: qaPair.options,
                            correctAnswer: qaPair.correctAnswer,
                            explanation: qaPair.explanation,
                            order: qaPair.order
                        };

                        if (isLocal) {
                            mockDatabase.push(newItem); // Push to mock database
                        } else {
                            await saveToTableStorage(newItem);
                            console.log("Saved to db: ", newItem);
                        }
                    }
                }
            }
        }
    }
}

///////////////// QuestionsToStorage Function /////////////////////////////////////
// POST

app.http('QuestionsToStorage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`HTTP function processed request for URL "${request.url}"`);

        let body;
        try {
            body = await request.json();
        } catch (error) {
            context.log('Error parsing request body', error);
            return { status: 400, body: 'Invalid JSON payload' };
        }

        const { certification, topic, subtopic, detail, numPairs, questionType, all, filePath } = body;

        try {
            if (all) {
                await generateAllQuestionsFromFile(path.resolve(filePath), numPairs);
            } else {
                const qaPairs = await generateQA(certification, topic, subtopic, detail, questionType, numPairs);
                const createdItems = [];

                for (const qaPair of qaPairs) {
                    const newItem = {
                        id: uuidv4(),
                        certification,
                        topic,
                        subtopic,
                        detail,
                        type: qaPair.type,
                        question: qaPair.question,
                        options: qaPair.options,
                        correctAnswer: qaPair.correctAnswer,
                        explanation: qaPair.explanation,
                        order: qaPair.order
                    };

                    if (isLocal) {
                        mockDatabase.push(newItem); // Push to mock database
                    } else {
                        await saveToTableStorage(newItem);
                        createdItems.push(newItem);
                    }
                }

                if (isLocal) {
                    context.log('Mock Database Contents:', JSON.stringify(mockDatabase, null, 2));
                }

                return { status: 201, body: createdItems };
            }

            return { status: 201, body: "All questions generated successfully." };
        } catch (error) {
            context.log('Error generating QA pairs or writing to Table Storage', error);
            return { status: 500, body: 'Error generating QA pairs or writing to Table Storage' };
        }
    }
});