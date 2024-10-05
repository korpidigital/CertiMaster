import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { certificationAtom, questionsAtom, loadingAtom, errorAtom } from '../atoms';
import { CertificationData } from '../interfaces';
import az204Data from '../../../az-204.json';
import ai900Data from '../../../az-204.json'; // New JSON data for AI-900
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import './SelectCertificationQuestions.css';
import az204certificationBadge from '../assets/az-204-badge.svg';
import ai900certificationBadge from '../assets/ai-900-badge.svg'; // New badge for AI-900
import { GridLoader } from 'react-spinners';

interface SelectCertificationQuestionsProps {
    onGenerateQuestions: (selectedTypes: string[], selectedTopics: string[], selectedQuestionCount: number) => void;
    cloud: string; // New prop for cloud platform
}

export default function SelectCertificationQuestions({ onGenerateQuestions, cloud }: SelectCertificationQuestionsProps) {
    const [certification, setCertification] = useAtom(certificationAtom);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [, setQuestions] = useAtom(questionsAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);

    const [types, setTypes] = useState<string[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10); // Default to 10 questions
    const [isCertificationSelected, setIsCertificationSelected] = useState<boolean>(false); // Track if certification is selected
    const [isFilterSectionOpen, setIsFilterSectionOpen] = useState<boolean>(true); // Control the accordion state
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (certification) {
            fetchQuestions(certification);
        }
    }, [certification]);

    const fetchQuestions = async (certi: string) => {
        setCertification(certi);
        setLoading(true);
        setError(null);
        setDataLoaded(false);

        try {
            const response = await fetch(`http://localhost:7071/api/GetQuestions?certification=${encodeURIComponent(certi)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                try {
                    const data = await response.json();
                    setQuestions(data);
                    setIsCertificationSelected(true); // Set certification as selected upon successful fetch
                    setIsFilterSectionOpen(true); // Open filter section when certification is selected
                    setDataLoaded(true);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setError('Failed to parse response as JSON');
                }
            } else {
                const errorText = await response.text();
                setError(`Error: ${response.status} - ${errorText}`);
            }
        } catch (err) {
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const initializeFilters = (data: CertificationData) => {
        setTypes(data.Types || []);
        setTopics(data.Topics.map((topic) => topic.Topic) || []);
        setSelectedTypes(data.Types || []); // Select all by default
        setSelectedTopics(data.Topics.map((topic) => topic.Topic) || []); // Select all by default
    };

    const handleCertificationClick = (certi: string, data: CertificationData) => {
        initializeFilters(data);
        setCertification(certi);
        setIsCertificationSelected(true);
        setIsFilterSectionOpen(true);
    };

    const toggleSelection = (
        item: string,
        selectedItems: string[],
        setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (selectedItems.includes(item)) {
            setSelectedItems(selectedItems.filter((i) => i !== item));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const selectAll = (items: string[], setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>) => {
        setSelectedItems(items);
    };

    const deselectAll = (setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>) => {
        setSelectedItems([]);
    };

    const handleGenerate = () => {
        onGenerateQuestions(selectedTypes, selectedTopics, selectedQuestionCount);
        setIsFilterSectionOpen(false); // Close filter section when questions are generated
    };

    const certifications = cloud === 'Azure' ? ['AZ-204', 'AI-900'] : ['AWS Certified Developer', 'AWS Certified Solutions Architect']; // Example AWS certifications

    return (
        <div className="selectCertificationContainer">
            <div className="selectCertificationContainer">
                <div className={`sectionHeader ${certification != '' ? 'hide' : ''}`}>
                    <div className="sectionHeaderLine"></div>
                    <p className="sectionHeaderText">Select Certification</p>
                </div>
                {/* The code to display the certification cards will go here */}
            </div>
            <div className={`certificationSelection`}>
                {certifications.includes('AZ-204') && (
                    <div
                        className={`certificationCard ${certification === 'AZ-204' ? 'selected' : ''} ${certification != '' && certification != 'AZ-204' ? 'hide' : ''}`}
                        onClick={() => handleCertificationClick('AZ-204', az204Data)}
                    >
                        <h1 className="certificationTitle">AZ-204</h1>
                        <img src={az204certificationBadge} alt="Azure Developer Associate Badge" className="certificationBadge" />
                        <h1 className="certificationTitle">Microsoft Certified: Azure Developer Associate</h1>
                    </div>
                )}

                {certifications.includes('AI-900') && (
                    <div
                        className={`certificationCard locked ${certification === 'AI-900' ? 'selected' : ''} ${certification != '' && certification != 'AI-900' ? 'hide' : ''}`}
                        onClick={() => handleCertificationClick('AI-900', ai900Data)}
                    >
                        <h1 className="certificationTitle">AI-900</h1>
                        <img src={ai900certificationBadge} alt="Azure AI Fundamentals Badge" className="certificationBadge" />
                        <h1 className="certificationTitle">Microsoft Certified: Azure AI Fundamentals</h1>
                    </div>
                )}

                {/* Add similar blocks for AWS certifications if needed */}
            </div>

            {loading && (
                <div className="loadingSpinner">
                    <GridLoader color="#ffd700" size={20} />
                </div>
            )}
            {error && <p className="errorMessage">{error}</p>}

            {isCertificationSelected && !loading && dataLoaded && (
                <>
                    <div className="sectionHeader questions">
                        <div className="sectionHeaderLine"></div>
                        <p className="sectionHeaderText">Generate Questions</p>
                    </div>
                    <div className="filtterAccordion">
                        <div className="accordionHeader" onClick={() => setIsFilterSectionOpen(!isFilterSectionOpen)}>
                            <h2>Filter {certification} Questions</h2>
                            <FontAwesomeIcon
                                icon={isFilterSectionOpen ? faChevronUp : faChevronDown}
                                className="accordionArrow"
                            />
                        </div>

                        <div className={`filterSection ${isFilterSectionOpen ? 'open' : ''}`}>
                            <div className="filterSubSection">
                                <h3>Question Types</h3>
                                <div className="filterButtons">
                                    <button
                                        className={`selectAllButton ${selectedTypes.length === types.length ? 'selected' : ''}`}
                                        onClick={() => selectAll(types, setSelectedTypes)}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        className={`unselectAllButton ${selectedTypes.length === 0 ? 'selected' : ''}`}
                                        onClick={() => deselectAll(setSelectedTypes)}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                                <div className="filterOptionsContainer">
                                    {types.map((type) => (
                                        <div
                                            key={type}
                                            className={`filterOption ${selectedTypes.includes(type) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                                        >
                                            {type}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filterSubSection">
                                <h3>Question Topics</h3>
                                <div className="filterButtons">
                                    <button
                                        className={`selectAllButton ${selectedTopics.length === topics.length ? 'selected' : ''}`}
                                        onClick={() => selectAll(topics, setSelectedTopics)}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        className={`unselectAllButton ${selectedTopics.length === 0 ? 'selected' : ''}`}
                                        onClick={() => deselectAll(setSelectedTopics)}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                                <div className="filterOptionsContainer">
                                    {topics.map((topic) => (
                                        <div
                                            key={topic}
                                            className={`filterOption ${selectedTopics.includes(topic) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection(topic, selectedTopics, setSelectedTopics)}
                                        >
                                            {topic}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filterSubSection">
                                <h3>Select Number of Questions</h3>
                                <div className="filterOptionsContainer">
                                    {[10, 20, 30, 40, 50].map((count) => (
                                        <div
                                            key={count}
                                            className={`questionCountOption ${selectedQuestionCount === count ? 'selected' : ''}`}
                                            onClick={() => setSelectedQuestionCount(count)}
                                        >
                                            {count}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button className="generateQuestionsButton" onClick={handleGenerate} disabled={loading}>
                                Generate Questions
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}