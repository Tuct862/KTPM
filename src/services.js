import { PARKING_STATUSES, REQUEST_STATUSES } from "./data.js";
import { Facility, ParkingTicket, Room, Student, SupportRequest, User } from "./models.js";
import { sanitizePayload, sanitizeText } from "./security.js";

const idFromTime = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;
const numberOrZero = (value) => Number(value) || 0;
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const requireText = (value, message) => {
  const text = sanitizeText(value);
  if (!text) throw new Error(message);
  return text;
};

const requireNonNegative = (value, message) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(message);
  return number;
};

const requirePositive = (value, message) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(message);
  return number;
};

const requireDate = (value, message) => {
  const text = requireText(value, message);
  if (Number.isNaN(new Date(text).getTime())) throw new Error(message);
  return text;
};

const assertAllowed = (value, allowedValues, message) => {
  if (!allowedValues.includes(value)) throw new Error(message);
  return value;
};

const findById = (items, id) => items.find((item) => item.id === id);

export class RequestFactory {
  static create({ student, type, content }) {
    const now = new Date();
    return new SupportRequest({
      id: idFromTime("REQ"),
      studentId: student.id,
      roomId: student.roomId,
      type: requireText(type, "Loại yêu cầu không được để trống."),
      content: requireText(content, "Nội dung yêu cầu không được để trống."),
      status: "Chờ xử lý",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      dueAt: addDays(now, 2).toISOString(),
      reply: "",
    });
  }
}

export class ParkingFactory {
  static create({ student, vehicleType, plateNumber, zone }) {
    const now = new Date();
    const validTo = addDays(now, 30);
    const safeVehicleType = requireText(vehicleType, "Loại xe không được để trống.");
    return new ParkingTicket({
      id: idFromTime("PX"),
      studentId: student.id,
      vehicleType: safeVehicleType,
      plateNumber: requireText(plateNumber, "Biển số không được để trống."),
      zone: requireText(zone, "Bãi xe không được để trống."),
      status: "Chờ duyệt",
      validFrom: now.toISOString().slice(0, 10),
      validTo: validTo.toISOString().slice(0, 10),
      monthlyFee: safeVehicleType === "Xe đạp điện" ? 60000 : 80000,
    });
  }
}

export class AuthService {
  constructor(repository, sessionRepository) {
    this.repository = repository;
    this.sessionRepository = sessionRepository;
  }

  getCurrentUser() {
    const userId = this.sessionRepository.getCurrentUserId();
    if (!userId) return null;
    const record = this.repository.find("users", (user) => user.id === userId);
    return record ? new User(record) : null;
  }

  login({ username, password, role }) {
    const safeUsername = sanitizeText(username);
    const safePassword = sanitizeText(password);
    const safeRole = sanitizeText(role);
    const record = this.repository.find(
      "users",
      (user) => user.username === safeUsername && user.password === safePassword && user.role === safeRole,
    );

    if (!record) {
      throw new Error("Tài khoản, mật khẩu hoặc vai trò không đúng.");
    }

    this.sessionRepository.setCurrentUserId(record.id);
    return new User(record);
  }

  logout() {
    this.sessionRepository.clear();
  }
}

export class DormitoryService {
  constructor(repository) {
    this.repository = repository;
  }

  getStudents() {
    return this.repository.list("students").map((record) => new Student(record));
  }

  getRooms() {
    return this.repository.list("rooms").map((record) => new Room(record));
  }

  getFacilities() {
    return this.repository.list("facilities").map((record) => new Facility(record));
  }

  getRequests() {
    return this.repository.list("requests").map((record) => new SupportRequest(record));
  }

  getParkingTickets() {
    return this.repository.list("parkingTickets").map((record) => new ParkingTicket(record));
  }

  getStudentById(studentId) {
    return this.getStudents().find((student) => student.id === studentId);
  }

  getStudentForUser(user) {
    return user?.studentId ? this.getStudentById(user.studentId) : null;
  }

  getRoomById(roomId) {
    return this.getRooms().find((room) => room.id === roomId);
  }

  getRoomFacilities(roomId) {
    const room = this.getRoomById(roomId);
    if (!room) return [];
    const facilityMap = new Map(this.getFacilities().map((facility) => [facility.id, facility]));
    return room.facilityIds.map((id) => facilityMap.get(id)).filter(Boolean);
  }

  getRoommates(studentId) {
    const student = this.getStudentById(studentId);
    if (!student) return [];
    return this.getStudents().filter(
      (candidate) => candidate.roomId === student.roomId && candidate.id !== student.id,
    );
  }

  getRequestsForStudent(studentId) {
    return this.getRequests()
      .filter((request) => request.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getParkingForStudent(studentId) {
    return this.getParkingTickets().filter((ticket) => ticket.studentId === studentId);
  }

  normalizeStudentPayload(state, payload, currentStudentId = null) {
    const safePayload = sanitizePayload(payload);
    const room = findById(state.rooms, safePayload.roomId);
    if (!room) throw new Error("Phòng được chọn không tồn tại.");

    const code = requireText(safePayload.code, "Mã sinh viên không được để trống.");
    const email = requireText(safePayload.email, "Email không được để trống.");
    const duplicatedCode = state.students.some((student) => student.code === code && student.id !== currentStudentId);
    if (duplicatedCode) throw new Error("Mã sinh viên đã tồn tại.");
    const duplicatedEmail = state.students.some((student) => student.email === email && student.id !== currentStudentId);
    if (duplicatedEmail) throw new Error("Email sinh viên đã tồn tại.");

    const linkedUser = currentStudentId ? state.users.find((user) => user.studentId === currentStudentId) : null;
    const duplicatedUsername = state.users.some((user) => user.username === code && user.id !== linkedUser?.id);
    if (duplicatedUsername) throw new Error("Tên đăng nhập theo mã sinh viên đã tồn tại.");

    return {
      name: requireText(safePayload.name, "Họ tên không được để trống."),
      code,
      className: requireText(safePayload.className, "Lớp không được để trống."),
      birthDate: requireDate(safePayload.birthDate, "Ngày sinh không hợp lệ."),
      phone: requireText(safePayload.phone, "Số điện thoại không được để trống."),
      email,
      hometown: requireText(safePayload.hometown, "Quê quán không được để trống."),
      roomId: safePayload.roomId,
      checkInDate: requireDate(safePayload.checkInDate, "Ngày vào KTX không hợp lệ."),
      monthlyRent: requireNonNegative(safePayload.monthlyRent, "Tiền phòng không được âm."),
      utilityDebt: requireNonNegative(safePayload.utilityDebt, "Công nợ điện nước không được âm."),
      loginPassword: sanitizeText(safePayload.loginPassword),
    };
  }

  createStudent(payload) {
    return this.repository.mutate((state) => {
      const safePayload = this.normalizeStudentPayload(state, payload);
      const targetRoom = findById(state.rooms, safePayload.roomId);
      if (targetRoom.studentIds.length >= targetRoom.capacity) throw new Error("Phòng đã đủ sức chứa.");

      const student = new Student({
        id: idFromTime("SV"),
        name: safePayload.name,
        code: safePayload.code,
        className: safePayload.className,
        birthDate: safePayload.birthDate,
        phone: safePayload.phone,
        email: safePayload.email,
        hometown: safePayload.hometown,
        roomId: safePayload.roomId,
        checkInDate: safePayload.checkInDate,
        monthlyRent: safePayload.monthlyRent,
        utilityDebt: safePayload.utilityDebt,
      });
      state.students.push(student);
      targetRoom.studentIds.push(student.id);
      state.users.push({
        id: idFromTime("U"),
        username: student.code,
        password: safePayload.loginPassword || "123456",
        role: "student",
        studentId: student.id,
        name: student.name,
        email: student.email,
      });
      return student;
    });
  }

  updateStudent(studentId, payload) {
    return this.repository.mutate((state) => {
      const student = state.students.find((item) => item.id === studentId);
      if (!student) throw new Error("Không tìm thấy sinh viên.");
      const safePayload = this.normalizeStudentPayload(state, payload, studentId);
      const oldRoomId = student.roomId;
      const targetRoom = findById(state.rooms, safePayload.roomId);
      if (oldRoomId !== safePayload.roomId && targetRoom.studentIds.length >= targetRoom.capacity) {
        throw new Error("Phòng mới đã đủ sức chứa.");
      }

      Object.assign(student, {
        name: safePayload.name,
        code: safePayload.code,
        className: safePayload.className,
        birthDate: safePayload.birthDate,
        phone: safePayload.phone,
        email: safePayload.email,
        hometown: safePayload.hometown,
        roomId: safePayload.roomId,
        checkInDate: safePayload.checkInDate,
        monthlyRent: safePayload.monthlyRent,
        utilityDebt: safePayload.utilityDebt,
      });
      if (oldRoomId !== student.roomId) {
        const oldRoom = state.rooms.find((item) => item.id === oldRoomId);
        if (oldRoom) oldRoom.studentIds = oldRoom.studentIds.filter((id) => id !== student.id);
        if (!targetRoom.studentIds.includes(student.id)) targetRoom.studentIds.push(student.id);
      }
      const user = state.users.find((item) => item.studentId === student.id);
      if (user) {
        user.username = student.code;
        if (safePayload.loginPassword) user.password = safePayload.loginPassword;
        user.name = student.name;
        user.email = student.email;
      } else {
        state.users.push({
          id: idFromTime("U"),
          username: student.code,
          password: safePayload.loginPassword || "123456",
          role: "student",
          studentId: student.id,
          name: student.name,
          email: student.email,
        });
      }
      return new Student(student);
    });
  }

  normalizeRoomPayload(state, payload, currentRoomId = null) {
    const safePayload = sanitizePayload(payload);
    const name = requireText(safePayload.name, "Tên phòng không được để trống.");
    const duplicatedName = state.rooms.some((room) => room.name === name && room.id !== currentRoomId);
    if (duplicatedName) throw new Error("Tên phòng đã tồn tại.");
    const capacity = requirePositive(safePayload.capacity, "Sức chứa phòng phải lớn hơn 0.");
    const currentRoom = currentRoomId ? findById(state.rooms, currentRoomId) : null;
    if (currentRoom && capacity < currentRoom.studentIds.length) {
      throw new Error("Sức chứa không được nhỏ hơn số sinh viên đang ở.");
    }
    return {
      name,
      building: requireText(safePayload.building, "Tòa nhà không được để trống."),
      floor: requirePositive(safePayload.floor, "Tầng phải lớn hơn 0."),
      capacity,
      status: requireText(safePayload.status, "Trạng thái phòng không được để trống."),
      monthlyPrice: requireNonNegative(safePayload.monthlyPrice, "Giá phòng không được âm."),
      electricityKwh: requireNonNegative(safePayload.electricityKwh, "Chỉ số điện không được âm."),
      waterM3: requireNonNegative(safePayload.waterM3, "Chỉ số nước không được âm."),
    };
  }

  createRoom(payload) {
    return this.repository.mutate((state) => {
      const safePayload = this.normalizeRoomPayload(state, payload);
      const room = new Room({
        id: idFromTime("P"),
        ...safePayload,
        studentIds: [],
        facilityIds: [],
      });
      state.rooms.push(room);
      return room;
    });
  }

  updateRoom(roomId, payload) {
    return this.repository.mutate((state) => {
      const room = findById(state.rooms, roomId);
      if (!room) throw new Error("Không tìm thấy phòng.");
      Object.assign(room, this.normalizeRoomPayload(state, payload, roomId));
      return new Room(room);
    });
  }

  normalizeFacilityPayload(state, payload) {
    const safePayload = sanitizePayload(payload);
    if (!findById(state.rooms, safePayload.roomId)) throw new Error("Phòng gán cơ sở vật chất không tồn tại.");
    return {
      name: requireText(safePayload.name, "Tên thiết bị không được để trống."),
      quantity: requirePositive(safePayload.quantity, "Số lượng thiết bị phải lớn hơn 0."),
      condition: requireText(safePayload.condition, "Tình trạng thiết bị không được để trống."),
      roomId: safePayload.roomId,
    };
  }

  createFacility(payload) {
    return this.repository.mutate((state) => {
      const safePayload = this.normalizeFacilityPayload(state, payload);
      const facility = new Facility({
        id: idFromTime("F"),
        name: safePayload.name,
        quantity: safePayload.quantity,
        condition: safePayload.condition,
      });
      state.facilities.push(facility);
      const room = state.rooms.find((item) => item.id === safePayload.roomId);
      if (room && !room.facilityIds.includes(facility.id)) room.facilityIds.push(facility.id);
      return facility;
    });
  }

  updateFacility(facilityId, payload) {
    return this.repository.mutate((state) => {
      const safePayload = this.normalizeFacilityPayload(state, payload);
      const facility = state.facilities.find((item) => item.id === facilityId);
      if (!facility) throw new Error("Không tìm thấy cơ sở vật chất.");
      Object.assign(facility, {
        name: safePayload.name,
        quantity: safePayload.quantity,
        condition: safePayload.condition,
      });
      for (const room of state.rooms) {
        room.facilityIds = room.facilityIds.filter((id) => id !== facilityId);
      }
      const targetRoom = state.rooms.find((item) => item.id === safePayload.roomId);
      if (targetRoom) targetRoom.facilityIds.push(facilityId);
      return new Facility(facility);
    });
  }

  createSupportRequest(student, payload) {
    if (!student) throw new Error("Không tìm thấy hồ sơ sinh viên để tạo yêu cầu.");
    return this.repository.add("requests", RequestFactory.create({ student, ...payload }));
  }

  updateRequestStatus(requestId, status, reply = "") {
    const safeStatus = assertAllowed(status, REQUEST_STATUSES, "Trạng thái yêu cầu không hợp lệ.");
    return this.repository.update("requests", requestId, {
      status: safeStatus,
      reply: sanitizeText(reply),
      updatedAt: new Date().toISOString(),
    });
  }

  createParkingTicket(student, payload) {
    if (!student) throw new Error("Không tìm thấy hồ sơ sinh viên để đăng ký gửi xe.");
    return this.repository.add("parkingTickets", ParkingFactory.create({ student, ...payload }));
  }

  updateParkingStatus(ticketId, status) {
    const safeStatus = assertAllowed(status, PARKING_STATUSES, "Trạng thái gửi xe không hợp lệ.");
    return this.repository.update("parkingTickets", ticketId, { status: safeStatus });
  }

  getDashboardStats() {
    const rooms = this.getRooms();
    const students = this.getStudents();
    const requests = this.getRequests();
    const tickets = this.getParkingTickets();
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const usedSlots = rooms.reduce((sum, room) => sum + room.studentIds.length, 0);
    const pendingRequests = requests.filter((request) => request.status !== "Hoàn thành").length;
    const activeTickets = tickets.filter((ticket) => ticket.status === "Đang hiệu lực").length;

    return {
      students: students.length,
      rooms: rooms.length,
      occupancy: totalCapacity ? Math.round((usedSlots / totalCapacity) * 100) : 0,
      pendingRequests,
      activeTickets,
      emptySlots: totalCapacity - usedSlots,
    };
  }
}

export class ReportService {
  constructor(dormitoryService) {
    this.dormitoryService = dormitoryService;
  }

  getOperationalReport() {
    const requests = this.dormitoryService.getRequests();
    const rooms = this.dormitoryService.getRooms();
    const students = this.dormitoryService.getStudents();
    const tickets = this.dormitoryService.getParkingTickets();
    const requestByStatus = REQUEST_STATUSES.map((status) => ({
      status,
      count: requests.filter((request) => request.status === status).length,
    }));
    const roomRows = rooms.map((room) => ({
      name: room.name,
      building: room.building,
      capacity: room.capacity,
      used: room.studentIds.length,
      empty: room.emptySlots,
      status: room.status,
    }));
    const expectedMonthlyRevenue =
      students.reduce((sum, student) => sum + student.monthlyRent + student.utilityDebt, 0) +
      tickets.reduce((sum, ticket) => sum + ticket.monthlyFee, 0);

    return {
      requestByStatus,
      roomRows,
      expectedMonthlyRevenue,
      lateRequests: requests.filter((request) => request.isLate),
    };
  }
}
