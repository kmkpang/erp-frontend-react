import React, { useState, useCallback, useMemo } from "react";
import { Bounce, ToastContainer, toast } from "react-toastify";
import { AlertContext } from "@component/alert/alert-context";

export const AlertProvider = ({ children }) => {
	const [errorModalOpen, setErrorModalOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [errorTitle, setErrorTitle] = useState("เกิดข้อผิดพลาด");

	const success = useCallback((message) => {
		toast.success(message, {
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
		});
	}, []);

	const error = useCallback((message, title = "เกิดข้อผิดพลาด") => {
		setErrorMessage(message);
		setErrorTitle(title);
		setErrorModalOpen(true);
	}, []);

	const simpleError = useCallback((message) => {
		toast.error(message);
	}, []);

	const closeErrorModal = () => {
		setErrorModalOpen(false);
		setErrorMessage("");
	};

	const value = useMemo(() => ({ success, error, simpleError }), [success, error, simpleError]);

	return (
		<AlertContext.Provider value={value}>
			{children}
			<ToastContainer />
			{/* Error Modal */}
			{errorModalOpen && (
				<div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
					<div className="modal-dialog modal-dialog-centered">
						<div className="modal-content">
							<div className="modal-header bg-danger text-white">
								<h5 className="modal-title">{errorTitle}</h5>
								<button type="button" className="btn-close" onClick={closeErrorModal}></button>
							</div>
							<div className="modal-body">
								<p>{errorMessage}</p>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={closeErrorModal}>
									ปิด
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</AlertContext.Provider>
	);
};
