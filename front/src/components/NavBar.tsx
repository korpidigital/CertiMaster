import React, { useState, useRef, useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal"; // Import the new Modal component
import { useAtom } from 'jotai';
import { isSubscriptionActiveAtom, userEmailAtom } from '../atoms';
import "./NavBar.css";
import { Stripe, loadStripe } from '@stripe/stripe-js';

const NavBar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isAuthenticated = useIsAuthenticated();
    const { instance } = useMsal();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isSubscriptionActive] = useAtom(isSubscriptionActiveAtom);
    const [userEmail] = useAtom(userEmailAtom);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleSignIn = () => {
        instance.loginPopup({
            scopes: ["openid", "profile", "email"],
        }).catch((e) => {
            console.error(e);
        });
    };

    const handleSignOut = () => {
        instance.logoutPopup({
            postLogoutRedirectUri: window.location.origin,
        }).catch((e) => {
            console.error(e);
        });
    };

    const handleOutsideClick = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
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

    useEffect(() => {
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleOutsideClick);
        } else {
            document.removeEventListener("mousedown", handleOutsideClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isDropdownOpen]);

    const handleCancelSubscription = async () => {
        if (!userEmail) {
            console.error('User email is missing. Unable to cancel subscription.');
            return;
        }

        // Add confirmation dialog
        const isConfirmed = window.confirm("Are you sure you want to cancel your CertiMaster subscription?");

        if (!isConfirmed) {
            return; // If the user clicks "Cancel" in the confirm dialog, do nothing
        }

        try {
            const response = await fetch('http://localhost:7071/api/cancelSubscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Subscription cancellation result:', result);

            alert('Your subscription has been cancelled successfully. The page will now reload.');
            window.location.reload();
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert('There was an error cancelling your subscription. Please try again later.');
        }
    };

    return (
        <nav className="navbar">
            <div className="profile-icon" onClick={toggleDropdown} ref={dropdownRef}>
                <FontAwesomeIcon icon={faUser} size="2x" />
                {isDropdownOpen && (
                    <div className="dropdown-menu">
                        {isAuthenticated ? (
                            <>
                                <button onClick={() => setIsModalOpen(true)}>My Profile</button>
                                <button onClick={handleSignOut}>Sign Out</button>
                            </>
                        ) : (
                            <button onClick={handleSignIn}>Sign In</button>
                        )}
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>My Profile</h2>
                <p>Email: {userEmail}</p>
                <p>Subscription Status: {isSubscriptionActive ? 'Active' : 'Inactive'}</p>
                {isSubscriptionActive ? (
                    <button onClick={handleCancelSubscription}>Cancel Subscription</button>
                ) : (
                    <button onClick={handleSubscribe}>Subscribe</button>
                )}
            </Modal>
        </nav>
    );
};

export default NavBar;