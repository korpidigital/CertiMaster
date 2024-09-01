import React, { useState } from 'react';
import GetQuestionsComponent from './QuestionsComponent';
import azureLogo from '../assets/azure-logo.svg';
import awsLogo from '../assets/aws-logo.svg';
import './SelectCloudPlatform.css';

const SelectCloudPlatform: React.FC = () => {
    const [selectedCloud, setSelectedCloud] = useState<string | null>(null);

    const handleCloudSelect = (cloud: string) => {
        setSelectedCloud(cloud);
    };

    return (
        <div className="selectCloudPlatformContainer">
            <div className={`sectionHeader ${selectedCloud != null  ? 'hide' : ''}`}>
                <div className="sectionHeaderLine"></div>
                <p className="sectionHeaderText">Select Cloud Platform</p>
            </div>

            <div className={`cloudPlatformSelection ${selectedCloud != null ? 'hide' : ''}`}>
                <div
                    className={`cloudCard ${selectedCloud === 'Azure' ? 'selected' : ''} ${selectedCloud != null && selectedCloud != 'Azure' ? 'hide' : ''}`}
                    onClick={() => handleCloudSelect('Azure')}
                >
                    <h1 className="cloudTitle">Azure</h1>
                    <img src={azureLogo} alt="Azure Logo" className="cloudBadge" />
                </div>

                <div
                    className={`cloudCard coming-soon ${selectedCloud === 'AWS' ? 'selected' : ''} ${selectedCloud != null && selectedCloud != 'AWS' ? 'hide' : ''}`}
                    onClick={() => handleCloudSelect('AWS')}
                >
                    <h1 className="cloudTitle">AWS</h1>
                    <img src={awsLogo} alt="AWS Logo" className="cloudBadge" />
                </div>
            </div>



            {selectedCloud && <GetQuestionsComponent selectedCloud={selectedCloud} />}
        </div>
    );
};

export default SelectCloudPlatform;