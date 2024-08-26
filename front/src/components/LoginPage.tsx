import React, { useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

const SignInButton: React.FC = () => {
    const { instance, inProgress } = useMsal();
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (inProgress !== InteractionStatus.None) {
            console.log("Authentication already in progress");
            return;
        }
    
        setError(null);
        try {
            await instance.loginRedirect({
                scopes: ["openid", "profile", "email"],
            });
        } catch (e) {
            console.error("Login failed", e);
            setError((e as Error).message);
        }
    };

    return (
        <div>
            <button onClick={handleLogin} disabled={inProgress !== InteractionStatus.None}>
                {inProgress !== InteractionStatus.None ? 'Signing In...' : 'Sign In'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

const SignOutButton: React.FC = () => {
    const { instance } = useMsal();
    const [error, setError] = useState<string | null>(null);

    const handleLogout = () => {
        setError(null);
        instance.logoutPopup({
            postLogoutRedirectUri: window.location.origin,
        }).catch(e => {
            console.error("Logout failed", e);
            setError(e.message);
        });
    };

    return (
        <div>
            <button onClick={handleLogout}>Sign Out</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

const LoginPage: React.FC = () => {
    const isAuthenticated = useIsAuthenticated();

    return (
        <div>
            {isAuthenticated ? <SignOutButton /> : <SignInButton />}
            {!isAuthenticated && <h1>Welcome to Certi Master</h1>}
        </div>
    );
};

export default LoginPage;