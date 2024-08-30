import React, { useState } from 'react';
import GetQuestionsComponent from './QuestionsComponent';
import azureLogo from '../assets/azure-logo.svg'; // Azure logo
import awsLogo from '../assets/aws-logo.svg'; // AWS logo
import './SelectCloudPlatform.css'; // Add necessary CSS for styling

const SelectCloudPlatform: React.FC = () => {
    const [selectedCloud, setSelectedCloud] = useState<string | null>(null);

    const handleCloudSelect = (cloud: string) => {
        setSelectedCloud(cloud);
    };

    return (
        <div className="selectCloudPlatformContainer">
            <div className="cloudPlatformSelection">
                <div
                    className={`cloudCard ${selectedCloud === 'Azure' ? 'selected' : ''}`}
                    onClick={() => handleCloudSelect('Azure')}
                >
                    <h1 className="cloudTitle">Azure</h1>
                    <img src={azureLogo} alt="Azure Logo" className="cloudBadge" />
                </div>

                <div
                    className={`cloudCard ${selectedCloud === 'AWS' ? 'selected' : ''}`}
                    onClick={() => handleCloudSelect('AWS')}
                >
                    <h1 className="cloudTitle">AWS</h1>
                    <img src={awsLogo} alt="AWS Logo" className="cloudBadge" />
                </div>
            </div>

            <GetQuestionsComponent selectedCloud={selectedCloud} />
        </div>
    );
};

export default SelectCloudPlatform;