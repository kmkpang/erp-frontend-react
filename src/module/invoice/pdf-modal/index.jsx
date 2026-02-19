import React from "react";

const PDFModal = ({ isOpen, onClose, pdfUrl }) => {
	if (!isOpen) return null;

	return (
		<div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
			<div className="modal-dialog modal-2xl" style={{ height: "90%", maxWidth: "80vw" }}>
				<div className="modal-content h-100">
					<div className="modal-header">
						<h5 className="modal-title">ตัวอย่าง PDF (ใบแจ้งหนี้)</h5>
						<button type="button" className="btn-close" onClick={onClose}></button>
					</div>
					<div className="modal-body p-0">
						<iframe src={pdfUrl} width="100%" height="100%" style={{ border: "none" }}></iframe>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PDFModal;
