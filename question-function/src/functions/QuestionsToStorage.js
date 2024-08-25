import { app } from '@azure/functions';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import Anthropic from "@anthropic-ai/sdk";

const isLocal = process.env.NODE_ENV === 'local';
let mockDatabase = []; // In-memory array to act as a mock database

const tableName = 'QuestionsTable';
const account = process.env.STORAGE_ACCOUNT;
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const tableClient = new TableClient(`https://${account}.table.core.windows.net`, tableName, new AzureNamedKeyCredential(account, accountKey));


function numCorrect(type) {
    switch (type) {
        case 'Standard Question':
            return 1;
        case 'Code-Based':
            return 1;
        case 'CLI Commands':
            return 1;
        case 'True Question':
            return getRandomInt(1, 4);
        case 'Scenario-Based':
            return 4;
        default:
            return 0;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomLettersAndOrderABCD(numCorrect, numPairs) {
    const questions = {};

    for (let i = 1; i <= numPairs; i++) {
        const letters = ['A', 'B', 'C', 'D'];
        for (let j = letters.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [letters[j], letters[k]] = [letters[k], letters[j]];
        }
        const correctAnswers = letters.slice(0, numCorrect).map(letter => `${letter})`);

        questions[`question${i}`] = correctAnswers;
    }

    return questions;
}

function getQuestionTypeDefinition(type) {
    switch (type) {
        case "Standard Question":
            return "Single correct answer. Order: No.";
        case "True Question":
            return "Question is always about selecting true/correct statements. Options have different statements about the topic/subtopic/detail. Can be 1,2,3 or 4 correct answers. Order: No.";
        case "Scenario-Based":
            return "Present a scenario in question and steps in options to resolve it. All options have to be part of the answer. Order: Yes.";
        case "Code-Based":
            return "Understanding of coding principles in C#, Python, or JavaScript. If question has code lines, wrap those inside <code></code> tag. Select a correct piece of code to use.";
        case "CLI Commands":
            return "Azure CLI or PowerShell tasks with code wrapped in <code></code> tag. Select a correct command to to use";
        default:
            return "Unknown question type.";
    }
}


async function generateQA(certification, topic, subtopic, detail, type, numPairs, source) {
    const numCorrectAnswers = numCorrect(type);
    const correctAnswersOrder = randomLettersAndOrderABCD(numCorrectAnswers, numPairs);
    const questionTypeDefinition = getQuestionTypeDefinition(type);

    const systemPrompt = 'You are an AI assistant that generates official certification exam questions.'
    const prompt = `Generate ${numPairs} unique and diverse questions for a certification exam in JSON format.
    Certification: ${certification}.
    Topic: ${topic}.
    Subtopic: ${subtopic}.
    Detail: ${detail}.
    Question type: ${type}.
    Question type definition: ${questionTypeDefinition}
    Number of correct answers: ${numCorrectAnswers}.
    Put correct answers in these letters and in this order (correctAnswersOrder): ${JSON.stringify(correctAnswersOrder)}.
    Do not include options in the "question", but always in "options"
    Output only the questions in JSON format without introductory text in a format like below. JSON objects in array like [{<question1>},{<question2>}]
    Do NOT ask too easy or obvious questions.
    If question has code lines, wrap those inside <code></code> tag.
    "order": "Yes"/"No" - field is telling if question needs to be answered in specific order.
    "explanation": "" - field is telling WHY the correct answer is correct and giving useful details about it.
    "correctAnswer": [""], - array of prefixes of correct answers. Value of correctAnswersOrder from right question key.
    Format:
    [
        {
        "type": "${type}",
        "topic": "${topic}",
        "subtopic": "${subtopic}",
        "detail": "${detail}",
        "question": "",
        "options": ["A) ''", "B) ''", "C) ''", "D) ''"],
        "correctAnswer": [""],
        "explanation": "",
        "order": "Yes"/"No",
        "source": "${source}"
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
        "order": "Yes"/"No",
        "source": "${source}"
        }
    ]`;

    let response;

    if (source == "chatGPT") {

        response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4096, // literally max
                n: 1,
                stop: null,
                temperature: 0.5
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
    } else if (source === 'Claude') {
        // Claude API integration
        response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 4096,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        const data = await response.json();
        console.log('Claude API Response:', JSON.stringify(data, null, 2));

        if (!data || !data.content || data.content.length === 0) {
            throw new Error('Invalid response from Claude API');
        }

        let qaPairs;
        try {
            const responseText = data.content[0].text.trim();
            qaPairs = JSON.parse(responseText);

            if (!Array.isArray(qaPairs)) {
                qaPairs = [qaPairs];
            }
        } catch (error) {
            console.error('Error parsing JSON response from Claude:', data.content[0].text.trim());
            throw new Error('Failed to parse response from Claude API');
        }

        return qaPairs;
    } else {
        console.log('Select a valid Source!');
        return [];
    }
}

async function saveToTableStorage(item) {
    const entity = {
        partitionKey: item.certification,
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
        order: item.order,
        approval: item.approval,
        source: item.source
    };
    await tableClient.createEntity(entity);
}

async function generateAllQuestionsFromFile(filePath, numPairs, source) {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const { Certification, Topics, Types } = jsonData;

    for (const topicObj of Topics) {
        const topic = topicObj.Topic;
        for (const subtopicObj of topicObj.Subtopics) {
            const subtopic = subtopicObj.Subtopic;
            for (const detail of subtopicObj.Details) {
                for (const type of Types) {
                    const qaPairs = await generateQA(Certification, topic, subtopic, detail, type, numPairs, source);
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
                            order: qaPair.order,
                            approved: false,
                            source: qaPair.source
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

        const { certification, topic, subtopic, detail, numPairs, questionType, all, filePath, source } = body;

        try {
            if (all) {
                await generateAllQuestionsFromFile(path.resolve(filePath), numPairs, source);
            } else {
                const qaPairs = await generateQA(certification, topic, subtopic, detail, questionType, numPairs, source);
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
                        order: qaPair.order,
                        approved: false,
                        source: qaPair.source
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