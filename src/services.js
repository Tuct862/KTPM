import { PARKING_STATUSES, REQUEST_STATUSES } from "./data.js";
import { Facility, ParkingTicket, Room, Student, SupportRequest, User } from "./models.js";

const idFromTime = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;
const numberOrZero = (value) => Number(value) || 0;
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export class RequestFactory {
  static create({ student, type, content }) {
    const now = new Date();
    return new SupportRequest({
      id: idFromTime("REQ"),
      studentId: student.id,
      roomId: student.roomId,
      type,
      content,
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
    return new ParkingTicket({
      id: idFromTime("PX"),
      studentId: student.id,
      vehicleType,
      plateNumber,
      zone,
      status: "Chờ duyệt",
      validFrom: now.toISOString().slice(0, 10),
      validTo: validTo.toISOString().slice(0, 10),
      monthlyFee: vehicleType === "Xe đạp điện" ? 60000 : 80000,
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
    const record = this.repository.find(
      "users",
      (user) => user.username === username && user.password === password && user.role === role,
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

  createStudent(payload) {
    return this.repository.mutate((state) => {
      const student = new Student({
        id: idFromTime("SV"),
        name: payload.name,
        code: payload.code,
        className: payload.className,
        birthDate: payload.birthDate,
        phone: payload.phone,
        email: payload.email,
        hometown: payload.hometown,
        roomId: payload.roomId,
        checkInDate: payload.checkInDate,
        monthlyRent: numberOrZero(payload.monthlyRent),
        utilityDebt: numberOrZero(payload.utilityDebt),
      });
      state.students.push(student);
      const room = state.rooms.find((item) => item.id === student.roomId);
      if (room && !room.studentIds.includes(student.id)) room.studentIds.push(student.id);
      state.users.push({
        id: idFromTime("U"),
        username: student.code,
        password: payload.loginPassword || "123456",
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
      const oldRoomId = student.roomId;
      Object.assign(student, {
        name: payload.name,
        code: payload.code,
        className: payload.className,
        birthDate: payload.birthDate,
        phone: payload.phone,
        email: payload.email,
        hometown: payload.hometown,
        roomId: payload.roomId,
        checkInDate: payload.checkInDate,
        monthlyRent: numberOrZero(payload.monthlyRent),
        utilityDebt: numberOrZero(payload.utilityDebt),
      });
      if (oldRoomId !== student.roomId) {
        const oldRoom = state.rooms.find((item) => item.id === oldRoomId);
        const newRoom = state.rooms.find((item) => item.id === student.roomId);
        if (oldRoom) oldRoom.studentIds = oldRoom.studentIds.filter((id) => id !== student.id);
        if (newRoom && !newRoom.studentIds.includes(student.id)) newRoom.studentIds.push(student.id);
      }
      const user = state.users.find((item) => item.studentId === student.id);
      if (user) {
        user.username = student.code;
        if (payload.loginPassword) user.password = payload.loginPassword;
        user.name = student.name;
        user.email = student.email;
      } else {
        state.users.push({
          id: idFromTime("U"),
          username: student.code,
          password: payload.loginPassword || "123456",
          role: "student",
          studentId: student.id,
          name: student.name,
          email: student.email,
        });
      }
      return new Student(student);
    });
  }

  createRoom(payload) {
    return this.repository.add(
      "rooms",
      new Room({
        id: idFromTime("P"),
        name: payload.name,
        building: payload.building,
        floor: numberOrZero(payload.floor),
        capacity: numberOrZero(payload.capacity),
        status: payload.status,
        monthlyPrice: numberOrZero(payload.monthlyPrice),
        studentIds: [],
        facilityIds: [],
        electricityKwh: numberOrZero(payload.electricityKwh),
        waterM3: numberOrZero(payload.waterM3),
      }),
    );
  }

  updateRoom(roomId, payload) {
    return this.repository.update("rooms", roomId, {
      name: payload.name,
      building: payload.building,
      floor: numberOrZero(payload.floor),
      capacity: numberOrZero(payload.capacity),
      status: payload.status,
      monthlyPrice: numberOrZero(payload.monthlyPrice),
      electricityKwh: numberOrZero(payload.electricityKwh),
      waterM3: numberOrZero(payload.waterM3),
    });
  }

  createFacility(payload) {
    return this.repository.mutate((state) => {
      const facility = new Facility({
        id: idFromTime("F"),
        name: payload.name,
        quantity: numberOrZero(payload.quantity),
        condition: payload.condition,
      });
      state.facilities.push(facility);
      const room = state.rooms.find((item) => item.id === payload.roomId);
      if (room && !room.facilityIds.includes(facility.id)) room.facilityIds.push(facility.id);
      return facility;
    });
  }

  updateFacility(facilityId, payload) {
    return this.repository.mutate((state) => {
      const facility = state.facilities.find((item) => item.id === facilityId);
      if (!facility) throw new Error("Không tìm thấy cơ sở vật chất.");
      Object.assign(facility, {
        name: payload.name,
        quantity: numberOrZero(payload.quantity),
        condition: payload.condition,
      });
      for (const room of state.rooms) {
        room.facilityIds = room.facilityIds.filter((id) => id !== facilityId);
      }
      const targetRoom = state.rooms.find((item) => item.id === payload.roomId);
      if (targetRoom) targetRoom.facilityIds.push(facilityId);
      return new Facility(facility);
    });
  }

  createSupportRequest(student, payload) {
    return this.repository.add("requests", RequestFactory.create({ student, ...payload }));
  }

  updateRequestStatus(requestId, status, reply = "") {
    if (!REQUEST_STATUSES.includes(status)) {
      throw new Error("Trạng thái yêu cầu không hợp lệ.");
    }

    return this.repository.update("requests", requestId, {
      status,
      reply,
      updatedAt: new Date().toISOString(),
    });
  }

  createParkingTicket(student, payload) {
    return this.repository.add("parkingTickets", ParkingFactory.create({ student, ...payload }));
  }

  updateParkingStatus(ticketId, status) {
    if (!PARKING_STATUSES.includes(status)) {
      throw new Error("Trạng thái gửi xe không hợp lệ.");
    }

    return this.repository.update("parkingTickets", ticketId, { status });
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
