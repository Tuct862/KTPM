# Web quản lý ký túc xá

Project demo cho học phần **Kỹ thuật phần mềm**. Ứng dụng mô phỏng hệ thống quản lý ký túc xá bằng web frontend chạy local, có phân quyền theo vai trò **Quản lý KTX** và **Sinh viên**.

Phạm vi project được rút gọn để phù hợp với bài tập lớn: tập trung vào nghiệp vụ chính, thiết kế rõ ràng, code dễ trình bày và đáp ứng các yêu cầu về phân tích, thiết kế, kiến trúc, Design Pattern, cài đặt và kiểm thử.

## Công nghệ sử dụng

- HTML, CSS, JavaScript module.
- Không dùng npm, CDN hoặc backend.
- Dữ liệu demo lưu bằng `localStorage`.
- Phiên đăng nhập lưu bằng `sessionStorage`.
- Chạy bằng local server của Python.

## Cách chạy ứng dụng

Yêu cầu:

- Python 3.
- Trình duyệt web hiện đại như Chrome, Edge hoặc Firefox.

Mở terminal tại thư mục project:

```powershell
cd "C:\Users\Tuct\Documents\KTPM"
python -m http.server 8000
```

Nếu máy dùng Python Launcher trên Windows:

```powershell
py -3 -m http.server 8000
```

Sau đó mở trình duyệt tại:

```text
http://127.0.0.1:8000
```

Để dừng server, quay lại terminal và nhấn `Ctrl + C`.

## Tài khoản mẫu

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản lý KTX | `quanly` | `quanly123` |
| Sinh viên | `sv001` | `123456` |
| Sinh viên | `sv002` | `123456` |
| Sinh viên | `sv003` | `123456` |
| Sinh viên | `sv004` | `123456` |

Khi quản lý thêm sinh viên mới, hệ thống tự tạo tài khoản đăng nhập cho sinh viên đó:

- Tên đăng nhập: mã sinh viên.
- Mật khẩu: mật khẩu nhập trên form, mặc định là `123456`.

## Chức năng chính

### Quản lý KTX

- Đăng nhập và xem dashboard tổng quan.
- Quản lý sinh viên: thêm, sửa, kiểm tra trùng mã sinh viên/email/tài khoản.
- Quản lý phòng: thêm, sửa, theo dõi sức chứa và số sinh viên đang ở.
- Quản lý cơ sở vật chất: thêm, sửa, theo dõi số lượng và tình trạng.
- Quản lý yêu cầu hỗ trợ: xem danh sách và cập nhật trạng thái xử lý.
- Quản lý vé gửi xe: theo dõi và cập nhật trạng thái vé.
- Xem báo cáo tổng hợp về sinh viên, phòng, yêu cầu hỗ trợ và gửi xe.

### Sinh viên

- Đăng nhập bằng tài khoản sinh viên.
- Xem thông tin cá nhân.
- Xem thông tin phòng ở và bạn cùng phòng.
- Gửi yêu cầu hỗ trợ.
- Xem lịch sử yêu cầu hỗ trợ.
- Xem và đăng ký vé gửi xe.

## Dữ liệu demo

Ứng dụng dùng `localStorage`, vì vậy dữ liệu vẫn còn sau khi reload trang nhưng chỉ nằm trên trình duyệt hiện tại. Dữ liệu không đồng bộ giữa các máy và không phải database thật.

Nút **Khôi phục dữ liệu demo** có tác dụng:

- Xóa dữ liệu hiện tại trong `localStorage`.
- Tạo lại bộ dữ liệu mẫu ban đầu.
- Xóa phiên đăng nhập hiện tại trong `sessionStorage`.
- Đưa người dùng về màn hình đăng nhập.

## Kiến trúc hệ thống

Project được tổ chức theo mô hình **MVC kết hợp 3-tier frontend**:

```text
View -> Controller -> Service -> Repository -> localStorage/sessionStorage
```

Ý nghĩa từng tầng:

- **View**: hiển thị giao diện, form, bảng dữ liệu và nội dung theo từng vai trò.
- **Controller**: xử lý điều hướng, sự kiện người dùng, kiểm tra quyền trước khi gọi nghiệp vụ.
- **Service**: xử lý logic nghiệp vụ, validation, tạo object và cập nhật dữ liệu.
- **Repository**: đọc/ghi dữ liệu, tách phần lưu trữ khỏi nghiệp vụ.
- **Storage**: `localStorage` lưu dữ liệu demo, `sessionStorage` lưu phiên đăng nhập.

Các file chính:

- `src/app.js`: controller chính, xử lý đăng nhập, route, sự kiện và phân quyền thao tác.
- `src/views.js`: render giao diện cho quản lý và sinh viên.
- `src/services.js`: xử lý nghiệp vụ, validation, Factory Method.
- `src/repository.js`: Repository Pattern cho lưu/truy xuất dữ liệu.
- `src/models.js`: định nghĩa các entity OOP.
- `src/schema.js`: mô tả schema logic, khóa, quan hệ và ràng buộc dữ liệu.
- `src/security.js`: phân quyền route, kiểm tra vai trò, sanitize input và giới hạn bảo mật demo.
- `src/data.js`: dữ liệu mẫu ban đầu.
- `src/styles.css`: giao diện responsive.

## Mô hình dữ liệu và OOP

Các entity chính trong project:

- `User`: tài khoản đăng nhập, vai trò và liên kết sinh viên nếu có.
- `Student`: thông tin sinh viên, phòng ở, lớp, email, số điện thoại.
- `Room`: thông tin phòng, sức chứa, danh sách sinh viên và tỷ lệ lấp đầy.
- `Facility`: cơ sở vật chất trong ký túc xá.
- `SupportRequest`: yêu cầu hỗ trợ của sinh viên, trạng thái xử lý và kiểm tra quá hạn.
- `ParkingTicket`: vé gửi xe, loại xe, biển số, phí và trạng thái.

Thiết kế dữ liệu logic nằm trong `src/schema.js`. File này mô tả các collection tương ứng với bảng dữ liệu đề xuất, khóa chính, trường bắt buộc, quan hệ và các ràng buộc như unique username, unique student code, role hợp lệ.

## Design Pattern

Project áp dụng hai Design Pattern chính:

- **Repository Pattern**: `repository.js` đóng vai trò trung gian giữa nghiệp vụ và nơi lưu dữ liệu. Nhờ đó `services.js` không thao tác trực tiếp với `localStorage`. Khi nâng cấp lên backend hoặc database thật, có thể thay Repository mà ít ảnh hưởng tới logic nghiệp vụ.
- **Factory Method**: `RequestFactory` và `ParkingFactory` trong `services.js` chịu trách nhiệm tạo yêu cầu hỗ trợ và vé gửi xe với dữ liệu mặc định thống nhất như mã, ngày tạo, trạng thái ban đầu.

## Bảo mật demo

Vì đây là web tĩnh chạy local, bảo mật được triển khai ở mức phù hợp cho demo:

- Phân quyền theo vai trò `manager` và `student`.
- Chặn route trái quyền bằng `canAccessRoute()`.
- Chặn thao tác trái quyền bằng `assertManager()` và `assertStudent()`.
- Kiểm tra phiên đăng nhập bằng `sessionStorage`.
- Chuẩn hóa dữ liệu nhập trước khi lưu.
- Escape HTML khi render dữ liệu người dùng nhập để hạn chế XSS trong giao diện demo.
- Xóa session khi đăng xuất hoặc khôi phục dữ liệu demo.

Giới hạn quan trọng: mật khẩu demo đang lưu trong `localStorage` dạng text để phục vụ thuyết trình. Cơ chế này không dùng cho production. Nếu nâng cấp thành hệ thống thật, cần backend, database, hash mật khẩu bằng bcrypt/argon2, phân quyền phía server và kiểm soát phiên đăng nhập an toàn hơn.

## Kiểm thử đề xuất

Các luồng chính cần kiểm thử:

- Đăng nhập bằng tài khoản quản lý.
- Đăng nhập bằng tài khoản sinh viên.
- Sinh viên không truy cập được màn hình quản lý.
- Quản lý thêm/sửa sinh viên.
- Sinh viên mới đăng nhập được bằng mã sinh viên.
- Không cho thêm sinh viên trùng mã sinh viên, email hoặc tài khoản.
- Quản lý thêm/sửa phòng và cơ sở vật chất.
- Chặn dữ liệu không hợp lệ như sức chứa âm, phí âm hoặc trạng thái không hợp lệ.
- Sinh viên gửi yêu cầu hỗ trợ.
- Sinh viên đăng ký vé gửi xe.
- Quản lý cập nhật trạng thái yêu cầu hỗ trợ và vé gửi xe.
- Khôi phục dữ liệu demo và kiểm tra dữ liệu quay về trạng thái ban đầu.

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
|   |-- schema.js
|   |-- security.js
|   |-- services.js
|   |-- styles.css
|   `-- views.js
`-- tests/
    `-- smoke.cjs
```

## Ghi chú

Project ưu tiên tính rõ ràng, dễ demo và đúng yêu cầu học phần hơn là triển khai như một hệ thống full-stack. Các phần cần nâng cấp nếu phát triển tiếp gồm backend, database thật, xác thực an toàn, phân quyền phía server, upload ảnh/tài liệu và kiểm thử tự động đầy đủ hơn.
