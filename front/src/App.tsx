import { useEffect, useState } from 'react';
import './App.css';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { AccountInfo, InteractionStatus } from '@azure/msal-browser';
import NavBar from './components/NavBar';
import NotificationBox from './components/NotificationBox';
import SelectCloudPlatform from './components/SelectCloudPlatform';
import { isSubscriptionActiveAtom, userEmailAtom } from './atoms';
import { useAtom } from 'jotai';
import { ToastContainer } from 'react-toastify';

const AZURE_FUNCTION_URL = `${import.meta.env.VITE_API_BASE_URL}/api/createOrUpdateUser`;

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();
  const [hasCalledAzureFunction, setHasCalledAzureFunction] = useState(false);
  const [, setIsSubscriptionActive] = useAtom(isSubscriptionActiveAtom);
  const [, setUserEmail] = useAtom(userEmailAtom);

  useEffect(() => {
    const createOrUpdateUserInAzureFunction = async (user: AccountInfo) => {
      try {
        if (!user.username || !user.homeAccountId) {
          console.error('User object is missing essential fields:', user);
          return;
        }

        setUserEmail(user.username);

        const payload = {
          email: user.username,
          homeAccountId: user.homeAccountId,
          displayName: user.name || '',
        };

        console.log('Payload being sent to Azure Function:', payload);

        const response = await fetch(AZURE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        if (!response.ok) {
          console.error('Server responded with an error:', responseData);
          throw new Error(`Server responded with an error: ${JSON.stringify(responseData)}`);
        }

        console.log('User successfully created/updated in Azure Function.', responseData);

        const isActive = responseData.subscriptionStatus === 'active' || responseData.subscriptionStatus === 'trialing';
        setIsSubscriptionActive(isActive);

        setHasCalledAzureFunction(true);
      } catch (error) {
        console.error('Error creating/updating user in Azure Table Storage:', error);
      }
    };

    const accounts = instance.getAllAccounts();
    if (isAuthenticated && accounts.length > 0 && !hasCalledAzureFunction) {
      const user = accounts[0];
      createOrUpdateUserInAzureFunction(user);
    }
  }, [isAuthenticated, instance, hasCalledAzureFunction, setIsSubscriptionActive, setUserEmail]);

  if (inProgress === InteractionStatus.Login || inProgress === InteractionStatus.HandleRedirect) {
    return <div>Authentication in progress...</div>;
  }

  return (
    <div className="App">
      <NotificationBox />
      <NavBar />
      {isAuthenticated && <SelectCloudPlatform />}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}

export default App;