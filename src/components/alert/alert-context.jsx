import { createContext, useContext } from "react";

// Create with a default value to prevent crashes if Provider is missing
export const AlertContext = createContext({
	success: (msg) => console.log("Alert success:", msg),
	error: (msg, title) => console.error("Alert error:", title, msg),
	simpleError: (msg) => console.error("Alert simpleError:", msg),
});

export const useAlert = () => useContext(AlertContext);
