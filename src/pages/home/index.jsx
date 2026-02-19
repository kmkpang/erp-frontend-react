import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
	const navigate = useNavigate();

	const cards = [
		{
			title: "ใบเสนอราคา",
			desc: "จัดการใบเสนอราคา",
			icon: "mdi-file-document-outline",
			link: "/quotation",
			role: ["SUPERUSER", "MANAGER", "SALE"],
			className: "card-quotation",
		},
		{
			title: "ใบแจ้งหนี้",
			desc: "จัดการใบแจ้งหนี้",
			icon: "mdi-file-document-check-outline",
			link: "/invoice",
			role: ["SUPERUSER", "MANAGER", "SALE"],
			className: "card-invoice",
		},
		{
			title: "ใบเสร็จรับเงิน/ใบกำกับภาษี",
			desc: "จัดการใบเสร็จรับเงิน/ใบกำกับภาษี",
			icon: "mdi-receipt-text-outline",
			link: "/billingnote",
			role: ["SUPERUSER", "MANAGER", "SALE"],
			className: "card-billing",
		},
		{
			title: "สินค้าและบริการ",
			desc: "จัดการข้อมูลสินค้า",
			icon: "mdi-cube-outline",
			link: "/product",
			role: ["SUPERUSER", "MANAGER", "SALE"],
			className: "card-product",
		},
		{
			title: "ข้อมูลบริษัท/ลูกค้า",
			desc: "จัดการข้อมูลลูกค้า",
			icon: "mdi-account-group-outline",
			link: "/customer",
			role: ["SUPERUSER", "MANAGER", "SALE"],
			className: "card-customer",
		},
		{
			title: "เกี่ยวกับธุรกิจ",
			desc: "จัดการข้อมูลเกี่ยวกับธุรกิจ",
			icon: "mdi-domain",
			link: "/aboutcompany",
			role: ["SUPERUSER"],
			className: "card-about",
		},
	];

	const userRole = localStorage.getItem("RoleName");

	return (
		<div className="main-page">
			<div className="home-container">
				{/* Section Header */}
				<div className="row justify-content-center mb-4">
					<div className="col-12 col-lg-10">
						<h2 className="section-title">เมนูลัด</h2>
					</div>
				</div>

				{/* Shortcuts Cards */}
				<div className="row justify-content-center mx-2">
					{cards
						.filter((card) => !card.role || card.role.includes(userRole))
						.map((card, index) => (
							<div key={index} className="col-md-6 col-lg-6 col-xl-6 mb-4">
								<div
									className={`shortcut-card ${card.className}`}
									onClick={() => navigate(card.link)}
								>
									<div className="icon-wrapper">
										<span className={`mdi ${card.icon}`}></span>
									</div>
									<div className="card-info">
										<h3 className="card-title">{card.title}</h3>
										<span className="card-desc">{card.desc}</span>
									</div>
									<div className="card-decoration"></div>
								</div>
							</div>
						))}
				</div>
			</div>
		</div>
	);
};

export default Home;
