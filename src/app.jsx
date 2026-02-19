import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "@pages/login";
import Home from "@pages/home";
import About from "@pages/about";
import BillingNote from "@pages/billing-note";
import Category from "@pages/category";
import Customer from "@pages/customer";
import Product from "@pages/product";
import RoleManage from "@pages/role-manage";
import Quotation from "@pages/quotation";
import Invoice from "@pages/invoice";
import Layout from "@component/layout";
import "./app.css";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000, // 5 minutes
		},
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<Router>
				<Routes>
					<Route path="/login" element={<Login />} />

					{/* Protected Routes */}
					<Route element={<Layout />}>
						<Route path="/" element={<Navigate to="/home" replace />} />
						<Route path="/home" element={<Home />} />
						<Route path="/aboutcompany" element={<About />} />
						<Route path="/billingnote" element={<BillingNote />} />
						<Route path="/category" element={<Category />} />
						<Route path="/customer" element={<Customer />} />
						<Route path="/product" element={<Product />} />
						<Route path="/rolemanage" element={<RoleManage />} />
						<Route path="/quotation" element={<Quotation />} />
						<Route path="/invoice" element={<Invoice />} />
					</Route>

					{/* Fallback */}
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			</Router>
		</QueryClientProvider>
	);
}

export default App;
