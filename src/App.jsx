import { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ConfigScreen from './components/ConfigScreen';
import ReportScreen from './components/ReportScreen';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('upload');
  const [parsedData, setParsedData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const handleFileUploaded = (data) => {
    setParsedData(data);
    setScreen('config');
  };

  const handleWeekSelected = (week) => {
    setSelectedWeek(week);
    setScreen('report');
  };

  const handleBack = () => {
    if (screen === 'report') setScreen('config');
    else if (screen === 'config') setScreen('upload');
  };

  const handleStartOver = () => {
    setParsedData(null);
    setSelectedWeek(null);
    setScreen('upload');
  };

  return (
    <div className="app">
      {screen === 'upload' && (
        <UploadScreen onFileUploaded={handleFileUploaded} />
      )}
      {screen === 'config' && parsedData && (
        <ConfigScreen
          weekColumns={parsedData.weekColumns}
          projects={parsedData.projects}
          onWeekSelected={handleWeekSelected}
          onBack={handleBack}
        />
      )}
      {screen === 'report' && parsedData && selectedWeek && (
        <ReportScreen
          projects={parsedData.projects}
          weekColumns={parsedData.weekColumns}
          selectedWeek={selectedWeek}
          onBack={handleBack}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
