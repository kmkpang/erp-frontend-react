import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import DatePickerThai from "../../../components/date-picker-thai";

const SearchForm = ({ onSearch }) => {
	const [criteria, setCriteria] = useState({
		documentDate: "",
		documentNumber: "",
		customerName: "",
		status: "",
	});

	// Debounce search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			onSearch(criteria);
		}, 500);
		return () => clearTimeout(timeoutId);
	}, [criteria, onSearch]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setCriteria((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleReset = () => {
		setCriteria({
			documentDate: "",
			documentNumber: "",
			customerName: "",
			status: "",
		});
	};

	return (
		<div className="card mb-3 p-3 bg-light border-0">
			<div className="row g-3 align-items-end">
				{/* Document Date */}
				<div className="col-md-2">
					<label className="form-label">วันที่เอกสาร</label>
					<DatePickerThai
						name="documentDate"
						value={criteria.documentDate}
						onChange={handleChange}
						className="form-control"
					/>
				</div>

				{/* Document Number */}
				<div className="col-md-3">
					<label className="form-label">เลขที่เอกสาร</label>
					<input
						type="text"
						className="form-control"
						placeholder="กรอกเลขที่เอกสาร"
						name="documentNumber"
						value={criteria.documentNumber}
						onChange={handleChange}
					/>
				</div>

				{/* Customer Name */}
				<div className="col-md-3">
					<label className="form-label">ชื่อลูกค้า</label>
					<input
						type="text"
						className="form-control"
						placeholder="กรอกชื่อลูกค้า"
						name="customerName"
						value={criteria.customerName}
						onChange={handleChange}
					/>
				</div>

				{/* Status */}
				<div className="col-md-2">
					<label className="form-label">สถานะ</label>
					<select
						className="form-select"
						name="status"
						value={criteria.status}
						onChange={handleChange}
					>
						<option value="">ทั้งหมด</option>
						<option value="Pending">รอทำรายการ</option>
						<option value="Invoice">ออกใบแจ้งหนี้แล้ว</option>
						<option value="Billed">ออกใบเสร็จแล้ว</option>
					</select>
				</div>

				{/* Buttons */}
				<div className="col-md-2 d-flex gap-2">
					<button className="btn btn-secondary flex-grow-1" onClick={handleReset}>
						<i className="mdi mdi-refresh me-1"></i> ล้างค่า
					</button>
				</div>
			</div>
		</div>
	);
};

SearchForm.propTypes = {
	onSearch: PropTypes.func.isRequired,
};

export default SearchForm;
