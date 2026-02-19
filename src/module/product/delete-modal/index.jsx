import React from "react";
import PropTypes from "prop-types";

const DeleteModal = ({
	isOpen,
	onClose,
	onConfirm,
	title = "ยืนยันการลบ",
	message = "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
	confirmText = "ยืนยัน",
	cancelText = "ปิด",
}) => {
	if (!isOpen) return null;

	return (
		<div
			className="modal show d-block"
			style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
			tabIndex="-1"
		>
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">{title}</h5>
						<button
							type="button"
							className="btn-close"
							onClick={onClose}
							aria-label="Close"
						></button>
					</div>
					<div className="modal-body">
						<p>{message}</p>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" onClick={onClose}>
							{cancelText}
						</button>
						<button type="button" className="btn btn-danger" onClick={onConfirm}>
							{confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

DeleteModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onConfirm: PropTypes.func.isRequired,
	title: PropTypes.string,
	message: PropTypes.string,
	confirmText: PropTypes.string,
	cancelText: PropTypes.string,
};

export default DeleteModal;
