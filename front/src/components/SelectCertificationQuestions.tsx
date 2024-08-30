import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { certificationAtom, questionsAtom, loadingAtom, errorAtom } from '../atoms';
import { CertificationData } from '../interfaces';
import jsonData from '../../../az-204.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import './SelectCertificationQuestions.css';
import certificationBadge from '../assets/microsoft-certified-associate-badge.svg';
import { GridLoader } from 'react-spinners';

interface SelectCertificationQuestionsProps {
    onGenerateQuestions: (selectedTypes: string[], selectedTopics: string[], selectedQuestionCount: number) => void;
}

export default function SelectCertificationQuestions({ onGenerateQuestions }: SelectCertificationQuestionsProps) {
    const [certification, setCertification] = useAtom(certificationAtom);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [questions, setQuestions] = useAtom(questionsAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);

    const [types, setTypes] = useState<string[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10); // Default to 10 questions
    const [isCertificationSelected, setIsCertificationSelected] = useState<boolean>(false); // Track if certification is selected
    const [isFilterSectionOpen, setIsFilterSectionOpen] = useState<boolean>(true); // Control the accordion state

    useEffect(() => {
        initializeFilters(jsonData as CertificationData);
    }, []);

    const fetchQuestions = async (certi: string) => {
        setCertification(certi);
        setLoading(true);
        setError(null);

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

    return (
        <div className="selectCertificationContainer">
            <div
                className={`certificationCard ${isCertificationSelected ? 'selected' : ''}`}
                onClick={() => {
                    if (!isCertificationSelected) {
                        fetchQuestions('AZ-204');
                    }
                }}
            >
                <h1 className="certificationTitle">{certification}</h1>
                <img src={certificationBadge} alt="Azure Developer Associate Badge" className="certificationBadge" />
                <h1 className="certificationTitle">Microsoft Certified: Azure Developer Associate</h1>
            </div>

            {loading && (
                <div className="loadingSpinner">
                    <GridLoader color="#ffd700" size={20} />
                </div>
            )}
            {error && <p className="errorMessage">{error}</p>}

            {isCertificationSelected && (
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
            )}
        </div>
    );
}