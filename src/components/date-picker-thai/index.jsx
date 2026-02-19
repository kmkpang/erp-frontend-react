import React from "react";
import DatePicker from "react-datepicker";
import { th } from "date-fns/locale";
import PropTypes from "prop-types";

const DatePickerThai = ({
	value,
	onChange,
	name,
	placeholder = "วัน/เดือน/ปี พ.ศ.",
	className = "form-control",
	...props
}) => {
	const handleDateChange = (date) => {
		if (!date) {
			onChange({ target: { name, value: "" } });
			return;
		}
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		onChange({
			target: { name, value: `${year}-${month}-${day}` },
		});
	};

	const selectedDate = value
		? (() => {
				const [y, m, d] = value.split("-").map(Number);
				return new Date(y, m - 1, d);
			})()
		: null;

	const displayValue = value
		? (() => {
				const [y, m, d] = value.split("-").map(Number);
				const date = new Date(y, m - 1, d);
				const dayStr = String(date.getDate()).padStart(2, "0");
				const monthStr = String(date.getMonth() + 1).padStart(2, "0");
				const yearStr = date.getFullYear() + 543;
				return `${dayStr}/${monthStr}/${yearStr}`;
			})()
		: "";

	return (
		<DatePicker
			selected={selectedDate}
			onChange={handleDateChange}
			className={className}
			placeholderText={placeholder}
			dateFormat="dd/MM/yyyy"
			locale={th}
			value={displayValue}
			renderCustomHeader={({
				date,
				changeYear,
				changeMonth,
				decreaseMonth,
				increaseMonth,
				prevMonthButtonDisabled,
				nextMonthButtonDisabled,
			}) => (
				<div
					style={{
						margin: 10,
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						gap: 5,
					}}
				>
					<button
						className="btn btn-sm btn-light"
						onClick={decreaseMonth}
						disabled={prevMonthButtonDisabled}
						type="button"
					>
						{"<"}
					</button>
					<select
						value={date.getFullYear()}
						onChange={({ target: { value } }) => changeYear(Number(value))}
						className="form-select form-select-sm"
						style={{ width: "auto" }}
					>
						{Array.from({ length: 20 }, (_, i) => date.getFullYear() - 10 + i).map((y) => (
							<option key={y} value={y}>
								{y + 543}
							</option>
						))}
					</select>

					<select
						value={date.getMonth()}
						onChange={({ target: { value } }) => changeMonth(Number(value))}
						className="form-select form-select-sm"
						style={{ width: "auto" }}
					>
						{[
							"ม.ค.",
							"ก.พ.",
							"มี.ค.",
							"เม.ย.",
							"พ.ค.",
							"มิ.ย.",
							"ก.ค.",
							"ส.ค.",
							"ก.ย.",
							"ต.ค.",
							"พ.ย.",
							"ธ.ค.",
						].map((m, i) => (
							<option key={i} value={i}>
								{m}
							</option>
						))}
					</select>

					<button
						className="btn btn-sm btn-light"
						onClick={increaseMonth}
						disabled={nextMonthButtonDisabled}
						type="button"
					>
						{">"}
					</button>
				</div>
			)}
			{...props}
		/>
	);
};

DatePickerThai.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
	name: PropTypes.string,
	placeholder: PropTypes.string,
	className: PropTypes.string,
};

export default DatePickerThai;
