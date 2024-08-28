import React from 'react';
import './App.css';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import ChatGPTComponent from './components/QuestionsComponent';
import NavBar from "./components/NavBar";
import NotificationBar from "./components/NotificationBar"; 

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  if (inProgress === InteractionStatus.Login || inProgress === InteractionStatus.HandleRedirect) {
    return <div>Authentication in progress...</div>;
  }

  return (
    <div className="App">
      <NotificationBar />
      <NavBar />
      {isAuthenticated && <ChatGPTComponent />}
    </div>
  );
}

export default App;