import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { config } from "@constant";
import ProfileModal from "./profile-modal";
import ChangePasswordModal from "./change-password-modal";
import "./index.css";

const API_CALL = config.url;

const Navigation = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const [isSidebarVisible, setIsSidebarVisible] = useState(false);
	const [isExpandedProfile, setIsExpandedProfile] = useState(false);
	const [searchNav, setSearchNav] = useState("");
	const [openMenus, setOpenMenus] = useState({});
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
	// Removed businessData state as it's now handled by useQuery

	const sidebarRef = useRef(null);
	const profileRef = useRef(null);

	const userRole = localStorage.getItem("RoleName");
	const userName = localStorage.getItem("user_name") || "User";
	const currentUserId = localStorage.getItem("user_id");

	const toggleMenu = (key) => {
		setOpenMenus((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const MENU_ITEMS = [
		{
			title: "หน้าหลัก",
			path: "/home",
			roles: ["SUPERUSER", "ADMIN", "USER"], // Allowed roles
		},
		{
			title: "การขาย",
			key: "sale",
			roles: ["SUPERUSER", "ADMIN", "USER"],
			subItems: [
				{
					title: "ใบเสนอราคา",
					path: "/quotation",
					roles: ["SUPERUSER", "ADMIN", "USER"],
				},
				{
					title: "ใบแจ้งหนี้",
					path: "/invoice",
					roles: ["SUPERUSER", "ADMIN", "USER"],
				},
				{
					title: "ใบเสร็จรับเงิน/ใบกำกับภาษี",
					path: "/billingnote",
					roles: ["SUPERUSER", "ADMIN", "USER"],
				},
				{ title: "ข้อมูลบริษัท/ลูกค้า", path: "/customer", roles: ["SUPERUSER", "ADMIN", "USER"] },
			],
		},
		{
			title: "สินค้าและบริการ",
			key: "product",
			roles: ["SUPERUSER", "ADMIN", "USER"],
			subItems: [
				{ title: "สินค้าและบริการ", path: "/product", roles: ["SUPERUSER", "ADMIN", "USER"] },
				{ title: "หมวดหมู่", path: "/category", roles: ["SUPERUSER", "ADMIN", "USER"] },
			],
		},
		{
			title: "การจัดการระบบ",
			key: "admin",
			roles: ["SUPERUSER"],
			subItems: [
				{ title: "สิทธิ์ผู้ใช้งาน", path: "/rolemanage", roles: ["SUPERUSER"] },
				{ title: "เกี่ยวกับธุรกิจ", path: "/aboutcompany", roles: ["SUPERUSER"] },
			],
		},
		{
			title: "คู่มือการใช้งานระบบ",
			path: "/user-manual",
			roles: ["SUPERUSER", "ADMIN", "USER", "MANAGER", "SALE"],
		},
	];

	const { data: businessData = { bus_name: "", bus_logo: "" } } = useQuery({
		queryKey: ["business"],
		queryFn: async () => {
			const token = localStorage.getItem("@accessToken");
			const res = await fetch(`${API_CALL}/Quotation/getBusinessByID`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.statusCode === 200 && json.data) {
				return json.data.business;
			}
			throw new Error("Failed to fetch business data");
		},
	});

	const handleLogout = () => {
		localStorage.clear();
		navigate("/login");
	};

	const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);
	const isActive = (path) => location.pathname.startsWith(path);

	const getFilteredMenuItems = () => {
		return MENU_ITEMS.filter((item) => {
			// Check role permission
			const hasRole = !item.roles || item.roles.includes(userRole);
			if (!hasRole) return false;

			// Check search filter
			if (searchNav) {
				const matchTitle = item.title.toLowerCase().includes(searchNav.toLowerCase());
				const matchSub =
					item.subItems &&
					item.subItems.some((sub) => sub.title.toLowerCase().includes(searchNav.toLowerCase()));
				return matchTitle || matchSub;
			}
			return true;
		});
	};

	const filteredMenuItems = getFilteredMenuItems();

	return (
		<>
			{/* Top Navbar */}
			<nav
				className="navbar navbar-expand-sm fixed-top bg-white border-bottom"
			>
				<div className="container-fluid">
					<div className="d-flex align-items-center">
						<span
							className="mdi mdi-menu me-3"
							style={{ fontSize: "24px", cursor: "pointer" }}
							onClick={toggleSidebar}
						></span>
						<Link to="/home" className="navbar-brand d-flex align-items-center">
							{businessData.bus_logo && (
								<img
									src={businessData.bus_logo}
									alt="logo"
									style={{ height: "40px", marginRight: "10px" }}
								/>
							)}
							<span className="hidden lg:block text-dark">{businessData.bus_name}</span>
						</Link>
					</div>

					<div className="d-flex align-items-center">
						{/* User Profile */}
						<div className="position-relative" ref={profileRef}>
							<div
								className="d-flex align-items-center"
								style={{ cursor: "pointer" }}
								onClick={() => setIsExpandedProfile(!isExpandedProfile)}
							>
								<div
									className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-2"
									style={{ width: "35px", height: "35px" }}
								>
									{userName.charAt(0).toUpperCase()}
								</div>
								<span>{userName}</span>
							</div>
							{isExpandedProfile && (
								<div className="dropdown-menu show" style={{ position: "absolute", right: 0 }}>
									<button
										className="dropdown-item"
										onClick={() => {
											setIsExpandedProfile(false);
											setIsProfileModalOpen(true);
										}}
									>
										ข้อมูลผู้ใช้งาน
									</button>
									<button
										className="dropdown-item"
										onClick={() => {
											setIsExpandedProfile(false);
											setIsChangePasswordModalOpen(true);
										}}
									>
										เปลี่ยนรหัสผ่าน
									</button>
									<button className="dropdown-item text-danger" onClick={handleLogout}>
										ออกจากระบบ
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</nav>

			{/* Sidebar */}
			<div
				className={`sidebar bg-light border-end ${isSidebarVisible ? "open" : ""}`}
				ref={sidebarRef}
			>
				<div className="p-3">
					<input
						className="form-control mb-3"
						placeholder="ค้นหา..."
						value={searchNav}
						onChange={(e) => setSearchNav(e.target.value)}
					/>

					<ul className="nav flex-column">
						{filteredMenuItems.map((item, index) => {
							if (item.subItems) {
								return (
									<li className="nav-item" key={index}>
										<div
											className={`nav-link d-flex justify-content-between align-items-center ${
												openMenus[item.key] ? "text-primary" : ""
											}`}
											style={{ cursor: "pointer" }}
											onClick={() => toggleMenu(item.key)}
										>
											{item.title}
											<i className={`bi ${openMenus[item.key] ? "bi-dash" : "bi-plus"}`}></i>
										</div>
										{openMenus[item.key] && (
											<ul className="nav flex-column ms-3">
												{item.subItems
													.filter((sub) => !sub.roles || sub.roles.includes(userRole))
													.map((sub, subIndex) => (
														<li className="nav-item" key={subIndex}>
															<Link
																to={sub.path}
																className={`nav-link ${isActive(sub.path) ? "active" : ""}`}
															>
																{sub.title}
															</Link>
														</li>
													))}
											</ul>
										)}
									</li>
								);
							} else {
								return (
									<li className="nav-item" key={index}>
										<Link
											to={item.path}
											className={`nav-link ${isActive(item.path) ? "active" : ""}`}
										>
											{item.title}
										</Link>
									</li>
								);
							}
						})}
					</ul>
				</div>
			</div>

			{/* Overlay to close sidebar on mobile */}
			{isSidebarVisible && (
				<div className="sidebar-overlay" onClick={() => setIsSidebarVisible(false)}></div>
			)}

			<ProfileModal
				isOpen={isProfileModalOpen}
				onClose={() => setIsProfileModalOpen(false)}
				userId={currentUserId}
			/>
			
			<ChangePasswordModal
				isOpen={isChangePasswordModalOpen}
				onClose={() => setIsChangePasswordModalOpen(false)}
				userId={currentUserId}
			/>
		</>
	);
};

export default Navigation;
