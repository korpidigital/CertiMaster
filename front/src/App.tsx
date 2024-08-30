import React from 'react';
import './App.css';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import NavBar from "./components/NavBar";
import NotificationBar from "./components/NotificationBar"; 
import SelectCloudPlatform from './components/SelectCloudPlatform';

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
      {isAuthenticated && <SelectCloudPlatform />}
    </div>
  );
}

export default App;