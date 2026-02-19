import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "@constant";

const Login = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorVisible, setErrorVisible] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const handleLogin = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			setErrorMessage("Please enter email and password");
			setErrorVisible(true);
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(`${config.url}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userEmail: email.toLowerCase().trim(),
					userPassword: password,
				}),
			});
			const data = await response.json();

			if (response.ok && data.token) {
				const fullName = data.userL_name
					? `${data.userF_name} ${data.userL_name}`.trim()
					: data.userF_name;

				localStorage.setItem("@accessToken", data.token);
				localStorage.setItem("RoleName", data.RoleName);
				localStorage.setItem("user_id", data.userID);
				localStorage.setItem("user_name", fullName);
				localStorage.setItem("RoleID", data.RoleID);
				localStorage.setItem("TokenCreate", data.TokenCreate);
				localStorage.setItem("userEmail", email.toLowerCase().trim());
				localStorage.setItem("lang", "th"); // Default language

				navigate("/home");
			} else {
				setErrorMessage(data.data || "Login failed");
				setErrorVisible(true);
			}
		} catch (err) {
			console.error(err);
			setErrorMessage("Network error");
			setErrorVisible(true);
		} finally {
			setIsLoading(false);
			if (errorVisible) {
				setTimeout(() => setErrorVisible(false), 3000);
			}
		}
	};

	return (
		<div
			className="d-flex justify-content-center align-items-center vh-100"
			style={{
				backgroundImage: "url('src/assets/nature-img.jpg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div
				className="card shadow-lg p-4"
				style={{
					width: "400px",
					borderRadius: "15px",
					backgroundColor: "rgba(255, 255, 255, 0.9)",
				}}
			>
				<div className="text-center mb-4">
					<h2 className="fw-bold">เข้าสู่ระบบ</h2>
				</div>
				<form onSubmit={handleLogin}>
					<div className="mb-3">
						<label className="form-label">อีเมล:</label>
						<input
							type="email"
							className="form-control"
							placeholder="กรุณากรอกอีเมล"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="mb-3 position-relative">
						<label className="form-label">รหัสผ่าน:</label>
						<input
							type={showPassword ? "text" : "password"}
							className="form-control"
							placeholder="กรุณากรอกรหัสผ่าน"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<span
							className={`mdi ${showPassword ? "mdi-eye-outline" : "mdi-eye-off-outline"}`}
							style={{
								position: "absolute",
								right: "10px",
								top: "38px",
								cursor: "pointer",
								fontSize: "20px",
								color: "#6c757d",
							}}
							onClick={() => setShowPassword(!showPassword)}
						></span>
					</div>
					<div className="mb-3 text-end">
						<a href="#" className="text-decoration-none text-muted small">
							ลืมรหัสผ่าน
						</a>
					</div>
					<button type="submit" className="btn btn-primary w-100 py-2 mb-3" disabled={isLoading}>
						{isLoading ? (
							<span
								className="spinner-border spinner-border-sm"
								role="status"
								aria-hidden="true"
							></span>
						) : (
							"เข้าสู่ระบบ"
						)}
					</button>
					<div className="text-center">
						<span className="text-muted small">ยังไม่มีบัญชี? </span>
						<a href="/register" className="text-decoration-none small fw-bold">
							สมัครสมาชิกตอนนี้
						</a>
					</div>
				</form>
			</div>

			{errorVisible && (
				<div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
					<div className="toast show align-items-center text-white bg-danger border-0">
						<div className="d-flex">
							<div className="toast-body">{errorMessage}</div>
							<button
								type="button"
								className="btn-close btn-close-white me-2 m-auto"
								onClick={() => setErrorVisible(false)}
							></button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Login;
