import React, { useEffect, useState } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { useAtom } from 'jotai';
import { SyncLoader } from 'react-spinners';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import {
  isSubscriptionActiveAtom,
  certificationCountAtom,
  questionCountAtom,
  userEmailAtom,
} from '../atoms';
import './NotificationBox.css';
import { Stripe, loadStripe } from '@stripe/stripe-js';

const NotificationBox: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const [isSubscriptionActive] = useAtom(isSubscriptionActiveAtom);
  const [certifications, setCertifications] = useAtom(certificationCountAtom);
  const [questions, setQuestions] = useAtom(questionCountAtom);
  const [userEmail] = useAtom(userEmailAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('http://localhost:7071/api/GetTotalCounts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setCertifications(data.certificationCount);
        setQuestions(data.questionCount);
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [setCertifications, setQuestions]);

  const handleSignIn = () => {
    // Implement sign-in functionality
  };

  const stripePromise = loadStripe(import.meta.env.VITE_PUBLISH_KEY_STRIPE);

  const handleSubscribe = async () => {
    if (!userEmail) {
      console.error('User email is missing. Unable to create a Stripe checkout session.');
      return;
    }

    const requestBody = JSON.stringify({
      priceId: import.meta.env.VITE_MONTHLY_SUB_PRICE_ID, // Include your Price ID from the environment variables
      email: userEmail, // Include the email from Jotai state
    });
    console.log('Request Body:', requestBody);

    try {
      const response = await fetch('http://localhost:7071/api/createCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Parsed response data:', responseData);

      if (!responseData || typeof responseData !== 'object' || !responseData.sessionId) {
        throw new Error('Invalid response structure from server');
      }

      const { sessionId } = responseData;

      const stripe: Stripe | null = await stripePromise;

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error('Stripe failed to initialize.');
      }
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      // Here you might want to show an error message to the user
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (isAuthenticated && isSubscriptionActive && !isExpanded) {
    return (
      <div className="notification-bar minimized">
        <FontAwesomeIcon icon={faInfoCircle} onClick={toggleExpanded} />
      </div>
    );
  }

  return (
    <div className={`notification-bar ${isExpanded ? 'expanded' : ''}`}>
      <div className="notification-text">
        {isAuthenticated && isSubscriptionActive ? (
          <>
            <div>FULL ACCESS!</div>
            <br />
            {isLoading ? (
              <SyncLoader color="#ffffff" loading={isLoading} size={10} />
            ) : (
              <>
                <div>{ } Cloud Providers</div>
                <div>{certifications} Certifications</div>
                <div>{questions} Questions</div>
              </>
            )}
            <br />
            <div>More coming weekly.</div>
          </>
        ) : isAuthenticated ? (
          <>
            <div>GET FULL ACCESS! 4€/mo</div>
            <button onClick={handleSubscribe}>Subscribe Now</button>
            {isLoading ? (
              <SyncLoader color="#ffffff" loading={isLoading} size={10} />
            ) : (
              <>
                <div>{ } Cloud Providers</div>
                <div>{certifications} Certifications</div>
                <div>{questions} Questions</div>
              </>
            )}
            <br />
            <div>Cancel any time.</div>
            <div>More coming weekly.</div>
          </>
        ) : (
          <>
            <div>GET FULL ACCESS!</div>
            <div className="auth-buttons">
              <button onClick={handleSignIn}>Sign In</button>
            </div>
            {isLoading ? (
              <SyncLoader color="#ffffff" loading={isLoading} size={10} />
            ) : (
              <>
                <div>{certifications} certifications</div>
                <div>{questions} questions</div>
              </>
            )}
            <br />
            <div>More coming weekly</div>
          </>
        )}
      </div>
      {(isAuthenticated && isSubscriptionActive) && (
        <FontAwesomeIcon icon={faInfoCircle} onClick={toggleExpanded} className="toggle-icon" />
      )}
    </div>
  );
};

export default NotificationBox;