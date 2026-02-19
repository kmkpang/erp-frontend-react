import React from "react";
import { Link, useLocation } from "react-router-dom";

const breadcrumbNameMap = {
	"/home": "หน้าหลัก",
	"/billingnote": "ใบเสร็จรับเงิน/ใบกำกับภาษี",
	"/billingnote/create": "สร้างใบเสร็จรับเงิน",
	"/customer": "ข้อมูลบริษัท/ลูกค้า",
	"/product": "สินค้าและบริการ",
	"/category": "หมวดหมู่",
	"/rolemanage": "สิทธิ์ผู้ใช้งาน",
	"/aboutcompany": "เกี่ยวกับธุรกิจ",
	"/quotation": "ใบเสนอราคา",
	"/quotation/create": "สร้างใบเสนอราคา",
	"/invoice": "ใบแจ้งหนี้",
	"/invoice/create": "สร้างใบแจ้งหนี้",
};

const Breadcrumb = () => {
	const location = useLocation();
	const pathnames = location.pathname.split("/").filter((x) => x);

	return (
		<nav aria-label="breadcrumb">
			<ol className="breadcrumb">
				{/* Always show Home? Or only if path is NOT home? */}
				{/* If path is just /home, maybe don't show breadcrumb or just show "Home" */}
				{location.pathname !== "/home" && (
					<li className="breadcrumb-item">
						<Link to="/home">หน้าหลัก</Link>
					</li>
				)}

				{pathnames.map((value, index) => {
					const last = index === pathnames.length - 1;
					const to = `/${pathnames.slice(0, index + 1).join("/")}`;
					const name = breadcrumbNameMap[to] || value;

					// If we are on Home, we don't need to repeat it i logic above handled it,
					// but pathnames for /home is ['home'].
					if (to === "/home") return null;

					return last ? (
						<li className="breadcrumb-item active" aria-current="page" key={to}>
							{name}
						</li>
					) : (
						<li className="breadcrumb-item" key={to}>
							<Link to={to}>{name}</Link>
						</li>
					);
				})}
			</ol>
		</nav>
	);
};

export default Breadcrumb;
