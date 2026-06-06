import { PARKING_STATUSES, REQUEST_STATUSES } from "./data.js";

const formatter = new Intl.NumberFormat("vi-VN");

export const money = (value) => `${formatter.format(value)} đ`;
export const date = (value) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));

export const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const statusClass = (status) => {
  if (["Hoàn thành", "Đang hiệu lực"].includes(status)) return "success";
  if (["Đang xử lý", "Sắp hết hạn"].includes(status)) return "warning";
  if (["Từ chối", "Đã hủy"].includes(status)) return "danger";
  return "neutral";
};

const optionTags = (values, selected) =>
  values.map((value) => `<option ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");

export class AppView {
  constructor(root) {
    this.root = root;
  }

  renderLogin(errorMessage = "") {
    this.root.innerHTML = `
      <main class="login-screen">
        <section class="login-panel" aria-labelledby="login-title">
          <div class="brand-line"></div>
          <p class="eyebrow">Phenikaa Dormitory</p>
          <h1 id="login-title">Quản lý ký túc xá</h1>
          <form class="login-form" data-form="login">
            <label>
              Vai trò
              <select name="role" data-testid="role-select">
                <option value="manager">Quản lý KTX</option>
                <option value="student">Sinh viên</option>
              </select>
            </label>
            <label>
              Tên đăng nhập
              <input name="username" data-testid="username-input" autocomplete="username" value="quanly" required />
            </label>
            <label>
              Mật khẩu
              <input name="password" data-testid="password-input" type="password" autocomplete="current-password" value="quanly123" required />
            </label>
            ${errorMessage ? `<p class="form-error" role="alert">${escapeHtml(errorMessage)}</p>` : ""}
            <button class="primary-button" data-testid="login-submit" type="submit">Đăng nhập</button>
          </form>
          <div class="demo-accounts">
            <strong>Tài khoản mẫu</strong>
            <span>Quản lý: quanly / quanly123</span>
            <span>Sinh viên: sv001 / 123456</span>
          </div>
          <button class="ghost-button" type="button" data-action="reset-demo">Khôi phục dữ liệu demo</button>
        </section>
      </main>
    `;
  }

  renderShell({ user, route, body, operationMessage = "" }) {
    const navItems = user.isManager()
      ? [
          ["dashboard", "Tổng quan"],
          ["rooms", "Phòng"],
          ["students", "Sinh viên"],
          ["requests", "Yêu cầu"],
          ["parking", "Gửi xe"],
          ["reports", "Báo cáo"],
        ]
      : [
          ["profile", "Cá nhân"],
          ["room", "Phòng"],
          ["student-parking", "Gửi xe"],
          ["support", "Hỗ trợ"],
        ];

    this.root.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div>
            <p class="eyebrow">KTX Phenikaa</p>
            <h1>Quản lý ký túc xá</h1>
          </div>
          <nav class="nav-list" aria-label="Chức năng">
            ${navItems
              .map(
                ([key, label]) => `
                  <button class="${route === key ? "active" : ""}" data-route="${key}" data-testid="nav-${key}">
                    ${label}
                  </button>
                `,
              )
              .join("")}
          </nav>
          <button class="ghost-button" type="button" data-action="reset-demo">Khôi phục dữ liệu demo</button>
        </aside>
        <main class="workspace">
          <header class="topbar">
            <div>
              <p class="eyebrow">${user.role === "manager" ? "Quản lý" : "Sinh viên"}</p>
              <h2>${escapeHtml(user.name)}</h2>
            </div>
            <button class="ghost-button" type="button" data-action="logout">Đăng xuất</button>
          </header>
          <section class="content-area" data-testid="content-area">
            ${operationMessage ? `<p class="operation-message" role="alert">${escapeHtml(operationMessage)}</p>` : ""}
            ${body}
          </section>
        </main>
      </div>
    `;
  }
}

export const managerViews = {
  dashboard({ stats, requests, rooms }) {
    const urgentRequests = requests.filter((request) => request.status !== "Hoàn thành").slice(0, 4);
    return `
      <div class="section-heading">
        <h2>Tổng quan vận hành</h2>
        <span>Cập nhật theo dữ liệu demo hiện tại</span>
      </div>
      <div class="metric-grid">
        ${metric("Sinh viên nội trú", stats.students)}
        ${metric("Phòng quản lý", stats.rooms)}
        ${metric("Tỷ lệ lấp đầy", `${stats.occupancy}%`)}
        ${metric("Yêu cầu mở", stats.pendingRequests)}
        ${metric("Vé xe hiệu lực", stats.activeTickets)}
        ${metric("Chỗ còn trống", stats.emptySlots)}
      </div>
      <div class="two-column">
        <section class="panel">
          <h3>Yêu cầu cần theo dõi</h3>
          <div class="item-list">
            ${urgentRequests.map(requestListItem).join("") || empty("Không có yêu cầu mở.")}
          </div>
        </section>
        <section class="panel">
          <h3>Tình trạng phòng</h3>
          <div class="item-list">
            ${rooms
              .map(
                (room) => `
                  <div class="list-row">
                    <div>
                      <strong>Phòng ${escapeHtml(room.name)}</strong>
                      <span>${room.studentIds.length}/${room.capacity} sinh viên</span>
                    </div>
                    <span class="badge ${statusClass(room.status)}">${escapeHtml(room.status)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      </div>
    `;
  },

  rooms({ rooms, students, facilitiesByRoom, facilities, editing }) {
    return `
      <div class="section-heading">
        <h2>Quản lý phòng</h2>
        <span>Phòng, sĩ số, điện nước và cơ sở vật chất</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Phòng</th>
              <th>Tòa</th>
              <th>Sĩ số</th>
              <th>Còn trống</th>
              <th>Điện/nước</th>
              <th>CSVC</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${rooms
              .map((room) => {
                const facilityText = facilitiesByRoom.get(room.id).map((facility) => facility.name).join(", ");
                return `
                  <tr>
                    <td><strong>${escapeHtml(room.name)}</strong></td>
                    <td>${escapeHtml(room.building)}</td>
                    <td>${room.studentIds.length}/${room.capacity}</td>
                    <td>${room.emptySlots}</td>
                    <td>${room.electricityKwh} kWh / ${room.waterM3} m3</td>
                    <td>${escapeHtml(facilityText)}</td>
                    <td><span class="badge ${statusClass(room.status)}">${escapeHtml(room.status)}</span></td>
                    <td>
                      <button class="small-button" type="button" data-action="edit-room" data-id="${room.id}">Sửa</button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      ${roomEditor({ rooms, editing })}
      <section class="panel">
        <h3>Danh sách sinh viên theo phòng</h3>
        <div class="room-group-list">
          ${rooms
            .map((room) => {
              const roomStudents = students.filter((student) => student.roomId === room.id);
              return `
                <div class="room-group">
                  <strong>Phòng ${escapeHtml(room.name)}</strong>
                  <span>${roomStudents.map((student) => escapeHtml(student.name)).join(", ") || "Chưa có sinh viên"}</span>
                </div>
              `;
            })
            .join("")}
        </div>
      </section>
      ${facilityEditor({ rooms, facilities, facilitiesByRoom, editing })}
    `;
  },

  students({ students, rooms, editing }) {
    const roomMap = new Map(rooms.map((room) => [room.id, room.name]));
    return `
      <div class="section-heading">
        <h2>Quản lý sinh viên</h2>
        <span>Thông tin nội trú và công nợ gần nhất</span>
      </div>
      ${studentEditor({ students, rooms, editing })}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã SV</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Phòng</th>
              <th>SĐT</th>
              <th>Tiền phòng</th>
              <th>Điện nước</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${students
              .map(
                (student) => `
                  <tr>
                    <td>${escapeHtml(student.code)}</td>
                    <td><strong>${escapeHtml(student.name)}</strong></td>
                    <td>${escapeHtml(student.className)}</td>
                    <td>${escapeHtml(roomMap.get(student.roomId) ?? "-")}</td>
                    <td>${escapeHtml(student.phone)}</td>
                    <td>${money(student.monthlyRent)}</td>
                    <td>${money(student.utilityDebt)}</td>
                    <td>
                      <button class="small-button" type="button" data-action="edit-student" data-id="${student.id}" data-testid="edit-student-${student.code}">Sửa</button>
                    </td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  requests({ requests, students }) {
    const studentMap = new Map(students.map((student) => [student.id, student]));
    return `
      <div class="section-heading">
        <h2>Quản lý yêu cầu hỗ trợ</h2>
        <span>Cập nhật trạng thái và phản hồi cho sinh viên</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Sinh viên</th>
              <th>Loại</th>
              <th>Nội dung</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${requests
              .map((request) => {
                const student = studentMap.get(request.studentId);
                return `
                  <tr>
                    <td>${escapeHtml(request.id)}</td>
                    <td>${escapeHtml(student?.name ?? request.studentId)}</td>
                    <td>${escapeHtml(request.type)}</td>
                    <td>${escapeHtml(request.content)}</td>
                    <td>${date(request.createdAt)}</td>
                    <td>
                      <select class="compact-select" data-action="request-status" data-id="${request.id}" data-testid="request-status-${request.id}">
                        ${optionTags(REQUEST_STATUSES, request.status)}
                      </select>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  parking({ tickets, students }) {
    const studentMap = new Map(students.map((student) => [student.id, student]));
    return `
      <div class="section-heading">
        <h2>Quản lý gửi xe</h2>
        <span>Vé tháng, bãi xe và trạng thái duyệt</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã vé</th>
              <th>Sinh viên</th>
              <th>Phương tiện</th>
              <th>Biển số</th>
              <th>Bãi</th>
              <th>Hạn</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${tickets
              .map((ticket) => {
                const student = studentMap.get(ticket.studentId);
                return `
                  <tr>
                    <td>${escapeHtml(ticket.id)}</td>
                    <td>${escapeHtml(student?.name ?? ticket.studentId)}</td>
                    <td>${escapeHtml(ticket.vehicleType)}</td>
                    <td>${escapeHtml(ticket.plateNumber)}</td>
                    <td>${escapeHtml(ticket.zone)}</td>
                    <td>${date(ticket.validTo)}</td>
                    <td>
                      <select class="compact-select" data-action="parking-status" data-id="${ticket.id}">
                        ${optionTags(PARKING_STATUSES, ticket.status)}
                      </select>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  reports({ report }) {
    return `
      <div class="section-heading">
        <h2>Báo cáo tổng hợp</h2>
        <span>Tổng hợp nhanh cho ban quản lý</span>
      </div>
      <div class="metric-grid">
        ${metric("Doanh thu dự kiến", money(report.expectedMonthlyRevenue))}
        ${metric("Yêu cầu quá hạn", report.lateRequests.length)}
      </div>
      <div class="two-column">
        <section class="panel">
          <h3>Yêu cầu theo trạng thái</h3>
          <div class="item-list">
            ${report.requestByStatus
              .map(
                (item) => `
                  <div class="list-row">
                    <span>${escapeHtml(item.status)}</span>
                    <strong>${item.count}</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
        <section class="panel">
          <h3>Công suất phòng</h3>
          <div class="item-list">
            ${report.roomRows
              .map(
                (room) => `
                  <div class="list-row">
                    <span>Phòng ${escapeHtml(room.name)} - ${escapeHtml(room.status)}</span>
                    <strong>${room.used}/${room.capacity}</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      </div>
    `;
  },
};

export const studentViews = {
  profile({ student, room, tickets }) {
    return `
      <div class="section-heading">
        <h2>Thông tin cá nhân</h2>
        <span>Hồ sơ nội trú đang được quản lý</span>
      </div>
      <div class="profile-grid">
        ${profileItem("Họ tên", student.name)}
        ${profileItem("Mã sinh viên", student.code)}
        ${profileItem("Lớp", student.className)}
        ${profileItem("Ngày sinh", date(student.birthDate))}
        ${profileItem("Số điện thoại", student.phone)}
        ${profileItem("Email", student.email)}
        ${profileItem("Phòng", room?.name ?? "-")}
        ${profileItem("Ngày vào KTX", date(student.checkInDate))}
        ${profileItem("Tiền phòng", money(student.monthlyRent))}
        ${profileItem("Điện nước", money(student.utilityDebt))}
        ${profileItem("Vé xe", tickets.length ? tickets[0].status : "Chưa đăng ký")}
      </div>
    `;
  },

  room({ student, room, roommates, facilities }) {
    return `
      <div class="section-heading">
        <h2>Phòng ${escapeHtml(room.name)}</h2>
        <span>Tòa ${escapeHtml(room.building)}, tầng ${room.floor}</span>
      </div>
      <div class="metric-grid">
        ${metric("Sĩ số", `${room.studentIds.length}/${room.capacity}`)}
        ${metric("Chỗ còn trống", room.emptySlots)}
        ${metric("Tiền phòng", money(student.monthlyRent))}
        ${metric("Điện nước", `${room.electricityKwh} kWh / ${room.waterM3} m3`)}
      </div>
      <div class="two-column">
        <section class="panel">
          <h3>Bạn cùng phòng</h3>
          <div class="item-list">
            ${roommates
              .map(
                (roommate) => `
                  <div class="list-row">
                    <div>
                      <strong>${escapeHtml(roommate.name)}</strong>
                      <span>${escapeHtml(roommate.className)} - ${escapeHtml(roommate.phone)}</span>
                    </div>
                  </div>
                `,
              )
              .join("") || empty("Chưa có bạn cùng phòng.")}
          </div>
        </section>
        <section class="panel">
          <h3>Cơ sở vật chất</h3>
          <div class="item-list">
            ${facilities
              .map(
                (facility) => `
                  <div class="list-row">
                    <span>${escapeHtml(facility.name)} x${facility.quantity}</span>
                    <span class="badge ${statusClass(facility.condition)}">${escapeHtml(facility.condition)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      </div>
    `;
  },

  parking({ tickets }) {
    return `
      <div class="section-heading">
        <h2>Gửi xe</h2>
        <span>Vé tháng và yêu cầu đăng ký mới</span>
      </div>
      <div class="item-list parking-list">
        ${tickets
          .map(
            (ticket) => `
              <div class="list-row">
                <div>
                  <strong>${escapeHtml(ticket.vehicleType)} - ${escapeHtml(ticket.plateNumber)}</strong>
                  <span>${escapeHtml(ticket.zone)} · hạn đến ${date(ticket.validTo)} · ${money(ticket.monthlyFee)}</span>
                </div>
                <span class="badge ${statusClass(ticket.status)}">${escapeHtml(ticket.status)}</span>
              </div>
            `,
          )
          .join("") || empty("Bạn chưa có vé xe.")}
      </div>
      <form class="inline-form" data-form="parking">
        <label>
          Loại xe
          <select name="vehicleType">
            <option>Xe máy</option>
            <option>Xe đạp điện</option>
          </select>
        </label>
        <label>
          Biển số
          <input name="plateNumber" placeholder="VD: 29-E1 123.45" required />
        </label>
        <label>
          Bãi xe
          <select name="zone">
            <option>Bãi A</option>
            <option>Bãi B</option>
          </select>
        </label>
        <button class="primary-button" type="submit">Gửi đăng ký</button>
      </form>
    `;
  },

  support({ requests }) {
    return `
      <div class="section-heading">
        <h2>Yêu cầu hỗ trợ</h2>
        <span>Đổi/trả phòng, cơ sở vật chất, điện nước và mạng</span>
      </div>
      <form class="support-form" data-form="support" data-testid="support-form">
        <label>
          Loại yêu cầu
          <select name="type" data-testid="support-type">
            <option>Cơ sở vật chất</option>
            <option>Điện/nước</option>
            <option>Mạng</option>
            <option>Đổi/trả phòng</option>
          </select>
        </label>
        <label>
          Nội dung
          <textarea name="content" data-testid="support-content" rows="4" placeholder="Nhập nội dung cần hỗ trợ" required></textarea>
        </label>
        <button class="primary-button" data-testid="support-submit" type="submit">Gửi yêu cầu</button>
      </form>
      <section class="panel">
        <h3>Lịch sử yêu cầu</h3>
        <div class="item-list" data-testid="student-request-list">
          ${requests.map(requestListItem).join("") || empty("Chưa có yêu cầu.")}
        </div>
      </section>
    `;
  },
};

function studentEditor({ students, rooms, editing }) {
  const current = editing?.type === "student" ? students.find((student) => student.id === editing.id) : null;
  const title = current ? "Sửa sinh viên" : "Thêm sinh viên";
  return `
    <section class="panel">
      <div class="form-heading">
        <h3>${title}</h3>
        ${current ? `<button class="small-button" type="button" data-action="cancel-edit">Hủy sửa</button>` : ""}
      </div>
      <form class="management-form" data-form="student" data-testid="student-form">
        <input type="hidden" name="id" value="${escapeHtml(current?.id ?? "")}" />
        <label>Họ tên<input name="name" value="${escapeHtml(current?.name ?? "")}" required /></label>
        <label>Mã SV<input name="code" value="${escapeHtml(current?.code ?? "")}" required /></label>
        <label>Lớp<input name="className" value="${escapeHtml(current?.className ?? "")}" required /></label>
        <label>Ngày sinh<input name="birthDate" type="date" value="${escapeHtml(current?.birthDate ?? "")}" required /></label>
        <label>SĐT<input name="phone" value="${escapeHtml(current?.phone ?? "")}" required /></label>
        <label>Email<input name="email" type="email" value="${escapeHtml(current?.email ?? "")}" required /></label>
        <label>Quê quán<input name="hometown" value="${escapeHtml(current?.hometown ?? "")}" required /></label>
        <label>Phòng<select name="roomId" required>${roomOptions(rooms, current?.roomId)}</select></label>
        <label>Ngày vào KTX<input name="checkInDate" type="date" value="${escapeHtml(current?.checkInDate ?? new Date().toISOString().slice(0, 10))}" required /></label>
        <label>Tiền phòng<input name="monthlyRent" type="number" min="0" step="1000" value="${escapeHtml(current?.monthlyRent ?? 500000)}" required /></label>
        <label>Điện nước<input name="utilityDebt" type="number" min="0" step="1000" value="${escapeHtml(current?.utilityDebt ?? 0)}" required /></label>
        <label>Mật khẩu đăng nhập<input name="loginPassword" value="${current ? "" : "123456"}" placeholder="${current ? "Để trống nếu giữ nguyên" : "123456"}" ${current ? "" : "required"} /></label>
        <button class="primary-button" type="submit" data-testid="save-student">${current ? "Lưu sinh viên" : "Thêm sinh viên"}</button>
      </form>
      <p class="form-note">Tài khoản sinh viên dùng mã SV làm tên đăng nhập. Khi sửa sinh viên, để trống mật khẩu nếu muốn giữ nguyên mật khẩu cũ.</p>
    </section>
  `;
}

function roomEditor({ rooms, editing }) {
  const current = editing?.type === "room" ? rooms.find((room) => room.id === editing.id) : null;
  const roomStatuses = ["Đang sử dụng", "Còn chỗ", "Đang sửa chữa"];
  const title = current ? "Sửa phòng" : "Thêm phòng";
  return `
    <section class="panel">
      <div class="form-heading">
        <h3>${title}</h3>
        ${current ? `<button class="small-button" type="button" data-action="cancel-edit">Hủy sửa</button>` : ""}
      </div>
      <form class="management-form" data-form="room" data-testid="room-form">
        <input type="hidden" name="id" value="${escapeHtml(current?.id ?? "")}" />
        <label>Tên phòng<input name="name" value="${escapeHtml(current?.name ?? "")}" placeholder="VD: A102" required /></label>
        <label>Tòa<input name="building" value="${escapeHtml(current?.building ?? "")}" placeholder="VD: A" required /></label>
        <label>Tầng<input name="floor" type="number" min="1" value="${escapeHtml(current?.floor ?? 1)}" required /></label>
        <label>Sức chứa<input name="capacity" type="number" min="1" value="${escapeHtml(current?.capacity ?? 4)}" required /></label>
        <label>Trạng thái<select name="status">${optionTags(roomStatuses, current?.status ?? "Còn chỗ")}</select></label>
        <label>Giá phòng<input name="monthlyPrice" type="number" min="0" step="1000" value="${escapeHtml(current?.monthlyPrice ?? 500000)}" required /></label>
        <label>Điện kWh<input name="electricityKwh" type="number" min="0" value="${escapeHtml(current?.electricityKwh ?? 0)}" required /></label>
        <label>Nước m3<input name="waterM3" type="number" min="0" value="${escapeHtml(current?.waterM3 ?? 0)}" required /></label>
        <button class="primary-button" type="submit" data-testid="save-room">${current ? "Lưu phòng" : "Thêm phòng"}</button>
      </form>
    </section>
  `;
}

function facilityEditor({ rooms, facilities, facilitiesByRoom, editing }) {
  const current = editing?.type === "facility" ? facilities.find((facility) => facility.id === editing.id) : null;
  const conditionOptions = ["Tốt", "Cần kiểm tra", "Cần thay", "Đang sửa"];
  const currentRoomId = current
    ? rooms.find((room) => room.facilityIds.includes(current.id))?.id
    : rooms[0]?.id;
  const roomFacilityRows = rooms
    .flatMap((room) =>
      facilitiesByRoom.get(room.id).map((facility) => ({ room, facility })),
    )
    .map(
      ({ room, facility }) => `
        <tr>
          <td>${escapeHtml(facility.name)}</td>
          <td>${facility.quantity}</td>
          <td>Phòng ${escapeHtml(room.name)}</td>
          <td><span class="badge ${statusClass(facility.condition)}">${escapeHtml(facility.condition)}</span></td>
          <td><button class="small-button" type="button" data-action="edit-facility" data-id="${facility.id}">Sửa</button></td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="panel">
      <div class="form-heading">
        <h3>${current ? "Sửa cơ sở vật chất" : "Thêm cơ sở vật chất"}</h3>
        ${current ? `<button class="small-button" type="button" data-action="cancel-edit">Hủy sửa</button>` : ""}
      </div>
      <form class="management-form facility-form" data-form="facility" data-testid="facility-form">
        <input type="hidden" name="id" value="${escapeHtml(current?.id ?? "")}" />
        <label>Tên thiết bị<input name="name" value="${escapeHtml(current?.name ?? "")}" required /></label>
        <label>Số lượng<input name="quantity" type="number" min="1" value="${escapeHtml(current?.quantity ?? 1)}" required /></label>
        <label>Tình trạng<select name="condition">${optionTags(conditionOptions, current?.condition ?? "Tốt")}</select></label>
        <label>Gán cho phòng<select name="roomId">${roomOptions(rooms, currentRoomId)}</select></label>
        <button class="primary-button" type="submit" data-testid="save-facility">${current ? "Lưu CSVC" : "Thêm CSVC"}</button>
      </form>
      <div class="table-wrap compact-table">
        <table>
          <thead>
            <tr>
              <th>Thiết bị</th>
              <th>SL</th>
              <th>Phòng</th>
              <th>Tình trạng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>${roomFacilityRows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function roomOptions(rooms, selectedRoomId) {
  return rooms
    .map(
      (room) =>
        `<option value="${escapeHtml(room.id)}" ${room.id === selectedRoomId ? "selected" : ""}>Phòng ${escapeHtml(room.name)}</option>`,
    )
    .join("");
}

function metric(label, value) {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function profileItem(label, value) {
  return `
    <article class="profile-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function requestListItem(request) {
  return `
    <div class="list-row">
      <div>
        <strong>${escapeHtml(request.type)}</strong>
        <span>${escapeHtml(request.content)} · ${date(request.createdAt)}</span>
      </div>
      <span class="badge ${statusClass(request.status)}">${escapeHtml(request.status)}</span>
    </div>
  `;
}

function empty(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}
