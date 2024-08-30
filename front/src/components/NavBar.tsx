import React, { useState, useRef, useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import "./NavBar.css";

const NavBar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isAuthenticated = useIsAuthenticated();
    const { instance } = useMsal();
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    return (
        <nav className="navbar">
            <div className="profile-icon" onClick={toggleDropdown} ref={dropdownRef}>
                <FontAwesomeIcon icon={faUser} size="2x" />
                {isDropdownOpen && (
                    <div className="dropdown-menu">
                        {isAuthenticated ? (
                            <>
                                <button onClick={() => alert("Go to profile")}>My Profile</button>
                                <button onClick={handleSignOut}>Sign Out</button>
                            </>
                        ) : (
                            <button onClick={handleSignIn}>Sign In</button>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;