export interface Question {
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
    approved: boolean;
    source: string;
}

export interface JsonDetail {
    Details: string[];
}

export interface JsonSubtopic extends JsonDetail {
    Subtopic: string;
}

export interface JsonTopic {
    Topic: string;
    Subtopics: JsonSubtopic[];
}

export interface CertificationData {
    Certification: string;
    Types: string[];
    Topics: JsonTopic[];
}