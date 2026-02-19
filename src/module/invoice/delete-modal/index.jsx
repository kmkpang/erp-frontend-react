import React from "react";

const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
	if (!isOpen) return null;

	return (
		<div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
			<div className="modal-dialog">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">ยืนยันการลบ</h5>
						<button type="button" className="btn-close" onClick={onClose}></button>
					</div>
					<div className="modal-body">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</div>
					<div className="modal-footer">
						<button className="btn btn-secondary" onClick={onClose}>
							ยกเลิก
						</button>
						<button className="btn btn-danger" onClick={onConfirm}>
							ลบ
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DeleteModal;
