import React from "react";
import "./index.css"; // We'll create a basic CSS file for popup

const Popup = ({ isOpen, closePopup, children }) => {
	if (!isOpen) return null;

	return (
		<div className="popup-overlay">
			<div className="popup-content">
				<span className="close-btn" onClick={closePopup}>
					&times;
				</span>
				{children}
			</div>
		</div>
	);
};

export default Popup;
