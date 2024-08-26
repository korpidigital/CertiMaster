import React from 'react';
import './App.css';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import ChatGPTComponent from './components/QuestionsComponent';
import LoginPage from './components/LoginPage';

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  if (inProgress === InteractionStatus.Login || inProgress === InteractionStatus.HandleRedirect) {
    return <div>Authentication in progress...</div>;
  }

  return (
    <div className="App">
      {!isAuthenticated && <LoginPage />}
      {isAuthenticated && <ChatGPTComponent />}
    </div>
  );
}

export default App;