# XÂY DỰNG HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN

**Tên hệ thống:** Devo – Personal Expense Management System

## 1. Giới thiệu đề tài

Trong cuộc sống hiện đại, việc quản lý tài chính cá nhân đóng vai trò quan trọng đối với mỗi người. Tuy nhiên, nhiều người vẫn gặp khó khăn trong việc theo dõi thu nhập, kiểm soát chi tiêu và lập kế hoạch sử dụng tiền một cách hợp lý.

Xuất phát từ nhu cầu đó, đề tài **“Xây dựng hệ thống quản lý chi tiêu cá nhân”** được thực hiện nhằm xây dựng một ứng dụng web hỗ trợ người dùng quản lý các hoạt động tài chính cá nhân một cách thuận tiện và hiệu quả.

Hệ thống Devo cho phép người dùng ghi chép các khoản thu nhập và chi tiêu, quản lý danh mục, phương thức thanh toán, thiết lập ngân sách và theo dõi tình hình tài chính thông qua bảng điều khiển trực quan.

Ngoài ra, hệ thống còn hỗ trợ nhiều ngôn ngữ và thiết kế giao diện tương thích với các thiết bị khác nhau, giúp người dùng dễ dàng truy cập và sử dụng.

## 2. Mục tiêu của đề tài

- Xây dựng hệ thống quản lý thu nhập và chi tiêu cá nhân trên nền tảng web.
- Hỗ trợ người dùng theo dõi và kiểm soát các khoản thu chi.
- Cung cấp các công cụ quản lý ngân sách và giao dịch định kỳ.
- Thống kê và trực quan hóa dữ liệu tài chính thông qua biểu đồ.
- Xây dựng giao diện thân thiện, dễ sử dụng và tương thích với nhiều thiết bị.
- Hỗ trợ nhiều ngôn ngữ nhằm nâng cao khả năng tiếp cận của người dùng.

## 3. Các chức năng chính

### 3.1. Quản lý tài khoản người dùng
- Đăng ký tài khoản mới.
- Đăng nhập và đăng xuất.
- Xác thực người dùng bằng JSON Web Token (JWT).
- Làm mới Access Token bằng Refresh Token.
- Quản lý thông tin cá nhân.
- Hỗ trợ khôi phục mật khẩu thông qua email.

### 3.2. Quản lý giao dịch (Transaction Management)
- Thêm giao dịch thu nhập và chi tiêu.
- Chỉnh sửa thông tin giao dịch.
- Xóa giao dịch.
- Theo dõi số tiền, ngày giao dịch, danh mục và phương thức thanh toán.
- Quản lý lịch sử giao dịch của từng người dùng.

### 3.3. Quản lý danh mục (Category Management)
- Tạo danh mục thu nhập và chi tiêu.
- Chỉnh sửa thông tin danh mục.
- Xóa danh mục.
- Phân loại giao dịch theo từng danh mục.
- Tùy chỉnh màu sắc và biểu tượng danh mục.

### 3.4. Quản lý phương thức thanh toán (Payment Method Management)
- Thêm phương thức thanh toán.
- Chỉnh sửa thông tin phương thức thanh toán.
- Quản lý trạng thái hoạt động của phương thức thanh toán.
- Hỗ trợ nhiều hình thức thanh toán như tiền mặt, chuyển khoản ngân hàng, thẻ tín dụng, thẻ ghi nợ và ví điện tử.

### 3.5. Bảng điều khiển (Dashboard)
- Hiển thị tổng thu nhập.
- Hiển thị tổng chi tiêu.
- Tính toán số dư thu chi.
- Thống kê thu nhập và chi tiêu theo thời gian.
- Hiển thị biểu đồ phân tích chi tiêu theo danh mục.
- Hiển thị các giao dịch gần đây.

### 3.6. Quản lý ngân sách (Budget Management)
- Thiết lập ngân sách chi tiêu.
- Theo dõi số tiền đã sử dụng.
- Theo dõi số tiền còn lại trong ngân sách.
- Quản lý ngân sách theo danh mục và thời gian.

### 3.7. Quản lý giao dịch định kỳ (Recurring Transactions)
- Tạo giao dịch thu nhập hoặc chi tiêu định kỳ.
- Hỗ trợ chu kỳ hàng ngày, hàng tuần, hàng tháng và hàng năm.
- Thiết lập ngày bắt đầu và ngày kết thúc.
- Tự động xử lý các giao dịch đến hạn theo lịch.
- Quản lý trạng thái hoạt động của giao dịch định kỳ.

### 3.8. Hỗ trợ đa ngôn ngữ (Multi-language Support)
Hệ thống hỗ trợ bốn ngôn ngữ:
- Tiếng Việt (Vietnamese).
- Tiếng Anh (English).

### 3.9. Thiết kế giao diện đáp ứng (Responsive Design)
- Hỗ trợ màn hình máy tính (Desktop).
- Hỗ trợ máy tính bảng (Tablet).
- Hỗ trợ điện thoại di động (Mobile).
- Điều chỉnh bố cục giao diện phù hợp với kích thước màn hình.

## 4. Công nghệ sử dụng

### 4.1. Frontend
| Công nghệ | Mục đích sử dụng |
|---|---|
| React | Xây dựng giao diện người dùng |
| Vite | Công cụ phát triển và đóng gói ứng dụng |
| JavaScript | Xử lý logic phía giao diện |
| CSS | Thiết kế và định dạng giao diện |
| i18next | Hỗ trợ đa ngôn ngữ |

### 4.2. Backend
| Công nghệ | Mục đích sử dụng |
|---|---|
| Node.js | Môi trường chạy JavaScript phía máy chủ |
| Express.js | Xây dựng RESTful API |
| PostgreSQL | Hệ quản trị cơ sở dữ liệu |
| pg | Kết nối và truy vấn PostgreSQL |
| JSON Web Token (JWT) | Xác thực và quản lý phiên đăng nhập |
| bcrypt | Mã hóa mật khẩu |
| Nodemailer | Gửi email khôi phục mật khẩu |
| dotenv | Quản lý biến môi trường |
| Helmet | Tăng cường bảo mật HTTP Header |
| CORS | Kiểm soát quyền truy cập tài nguyên giữa các nguồn |

## 5. Cấu trúc thư mục dự án

```text
Xay-dung-he-thong-quan-ly-chi-tieu-ca-nhan/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   └── layout/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── locales/
│   │   │   ├── en/
│   │   │   └── vi/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── database/
│   │   └── migrations/
│   │       └── 001_initial_schema.sql
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── package.json
│   └── test_email.js
│
├── .env.example
├── .gitignore
├── package.json
├── project-structure.txt
├── test_db.js
└── README.md
```

### Mô tả các thư mục chính

**Frontend (`client/src`):**
- `assets/`: Lưu trữ hình ảnh và tài nguyên giao diện.
- `components/`: Chứa các thành phần giao diện có thể tái sử dụng.
- `contexts/`: Quản lý trạng thái và ngữ cảnh dùng chung.
- `hooks/`: Chứa các Custom Hooks.
- `locales/`: Chứa nội dung dịch thuật của các ngôn ngữ.
- `pages/`: Chứa các trang chức năng của hệ thống.
- `services/`: Xử lý các yêu cầu kết nối đến Backend.
- `styles/`: Chứa các tệp CSS của giao diện.

**Backend (`server/src`):**
- `config/`: Cấu hình kết nối cơ sở dữ liệu.
- `controllers/`: Tiếp nhận và xử lý các yêu cầu API.
- `jobs/`: Xử lý các tác vụ chạy theo lịch.
- `middlewares/`: Xử lý xác thực và các chức năng trung gian.
- `repositories/`: Thực hiện truy vấn và thao tác dữ liệu.
- `routes/`: Định nghĩa các tuyến API.
- `services/`: Xử lý logic nghiệp vụ.
- `utils/`: Chứa các hàm tiện ích.
- `validators/`: Kiểm tra và xác thực dữ liệu đầu vào.

## 6. Yêu cầu môi trường

Để cài đặt và chạy dự án, cần chuẩn bị:

- Node.js.
- npm.
- PostgreSQL.
- Git.
- Visual Studio Code hoặc trình soạn thảo mã nguồn tương đương.
- pgAdmin 4 (khuyến nghị để quản lý cơ sở dữ liệu).

## 7. Hướng dẫn cài đặt và chạy dự án

### Bước 1. Cài đặt các thư viện cần thiết

Cài đặt thư viện cho Backend:

```bash
cd server
npm install
```

Cài đặt thư viện cho Frontend bằng một Terminal khác:

```bash
cd client
npm install
```

### Bước 3. Cấu hình biến môi trường

Quay lại thư mục gốc của dự án và tạo tệp `.env` từ tệp mẫu `.env.example`.

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Mở tệp `.env` và cập nhật các thông tin phù hợp với môi trường của máy tính:

- Thông tin kết nối PostgreSQL.
- JWT Secret.
- Thời gian hết hạn Access Token.
- Địa chỉ Frontend.
- Cấu hình Gmail SMTP.
- Múi giờ của ứng dụng.

**Lưu ý:** Không chia sẻ hoặc đưa tệp `.env` chứa thông tin bí mật lên GitHub.

### Bước 4. Tạo cơ sở dữ liệu

1. Mở PostgreSQL bằng pgAdmin 4.
2. Tạo cơ sở dữ liệu mới với tên:

```text
personal_expense
```

3. Mở Query Tool của cơ sở dữ liệu vừa tạo.
4. Mở tệp SQL:

```text
server/database/migrations/001_initial_schema.sql
```

5. Thực thi toàn bộ câu lệnh SQL để khởi tạo cấu trúc cơ sở dữ liệu.

### Bước 5. Khởi động Backend

Mở Terminal thứ nhất:

```powershell
cd server
npm run dev
```

Backend sử dụng địa chỉ:

```text
http://localhost:6116
```

Kiểm tra trạng thái hoạt động của API:

```text
http://localhost:6116/api/health
```

### Bước 6. Khởi động Frontend

Mở Terminal thứ hai:

```powershell
cd client
npm run dev
```

Frontend sử dụng địa chỉ:

```text
http://localhost:9165
```

Mở trình duyệt và truy cập địa chỉ Frontend để sử dụng hệ thống.

## 8. Cấu hình bảo mật

Hệ thống sử dụng một số cơ chế nhằm tăng cường bảo mật:

- Mật khẩu người dùng được mã hóa bằng bcrypt.
- Xác thực bằng Access Token và Refresh Token.
- Kiểm tra quyền sở hữu dữ liệu theo tài khoản người dùng.
- Sử dụng Middleware để xác thực các yêu cầu API.
- Sử dụng Helmet để thiết lập các HTTP Security Headers.
- Sử dụng CORS để kiểm soát nguồn truy cập.
- Các thông tin nhạy cảm được quản lý thông qua biến môi trường.

## 9. Ngôn ngữ hỗ trợ

| Mã ngôn ngữ | Ngôn ngữ |
|---|---|
| vi | Tiếng Việt |
| en | Tiếng Anh |

## 10. Trạng thái dự án

Dự án được xây dựng nhằm phục vụ mục đích học tập và nghiên cứu trong khuôn khổ đồ án học thuật.

Các chức năng của hệ thống đang được phát triển, kiểm thử và hoàn thiện.
