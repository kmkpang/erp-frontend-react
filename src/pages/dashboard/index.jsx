import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { config } from "@constant";
import { fetchApi } from "@utils/api";
import moment from "moment";
import "./Dashboard.css";

const Dashboard = () => {
  const token = localStorage.getItem("@accessToken");

  // Fetch Summary Stats
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await fetchApi(`${config.url}/Dashboard/getSummaryStats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data;
    }
  });

  // Fetch Sales Trends
  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: async () => {
      const res = await fetchApi(`${config.url}/Dashboard/getSalesTrends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data;
    }
  });

  // Fetch Top Ranking
  const { data: ranking, isLoading: isRankingLoading } = useQuery({
    queryKey: ["dashboard-ranking"],
    queryFn: async () => {
      const res = await fetchApi(`${config.url}/Dashboard/getTopRanking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data;
    }
  });

  if (isSummaryLoading || isTrendsLoading || isRankingLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const pieData = ranking?.topProducts?.map((p) => ({
    name: p.product?.productname || "Unknown",
    value: parseFloat(p.total_revenue)
  })) || [];

  return (
    <div className="dashboard-page p-4">
      <h2 className="mb-4 fw-bold">ระบบรายงานภาพรวม</h2>

      {/* Summary Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="stat-card card-sales">
            <div className="stat-icon"><i className="mdi mdi-currency-usd"></i></div>
            <div className="stat-content">
              <span className="stat-label">ยอดขายเดือนนี้</span>
              <h3 className="stat-value">฿{(summary?.monthlySales || 0).toLocaleString()}</h3>
              <span className={`stat-diff ${summary?.monthlySales >= summary?.lastMonthSales ? 'positive' : 'negative'}`}>
                {summary?.monthlySales >= summary?.lastMonthSales ? '↑' : '↓'}
                {summary?.lastMonthSales > 0 ? (Math.abs((summary.monthlySales - summary.lastMonthSales) / summary.lastMonthSales) * 100).toFixed(1) : 100}% จากเดือนที่แล้ว
              </span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card card-pending">
            <div className="stat-icon"><i className="mdi mdi-clock-outline"></i></div>
            <div className="stat-content">
              <span className="stat-label">บิลรอดำเนินการ</span>
              <h3 className="stat-value">{summary?.pendingInvoicesCount || 0} รายการ</h3>
              <span className="stat-sub">สถานะ: รอชำระเงิน</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card card-overdue">
            <div className="stat-icon"><i className="mdi mdi-alert-circle-outline"></i></div>
            <div className="stat-content">
              <span className="stat-label">ยอดค้างชำระเกินกำหนด</span>
              <h3 className="stat-value text-danger">฿{(summary?.overdueAmount || 0).toLocaleString()}</h3>
              <span className="stat-sub">เงินทุนที่ยังไม่เข้า</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card card-profit">
            <div className="stat-icon"><i className="mdi mdi-trending-up"></i></div>
            <div className="stat-content">
              <span className="stat-label">กำไรประมาณการ</span>
              <h3 className="stat-value text-success">฿{(summary?.estimatedProfit || 0).toLocaleString()}</h3>
              <span className="stat-sub">หักลบค่าใช้จ่ายแล้ว</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Sales Trend Chart */}
        <div className="col-lg-8">
          <div className="chart-card shadow-sm p-4">
            <h4 className="card-title mb-4">แนวโน้มยอดขาย (30 วันล่าสุด)</h4>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => moment(val).format("DD MMM")} 
                    stroke="#888"
                    fontSize={12}
                  />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `฿${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(val) => [`฿${val.toLocaleString()}`, "ยอดขาย"]}
                    labelFormatter={(label) => moment(label).format("DD MMMM YYYY")}
                  />
                  <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Product Share Pie Chart */}
        <div className="col-lg-4">
          <div className="chart-card shadow-sm p-4 h-100">
            <h4 className="card-title mb-4">สัดส่วนสินค้าขายดี</h4>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `฿${val.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="col-lg-6">
          <div className="chart-card shadow-sm p-4 h-100">
            <h4 className="card-title mb-4">ลูกค้า V.I.P. (สูงสุด)</h4>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ชื่อลูกค้า</th>
                    <th className="text-end">ยอดซื้อรวว</th>
                    <th className="text-center">ระดับ</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking?.topCustomers?.map((cus, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-small me-2">{cus.customer?.cus_name?.charAt(0)}</div>
                          {cus.customer?.cus_name}
                        </div>
                      </td>
                      <td className="text-end fw-bold">฿{(cus.total_spend || 0).toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`badge ${idx === 0 ? 'bg-warning text-dark' : 'bg-light text-dark'}`}>
                          {idx === 0 ? 'Gold' : idx === 1 ? 'Silver' : 'Member'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="col-lg-6">
          <div className="chart-card shadow-sm p-4 h-100">
            <h4 className="card-title mb-4">สินค้า 5 อันดับยอดนิยม</h4>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>สินค้า</th>
                    <th className="text-center">จำนวน</th>
                    <th className="text-end">ยอดขาย</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking?.topProducts?.map((prod, idx) => (
                    <tr key={idx}>
                      <td>{prod.product?.productname}</td>
                      <td className="text-center">{prod.total_qty} ชิ้น</td>
                      <td className="text-end fw-bold">฿{(prod.total_revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components used for AreaChart
export default Dashboard;
