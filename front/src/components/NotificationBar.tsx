import React from 'react';
import { useIsAuthenticated } from "@azure/msal-react";
import { useAtom } from "jotai";
import {
  isSubscriptionActiveAtom,
  certificationCountAtom,
  questionCountAtom,
} from "../atoms";
import "./NotificationBar.css";

const NotificationBar: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const [isSubscriptionActive] = useAtom(isSubscriptionActiveAtom);
  const [certifications] = useAtom(certificationCountAtom);
  const [questions] = useAtom(questionCountAtom);

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
            {/* <div>Subscribe for €3.80/month to get full access to CertiMaster with {certifications} certifications and {questions} questions</div> */}
            <div>GET FULL ACCESS!</div>
            <button onClick={handleSubscribe}>Subscribe Now</button>
            <div>{certifications} certifications</div>
            <div>{questions} questions</div>
            <br/>
            <div>More coming weekly</div>
          </>
        ) : (
          <>
            {/* <div>Sign in and Subscribe for €3.80/month to get full access to CertiMaster with {certifications} certifications and {questions} questions</div> */}
            <div>GET FULL ACCESS!</div>
            <div className="auth-buttons">
              <button onClick={handleSignIn}>Sign In</button>
            </div>
            <div>{certifications} certifications</div>
            <div>{questions} questions</div>
            <br/>
            <div>More coming weekly</div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationBar;