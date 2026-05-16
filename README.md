# Web quản lý ký túc xá

Ứng dụng demo cho học phần Kỹ thuật phần mềm. Project mô phỏng hệ thống quản lý ký túc xá ở mức web frontend chạy local, có phân quyền cơ bản cho Quản lý KTX và Sinh viên.

## Chạy ứng dụng

Yêu cầu:

- Python 3
- Trình duyệt web hiện đại như Chrome, Edge hoặc Firefox

Mở terminal tại thư mục project và chạy:

```powershell
python -m http.server 8000
```

Nếu máy dùng Python Launcher trên Windows, có thể chạy:

```powershell
py -3 -m http.server 8000
```

Sau đó mở trình duyệt tại:

```text
http://127.0.0.1:8000
```

Nếu muốn dừng server, quay lại terminal và nhấn `Ctrl + C`.

## Tài khoản mẫu

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản lý KTX | `quanly` | `quanly123` |
| Sinh viên | `sv001` | `123456` |
| Sinh viên | `sv002` | `123456` |
| Sinh viên | `sv003` | `123456` |
| Sinh viên | `sv004` | `123456` |

## Chức năng chính

### Quản lý KTX

- Xem dashboard tổng quan.
- Quản lý phòng và cơ sở vật chất.
- Thêm/sửa sinh viên.
- Thêm/sửa phòng.
- Thêm/sửa cơ sở vật chất.
- Theo dõi và cập nhật trạng thái yêu cầu hỗ trợ.
- Quản lý vé gửi xe.
- Xem báo cáo tổng hợp.

### Sinh viên

- Xem thông tin cá nhân.
- Xem thông tin phòng và bạn cùng phòng.
- Xem/đăng ký vé gửi xe.
- Gửi yêu cầu hỗ trợ.
- Theo dõi lịch sử yêu cầu hỗ trợ.

## Dữ liệu demo

Ứng dụng lưu dữ liệu bằng `localStorage` trong trình duyệt. Vì vậy:

- Dữ liệu vẫn còn sau khi reload trang.
- Dữ liệu chỉ nằm trên trình duyệt hiện tại, không đồng bộ giữa các máy.
- Nút **Khôi phục dữ liệu demo** sẽ đưa toàn bộ dữ liệu về trạng thái mẫu ban đầu.

Khi quản lý thêm sinh viên mới, hệ thống tự tạo tài khoản đăng nhập cho sinh viên đó:

- Tên đăng nhập: mã sinh viên
- Mật khẩu: mật khẩu nhập trên form, mặc định `123456`

## Kiến trúc

Project được tổ chức theo MVC kết hợp 3-tier frontend:

```text
Người dùng
  -> View
  -> Controller
  -> Service
  -> Repository
  -> localStorage / sessionStorage
```

Các file chính:

- `src/models.js`: định nghĩa các entity như `User`, `Student`, `Room`, `Facility`, `SupportRequest`, `ParkingTicket`.
- `src/views.js`: render giao diện theo vai trò.
- `src/app.js`: controller chính, xử lý đăng nhập, điều hướng và sự kiện người dùng.
- `src/services.js`: xử lý nghiệp vụ.
- `src/repository.js`: đọc/ghi dữ liệu từ `localStorage` và `sessionStorage`.
- `src/data.js`: dữ liệu mẫu ban đầu.

## Design Pattern

Project áp dụng:

- **Repository Pattern**: tách phần lưu trữ dữ liệu khỏi phần nghiệp vụ. Service không thao tác trực tiếp với `localStorage`, mà thông qua Repository.
- **Factory Method**: dùng `RequestFactory` để tạo yêu cầu hỗ trợ và `ParkingFactory` để tạo vé gửi xe với dữ liệu mặc định thống nhất.

## Kiểm thử

Các kịch bản đã kiểm thử:

- Đăng nhập quản lý.
- Xem dashboard.
- Thêm và sửa sinh viên.
- Đăng nhập bằng sinh viên vừa tạo.
- Thêm phòng và cơ sở vật chất.
- Cập nhật trạng thái yêu cầu hỗ trợ.
- Sinh viên gửi yêu cầu hỗ trợ.
- Kiểm tra giao diện desktop/mobile.

## Cấu trúc thư mục

```text
KTPM/
|-- index.html
|-- README.md
|-- src/
|   |-- app.js
|   |-- data.js
|   |-- models.js
|   |-- repository.js
|   |-- services.js
|   |-- styles.css
|   `-- views.js
|-- tests/
|   `-- smoke.cjs
`-- docs/
    `-- assets/
```