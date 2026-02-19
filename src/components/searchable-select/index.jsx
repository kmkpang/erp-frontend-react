import React, { useState, useEffect, useRef } from "react";

const SearchableSelect = ({
	options = [],
	value,
	onChange,
	placeholder = "Select...",
	labelKey,
	valueKey,
	name,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const wrapperRef = useRef(null);

	useEffect(() => {
		let term = "";
		if (value) {
			if (labelKey) {
				const foundOption = valueKey
					? options.find((o) => o[valueKey] === value)
					: options.find((o) => o[labelKey] === value);

				if (foundOption) {
					term = foundOption[labelKey];
				} else {
					term = value;
				}
			} else {
				term = value;
			}
		}

		// eslint-disable-next-line
		setSearchTerm((prev) => {
			if (prev !== term) return term;
			return prev;
		});
	}, [value, options, labelKey, valueKey]);

	useEffect(() => {
		function handleClickOutside(event) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				setIsOpen(false);
				// If closed without hitting enter on an option, revert to current prop value?
				// Actually typical datalist behavior allows free text.
				// But for "Select" behavior, we might want to enforce selection or just keep text.
				// The user said "input datalist", implying they might want to type things that aren't in the list?
				// "input datalist" usually allows custom values.
				// However, the screenshot looks like a strict select.
				// Given current code allows manual entry (if customer not found, use typed name),
				// I should probably allow the typed text to persist as the value.
				// In my current logic, typing updates searchTerm.
				// I need to trigger onChange with the searchTerm on blur if it's "free text" mode.
				// But let's stick to: typing filters; clicking selects.
				// If they click away, what happens?
				// If I want to support "free text", I should call onChange(searchTerm) on blur?
				// Let's assume for now, typing triggers onChange(searchTerm) so parent updates constantly.
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [wrapperRef]);

	const filteredOptions = options.filter((option) => {
		const label = labelKey ? option[labelKey] : option;
		// Safely handle if label is undefined/null
		return String(label || "")
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
	});

	const handleInputChange = (e) => {
		const newVal = e.target.value;
		setSearchTerm(newVal);
		setIsOpen(true);
		if (onChange) onChange(newVal); // Allow free text typing
	};

	const handleSelectOption = (option) => {
		const val = valueKey ? option[valueKey] : labelKey ? option[labelKey] : option;
		const label = labelKey ? option[labelKey] : option;

		setSearchTerm(label);
		if (onChange) onChange(val);
		setIsOpen(false);
	};

	return (
		<div className="position-relative searchable-select-container" ref={wrapperRef}>
			<input
				type="text"
				className="form-control"
				placeholder={placeholder}
				value={searchTerm}
				onChange={handleInputChange}
				onClick={() => setIsOpen(true)}
				onFocus={() => setIsOpen(true)}
				name={name}
				autoComplete="off"
			/>
			{/* Dropdown Arrow Icon (Visual indicator) */}
			<span
				className="position-absolute"
				style={{
					right: "10px",
					top: "50%",
					transform: "translateY(-50%)",
					pointerEvents: "none",
					color: "#6c757d",
				}}
			>
				&#9662;
			</span>

			{isOpen && filteredOptions.length > 0 && (
				<div
					className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
					style={{
						zIndex: 1050,
						maxHeight: "200px",
						overflowY: "auto",
					}}
				>
					<ul className="list-unstyled mb-0">
						{filteredOptions.map((option, index) => {
							const label = labelKey ? option[labelKey] : option;
							const val = valueKey ? option[valueKey] : labelKey ? option[labelKey] : option;
							const isSelected = val === value;

							return (
								<li
									key={index}
									className="px-3 py-2 border-bottom"
									style={{
										cursor: "pointer",
										backgroundColor: isSelected ? "#e9ecef" : "white", // Light grey for selected
										color: isSelected ? "#0d6efd" : "inherit", // Blue text for selected
										transition: "background-color 0.2s",
									}}
									onMouseEnter={(e) => {
										if (!isSelected) e.currentTarget.style.backgroundColor = "#f8f9fa";
									}}
									onMouseLeave={(e) => {
										if (!isSelected) e.currentTarget.style.backgroundColor = "white";
									}}
									onClick={() => handleSelectOption(option)}
								>
									{label}
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
};

export default SearchableSelect;
