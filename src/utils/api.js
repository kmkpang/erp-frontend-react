export const fetchApi = async (url, options = {}) => {
	const token = localStorage.getItem("@accessToken");

	const headers = { ...options.headers };

	// Default to application/json only if body is a string (JSON) and Content-Type isn't already set
	if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
		headers["Content-Type"] = "application/json";
	}
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(url, {
		...options,
		headers,
	});

	if (response.status === 401 || response.status === 403) {
		localStorage.clear();
		window.location.href = "/login";
		throw new Error("Session expired. Please log in again.");
	}

	return response;
};
