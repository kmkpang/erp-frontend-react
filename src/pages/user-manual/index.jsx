import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const UserManual = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("@accessToken");
    const [activeSection, setActiveSection] = useState("main");

    return (
        <div className="bg-light min-vh-100 pb-5">
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm" style={{ padding: "15px 0" }}>
                <div className="container">
                    <span className="navbar-brand fw-bold d-flex align-items-center">
                        <span className="mdi mdi-book-open-page-variant me-2" style={{ fontSize: "28px" }}></span>
                        คู่มือการใช้งานระบบ
                    </span>
                    <button 
                        className="btn btn-outline-light rounded-pill px-4" 
                        onClick={() => {
                            if (activeSection !== "main") {
                                setActiveSection("main");
                            } else if (window.history.length > 2) {
                                navigate(-1);
                            } else {
                                navigate(token ? '/home' : '/login');
                            }
                        }}
                    >
                        <span className="mdi mdi-arrow-left me-1"></span> กลับ
                    </button>
                </div>
            </nav>

            <div className="container mt-5">
                <div className="text-center mb-5">
                    <h1 className="fw-bold text-dark">ยินดีต้อนรับสู่คู่มือการใช้งาน</h1>
                    <p className="text-muted fs-5">เรียนรู้วิธีการใช้งานระบบต่างๆ อย่างง่ายดาย</p>
                </div>

                <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-5">
                        <h4 className="fw-bold text-primary mb-0">ระบบ ERP - หมวดหมู่การใช้งาน</h4>
                    </div>
                    <div className="card-body p-4 p-md-5">
                        
                        {activeSection === "main" && (
                        <div className="row g-4 fade-in">
                            {/* เข้าสู่ระบบ */}
                            <div className="col-md-6 col-lg-4">
                                <div className="h-100 p-4 rounded-4 border bg-white hover-shadow transition-all">
                                    <div className="icon-circle bg-primary bg-opacity-10 text-primary rounded-circle mb-3">
                                        <i className="mdi mdi-account-key-outline mdi-24px"></i>
                                    </div>
                                    <h5 className="fw-bold">1. การใช้งานบัญชีและเข้าสู่ระบบ</h5>
                                    <p className="text-muted mb-3">การจัดการข้อมูลการเข้าใช้งานระบบ</p>
                                    <ul className="text-muted small ps-3 mb-0">
                                        <li><strong>เข้าสู่ระบบ:</strong> กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน</li>
                                        <li><strong>เปลี่ยนรหัสผ่าน:</strong> สามารถใช้เมนูลืมรหัสผ่านเพื่อตั้งรหัสผ่านใหม่ได้</li>
                                        <li><strong>ออกจากระบบ:</strong> กดที่โปรไฟล์มุมขวาบน และเลือก "ออกจากระบบ"</li>
                                    </ul>
                                </div>
                            </div>

                            {/* ใบเสนอราคาและใบแจ้งหนี้ */}
                            <div className="col-md-6 col-lg-4">
                                <div className="h-100 p-4 rounded-4 border bg-white hover-shadow transition-all">
                                    <div className="icon-circle bg-success bg-opacity-10 text-success rounded-circle mb-3">
                                        <i className="mdi mdi-file-document-outline mdi-24px"></i>
                                    </div>
                                    <h5 className="fw-bold">2. เอกสารการขาย</h5>
                                    <p className="text-muted mb-3">การจัดการใบเสนอราคา ใบแจ้งหนี้ และใบเสร็จ</p>
                                    <ul className="text-muted small ps-3 mb-0">
                                        <li><strong>สร้างเอกสาร:</strong> เลือกปุ่ม "สร้างรายการ" ด้านบนขวา เลือกหน้าข้อมูลลูกค้าและสินค้าที่ต้องการ</li>
                                        <li><strong>แก้ไขเอกสาร:</strong> กดปุ่ม ✏️ ที่รายการ เพื่อปรับปรุงข้อมูลที่บันทึกไว้</li>
                                        <li><strong>ลบเอกสาร:</strong> กดปุ่ม 🗑️ ที่รายการ เพื่อนำข้อมูลออก</li>
                                        <li><strong>พิมพ์เอกสาร:</strong> กดปุ่มรูป 🖨️ เพื่อดูตัวอย่าง พิมพ์เอกสาร หรือบันทึกเป็น PDF</li>
                                    </ul>
                                    <div className="mt-3 text-center">
                                        <button 
                                            className="btn btn-sm btn-outline-success w-100 rounded-pill"
                                            onClick={() => setActiveSection("sales-docs")}
                                        >
                                            อ่านรายละเอียดเพิ่มเติม<span className="mdi mdi-arrow-right"></span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* สินค้าและบริการ */}
                            <div className="col-md-6 col-lg-4">
                                <div className="h-100 p-4 rounded-4 border bg-white hover-shadow transition-all">
                                    <div className="icon-circle bg-warning bg-opacity-10 text-warning rounded-circle mb-3">
                                        <i className="mdi mdi-cube-outline mdi-24px"></i>
                                    </div>
                                    <h5 className="fw-bold">3. สินค้าและหมวดหมู่</h5>
                                    <p className="text-muted mb-3">การจัดการรายการสินค้า สินค้าคงคลัง และหมวดหมู่</p>
                                    <ul className="text-muted small ps-3 mb-0">
                                        <li><strong>เพิ่มข้อมูล:</strong> ระบุชื่อ รายละเอียด รูปภาพ ราคาจำหน่าย และข้อมูลสินค้ายกยอด</li>
                                        <li><strong>แก้ไขข้อมูล:</strong> กดปุ่ม ✏️ เพื่อเข้าหน้าฟอร์ม นำเข้าสินค้า หรือแก้ไขรายละเอียด</li>
                                        <li><strong>ลบข้อมูล:</strong> กดปุ่ม 🗑️ หากนำสินค้าเลิกจำหน่าย หรือกดปิดสถานะการแสดงผลสินค้า</li>
                                        <li><strong>หมวดหมู่:</strong> ไปที่เมนูหมวดหมู่เพื่อ จัดกลุ่มการดูแลรักษาสินค้าและประเภทยาได้ในโครงสร้างเดียวกัน</li>
                                    </ul>
                                </div>
                            </div>

                            {/* ข้อมูลลูกค้า */}
                            <div className="col-md-6 col-lg-4">
                                <div className="h-100 p-4 rounded-4 border bg-white hover-shadow transition-all">
                                    <div className="icon-circle bg-info bg-opacity-10 text-info rounded-circle mb-3">
                                        <i className="mdi mdi-account-group-outline mdi-24px"></i>
                                    </div>
                                    <h5 className="fw-bold">4. ข้อมูลลูกค้าและซัพพลายเออร์</h5>
                                    <p className="text-muted mb-3">การบริหารรายชื่อผู้ติดต่อที่เกี่ยวข้อง</p>
                                    <ul className="text-muted small ps-3 mb-0">
                                        <li><strong>สร้างลูกค้า:</strong> สามารถกด "เพิ่มรายชื่อ" ระบุ ชื่อบริษัท ข้อมูลติดต่อ ที่ตั้ง และรหัสสาขา</li>
                                        <li><strong>แก้ไขลูกค้า:</strong> กดปุ่มแก้ไขเพื่อปรับวันที่ ข้อมูลการติดต่อต่างๆ เพื่อให้ใบกำกับภาษีแม่นยำขึ้น</li>
                                        <li><strong>ลบลูกค้า:</strong> กดลบเพื่อนำรายชื่อบุคคลออกจากฐานข้อมูลตัวเลือกในหน้าเอกสาร</li>
                                    </ul>
                                </div>
                            </div>

                            {/* เกี่ยวกับธุรกิจ */}
                            <div className="col-md-6 col-lg-4">
                                <div className="h-100 p-4 rounded-4 border bg-white hover-shadow transition-all">
                                    <div className="icon-circle bg-danger bg-opacity-10 text-danger rounded-circle mb-3">
                                        <i className="mdi mdi-domain mdi-24px"></i>
                                    </div>
                                    <h5 className="fw-bold">5. เกี่ยวกับธุรกิจ</h5>
                                    <p className="text-muted mb-3">การตั้งค่าบริษัทสำหรับการออกเอกสาร</p>
                                    <ul className="text-muted small ps-3 mb-0">
                                        <li><strong>ตั้งค่าบริษัท:</strong> จัดการรายละเอียดชื่อนิติบุคคล, เบอร์โทร และ โลโก้</li>
                                        <li><strong>รหัสประจำตัว:</strong> ใส่เลขประจำตัวผู้เสียภาษี และข้อมูลสาขาของบริษัท</li>
                                        <li><strong>อัปเดตข้อมูล:</strong> ข้อมูลนี้จะสะท้อนบนส่วนบนของเอกสารที่มีการพิมพ์ หรือตั้งค่าเป็นข้อมูลล่าสุดเสมอ</li>
                                    </ul>
                                </div>
                            </div>

                            {/* สิทธิ์ผู้ใช้งาน */}
                            <div className="col-md-6 col-lg-4">
                                <div className="h-100 p-4 rounded-4 border bg-white hover-shadow transition-all">
                                    <div className="icon-circle bg-secondary bg-opacity-10 text-secondary rounded-circle mb-3">
                                        <i className="mdi mdi-shield-account-outline mdi-24px"></i>
                                    </div>
                                    <h5 className="fw-bold">6. สิทธิ์การใช้งาน</h5>
                                    <p className="text-muted mb-3">จัดการการเข้าถึงระดับต่างๆ ของบัญชีภายในระบบ</p>
                                    <ul className="text-muted small ps-3 mb-0">
                                        <li><strong>เพิ่มผู้ใช้:</strong> สามารถเชิญผู้ใช้ กรอกข้อมูล และแยกตาม Role สิทธิ์ต่างๆ</li>
                                        <li><strong>แก้ไขผู้ใช้:</strong> ปรับชื่อผู้ใช้ และแก้ไขระบุสถานภาพผู้ดูแลในระบบ</li>
                                        <li><strong>ลบผู้ใช้:</strong> ระงับการเข้าสู่ระบบ หรือยกเลิกบัญชีพนักงานที่ไม่มีการทำงานแล้ว</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* หน้าต่างรายละเอียดเอกสารการขาย */}
                        {activeSection === "sales-docs" && (
                        <div className="sales-docs-details fade-in">
                            <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                                <button className="btn btn-light rounded-circle me-3 shadow-none border" onClick={() => setActiveSection("main")}>
                                    <i className="mdi mdi-arrow-left"></i>
                                </button>
                                <div>
                                    <h3 className="fw-bold text-success mb-0 d-flex align-items-center">
                                        <i className="mdi mdi-file-document-multiple-outline me-2"></i>รายละเอียดเอกสารการขาย
                                    </h3>
                                    <p className="text-muted mb-0 mt-1">การทำงานเชื่อมต่อกันของระบบเอกสาร เพื่อลดความซ้ำซ้อนในการกรอกข้อมูล</p>
                                </div>
                            </div>
                            
                            <div className="row g-4">
                                {/* ใบเสนอราคา */}
                                <div className="col-12">
                                    <div className="card border bg-light shadow-sm rounded-4 p-4">
                                       <div className="d-flex align-items-center mb-3">
                                           <div className="icon-circle bg-primary bg-opacity-10 text-primary rounded-circle me-3 border border-primary border-opacity-25" style={{width: '50px', height: '50px'}}>
                                               <i className="mdi mdi-file-document-outline mdi-24px"></i>
                                           </div>
                                           <h5 className="fw-bold mb-0">1. ใบเสนอราคา (Quotation)</h5>
                                       </div>
                                       <p className="text-muted mb-3">เอกสารสำหรับเสนอราคาสินค้าหรือบริการให้แก่ลูกค้า ถือเป็นจุดเริ่มต้นของกระบวนการขาย</p>
                                       <ul className="text-muted small ps-3 mb-0">
                                           <li className="mb-2"><strong>การสร้าง:</strong> สร้างขึ้นใหม่โดยเลือกรายการสินค้า ทุน ราคา ที่สอดคล้องจากระบบและกรอกรายละเอียดลูกค้า</li>
                                           <li className="mb-2 text-primary"><strong>การทำงานต่อเนื่อง:</strong> ใบเสนอราคาที่สร้างเสร็จแล้ว จะถูกเซฟเข้าระบบ <strong>สามารถกดปุ่มเพื่อใช้ข้อมูลดึงไปสร้าง "ใบแจ้งหนี้" หรือ "ใบเสร็จรับเงิน" ได้ต่อทันทีในขั้นตอนหน้า</strong> ทำให้ไม่ต้องกรอกข้อมูลอะไรใหม่ทั้งหมด</li>
                                       </ul>
                                    </div>
                                </div>
                    
                                {/* ใบแจ้งหนี้ */}
                                <div className="col-12">
                                    <div className="card border bg-light shadow-sm rounded-4 p-4">
                                       <div className="d-flex align-items-center mb-3">
                                           <div className="icon-circle bg-warning bg-opacity-10 text-warning rounded-circle me-3 border border-warning border-opacity-25" style={{width: '50px', height: '50px'}}>
                                               <i className="mdi mdi-file-document-check-outline mdi-24px"></i>
                                           </div>
                                           <h5 className="fw-bold mb-0">2. ใบแจ้งหนี้ (Invoice)</h5>
                                       </div>
                                       <p className="text-muted mb-3">เอกสารเพื่อเรียกเก็บเงินลูกค้าหลังจากตกลงซื้อขายสินค้าหรือบริการ</p>
                                       <ul className="text-muted small ps-3 mb-0">
                                           <li className="mb-2"><strong>การสร้าง:</strong> สามารถสร้างขึ้นใหม่ทั้งหมด <strong>หรือเลือกดึงข้อมูลจาก "ใบเสนอราคา" ที่มีอยู่แล้ว</strong> เข้าระบบโดยระบบจะนำข้อมูลสินค้า รายละเอียด และลูกค้ามาเติมให้อัตโนมัติในฟอร์ม</li>
                                           <li className="mb-2 text-warning text-darken-2"><strong>การทำงานต่อเนื่อง:</strong> เมื่อส่งให้ลูกค้าและลูกค้าชำระเงินเรียบร้อยแล้ว สามารถนำใบแจ้งหนี้นี้ไปอ้างอิงและแปลงให้กลายเป็น <strong>ใบเสร็จรับเงิน/ใบกำกับภาษี</strong> (Billing Note) ได้ทันที</li>
                                       </ul>
                                    </div>
                                    <div className="text-center mt-3 text-muted">
                                        <i className="mdi mdi-arrow-down mdi-24px"></i>
                                    </div>
                                </div>
                    
                                {/* ใบเสร็จรับเงิน / ใบกำกับภาษี */}
                                <div className="col-12">
                                    <div className="card border bg-light shadow-sm rounded-4 p-4">
                                       <div className="d-flex align-items-center mb-3">
                                           <div className="icon-circle bg-success bg-opacity-10 text-success rounded-circle me-3 border border-success border-opacity-25" style={{width: '50px', height: '50px'}}>
                                               <i className="mdi mdi-receipt-text-outline mdi-24px"></i>
                                           </div>
                                           <h5 className="fw-bold mb-0">3. ใบเสร็จรับเงิน / ใบกำกับภาษี (Billing Note / Tax Invoice)</h5>
                                       </div>
                                       <p className="text-muted mb-3">เอกสารยืนยันการรับชำระเงินและเก็บเป็นประวัติการทำรายรับสำหรับบริษัท</p>
                                       <ul className="text-muted small ps-3 mb-0">
                                           <li className="mb-2"><strong>การสร้าง:</strong> สร้างแยกเองได้อิสระ หรือ <strong>เพื่อความสะดวกรวดเร็วที่สุด สามารถดึงข้อมูลและอ้างอิงสร้างต่อยอดโดยตรงจาก "ใบเสนอราคา" หรือ "ใบแจ้งหนี้"</strong> ที่ทำไว้ก่อนหน้าได้เลย ข้อมูลทุกรายการ ทุน และจำนวนส่วนลดจะถูกเชื่อมโยงต่อกันทำให้การบันทึกบัญชีแม่นยำ</li>
                                           <li className="mb-2"><strong>การแนบหลักฐาน:</strong> สำหรับใบเสร็จ สามารถอัปโหลดและแนบไฟล์สลิป/หลักฐานการโอนเงินของลูกค้าเก็บไว้ในระบบได้ เพื่อให้ตรวจสอบย้อนหลังได้สะดวก ไม่สูญหาย</li>
                                       </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                    </div>
                </div>
            </div>

            <style>{`
                .icon-circle {
                    width: 60px;
                    height: 60px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .text-darken-2 {
                    filter: brightness(0.8);
                }
                .fade-in {
                    animation: fadeIn 0.4s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-shadow:hover {
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
                    transform: translateY(-3px);
                }
                .transition-all {
                    transition: all 0.3s ease;
                }
            `}</style>
        </div>
    );
};

export default UserManual;
