import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import "./index.css";

const TableList = ({
	initialTableData = [],
	tableHeaders = [],
	itemsPerPage = 10,
	documentName = "Document",
	columnEditAndDelete = false,
	columnforManage = false,
	columnforCheckbox = false,
	columnforExport = false,
	hiddenColumns = [],
	onEdit,
	onDelete,
	onManage,
	onPreview,
	onExport,
	onSelectItem,
}) => {
	const [currentPage, setCurrentPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);
	const [sortConfig, setSortConfig] = useState(null);

	// Sorting logic
	const sortedData = useMemo(() => {
		let sortableItems = [...initialTableData];
		if (sortConfig !== null) {
			sortableItems.sort((a, b) => {
				if (a[sortConfig.key] < b[sortConfig.key]) {
					return sortConfig.direction === "ascending" ? -1 : 1;
				}
				if (a[sortConfig.key] > b[sortConfig.key]) {
					return sortConfig.direction === "ascending" ? 1 : -1;
				}
				return 0;
			});
		}
		return sortableItems;
	}, [initialTableData, sortConfig]);

	// Pagination logic
	const totalPages = Math.ceil(sortedData.length / rowsPerPage);
	const paginatedItems = sortedData.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

	const requestSort = (key) => {
		let direction = "ascending";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
			direction = "descending";
		}
		setSortConfig({ key, direction });
	};

	const getStatusClass = (status) => {
		if (typeof status !== "string") return "";
		const orangeKeywords = ["Invoice not Issued", "Tax Invoice not Issued", "Receipt not Issued"];
		const greenKeywords = ["Invoice Issued", "Tax Invoice Issued", "Receipt Issued"];
		const redKeywords = ["Not Active", "expired"];

		if (orangeKeywords.some((k) => status.includes(k))) return "orange-text";
		if (greenKeywords.some((k) => status.includes(k))) return "green-text";
		if (redKeywords.some((k) => status.includes(k))) return "red-text";
		return "";
	};

	const shouldHideColumn = (key) => {
		if (hiddenColumns.includes(key)) return true;
		const defaultHidden = [
			// "billing_id",
			// "productID",
			// "transaction_id",
			// "invoice_id",
			// "cus_id",
			// "employeeID",
			// "sale_id",
			// "productForms",
			// "Employee ID",
			// "ID",
			// "categoryID",
			// "productTypeID",
			// "PositionID",
			// "departmentID",
			// "tax_invoice_number",
			// "sale_number",
			// "invoice_number",
			// "pay_bank",
			// "pay_number",
			// "pay_branch",
			// "pay_date",
			// "showAllowButton",
			// "deleted_at",
			// "billing_status",
		];
		return defaultHidden.includes(key) || !key;
	};

	// Filter columns based on first item
	const visibleColumns =
		initialTableData.length > 0
			? Object.keys(initialTableData[0])
					.filter((key) => !shouldHideColumn(key))
					.map((key) => ({
						label: key, // Or map to a display name if needed
						value: key,
					}))
			: [];

	const totalColspan =
		visibleColumns.length +
		(columnforCheckbox ? 1 : 0) +
		1 + // Index column
		(columnEditAndDelete ? 1 : 0) +
		(columnforManage ? 1 : 0) +
		(columnforExport ? 1 : 0);

	return (
		<div>
			<div className="table-contain table-responsive table-form">
				<table className="table table-bordered table-striped">
					<thead>
						<tr className="text-nowrap">
							{columnforCheckbox && <th style={{ minWidth: "60px" }}></th>}
							<th style={{ minWidth: "60px" }}>ลำดับ</th>

							{/* ... (rest of the header code) ... */}
							{(columnEditAndDelete || columnforManage) && (
								<th style={{ minWidth: "100px" }}>จัดการ</th>
							)}
							{columnforExport && <th style={{ minWidth: "100px" }}>PDF</th>}

							{tableHeaders.map((header) => (
								<th
									key={header.key}
									onClick={() => requestSort(header.key)}
									style={{ cursor: "pointer" }}
								>
									{header.label}
									{sortConfig?.key === header.key
										? sortConfig.direction === "ascending"
											? " ▲"
											: " ▼"
										: null}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{paginatedItems.length === 0 ? (
							<tr>
								<td colSpan={totalColspan} className="text-center text-muted py-4">
									{documentName}
								</td>
							</tr>
						) : (
							paginatedItems.map((item, index) => (
								<tr key={index}>
									{columnforCheckbox && (
										<td className="align-middle">
											<input type="checkbox" onClick={() => onSelectItem && onSelectItem(item)} />
										</td>
									)}
									<td className="align-middle">{(currentPage - 1) * rowsPerPage + index + 1}</td>

									{columnEditAndDelete && (
										<td className="align-middle button-table">
											<div className="icon-table d-flex gap-3 justify-content-center">
												<div
													className="mdi mdi-pencil pointer fs-5 text-primary"
													onClick={() => onEdit && onEdit(item)}
													title="Edit"
												></div>
												{onDelete && (
													<div
														className="mdi mdi-trash-can pointer fs-5 text-danger"
														onClick={() => onDelete && onDelete(item)}
														title="Delete"
													></div>
												)}
											</div>
										</td>
									)}

									{columnforManage && (
										<td className="align-middle button-table">
											<div className="icon-table d-flex justify-content-center">
												<div
													className="mdi mdi-cog pointer fs-5 text-secondary"
													onClick={() => onManage && onManage(item)}
												></div>
											</div>
										</td>
									)}

									{columnforExport && (
										<td className="align-middle button-table">
											<div className="icon-table d-flex gap-3 justify-content-center">
												<div
													className="mdi mdi-eye pointer fs-5 text-info"
													onClick={() => onPreview && onPreview(item)}
													title="Preview"
												></div>
												<div
													className="mdi mdi-download pointer fs-5 text-success"
													onClick={() => onExport && onExport(item)}
													title="Export"
												></div>
											</div>
										</td>
									)}

									{/* Dynamic Columns matching tableHeaders order */}
									{tableHeaders.map((header) => (
										<td
											key={header.key}
											className={header?.align === "center" ? "text-center" : "text-left"}
										>
											{header.key === "Product Image" || header.key === "productImg" ? (
												item[header.key] &&
												(item[header.key].startsWith("http") ? (
													<img
														src={item[header.key]}
														alt="img"
														style={{ maxWidth: "50px", maxHeight: "50px" }}
													/>
												) : null)
											) : header.render ? (
												header.render(item[header.key])
											) : (
												<span className={getStatusClass(item[header.key])}>{item[header.key]}</span>
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="d-flex justify-content-between align-items-center mt-3">
				<div>
					แสดง
					{[20, 50, 100].map((opt) => (
						<button
							key={opt}
							className={`btn btn-sm mx-1 ${rowsPerPage === opt ? "btn-primary" : "btn-outline-secondary"}`}
							onClick={() => {
								setRowsPerPage(opt);
								setCurrentPage(1);
							}}
						>
							{opt}
						</button>
					))}
				</div>

				{totalPages > 1 && (
					<nav>
						<ul className="pagination mb-0">
							<li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
								<button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
									Previous
								</button>
							</li>
							{[...Array(totalPages)].map((_, i) => (
								<li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
									<button className="page-link" onClick={() => setCurrentPage(i + 1)}>
										{i + 1}
									</button>
								</li>
							))}
							<li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
								<button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
									Next
								</button>
							</li>
						</ul>
					</nav>
				)}
			</div>
		</div>
	);
};

TableList.propTypes = {
	initialTableData: PropTypes.array,
	tableHeaders: PropTypes.array,
	itemsPerPage: PropTypes.number,
	documentName: PropTypes.string,
	columnEditAndDelete: PropTypes.bool,
	columnforManage: PropTypes.bool,
	columnforCheckbox: PropTypes.bool,
	columnforExport: PropTypes.bool,
	hiddenColumns: PropTypes.array,
	onEdit: PropTypes.func,
	onDelete: PropTypes.func,
	onManage: PropTypes.func,
	onPreview: PropTypes.func,
	onExport: PropTypes.func,
	onSelectItem: PropTypes.func,
};

export default TableList;
