import React, { useEffect, useState } from 'react';
import { useIsAuthenticated } from "@azure/msal-react";
import { useAtom } from "jotai";
import { SyncLoader } from "react-spinners";
import {
  isSubscriptionActiveAtom,
  certificationCountAtom,
  questionCountAtom,
} from "../atoms";
import "./NotificationBar.css";

const NotificationBar: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const [isSubscriptionActive] = useAtom(isSubscriptionActiveAtom);
  const [certifications, setCertifications] = useAtom(certificationCountAtom);
  const [questions, setQuestions] = useAtom(questionCountAtom);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('http://localhost:7071/api/GetTotalCounts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
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

  const handleSubscribe = () => {
    // Implement subscription functionality
  };

  if (isAuthenticated && isSubscriptionActive) {
    return null; // No need to show the notification if user is subscribed
  }

  return (
    <div className="notification-bar">
      <div className="notification-text">
        {isAuthenticated ? (
          <>
            <div>GET FULL ACCESS!</div>
            <button onClick={handleSubscribe}>Subscribe Now</button>
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
    </div>
  );
};

export default NotificationBar;