import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navigation from "@component/navigation";

import Breadcrumb from "@component/breadcrumb";

const Layout = () => {
	const navigate = useNavigate();
	// Check auth here or in specific pages?
	// Ideally in a ProtectedRoute wrapper, but this is simple layout.

	useEffect(() => {
		const token = localStorage.getItem("@accessToken");
		if (!token) {
			navigate("/login");
		}
	}, [navigate]);

	return (
		<div className="d-flex flex-column vh-100">
			<Navigation />
			<div
				className="flex-grow-1 p-4"
				style={{ marginTop: "60px", marginLeft: "0px", transition: "margin-left 0.3s" }}
			>
				<div className="mb-3">
					<Breadcrumb />
				</div>
				<Outlet />
			</div>
		</div>
	);
}; // simpler for now

export default Layout;
