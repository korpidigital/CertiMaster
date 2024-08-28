import { LogLevel, PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "", // From the App registration
        authority: import.meta.env.VITE_MSAL_AUTHORITY || "", // Replace with your User Flow authority
        knownAuthorities: [import.meta.env.VITE_MSAL_KNOWN_AUTHORITIES || ""], // Your B2C tenant
        redirectUri:import.meta.env.VITE_MSAL_REDIRECT_URI || "", // Should match the Redirect URI in Azure AD B2C
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you have issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        break;
                    case LogLevel.Info:
                        console.info(message);
                        break;
                    case LogLevel.Verbose:
                        console.debug(message);
                        break;
                    case LogLevel.Warning:
                        console.warn(message);
                        break;
                    default:
                        break;
                }
            },
            logLevel: LogLevel.Verbose,
        },
    },
};

const msalInstance = new PublicClientApplication(msalConfig);

export { msalInstance };