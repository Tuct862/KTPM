export class User {
  static entityName = "User";
  static collectionName = "users";

  constructor(record) {
    Object.assign(this, record);
  }

  isManager() {
    return this.role === "manager";
  }
}

export class Student {
  static entityName = "Student";
  static collectionName = "students";

  constructor(record) {
    Object.assign(this, record);
  }

  get displayCode() {
    return `${this.code} - ${this.name}`;
  }
}

export class Room {
  static entityName = "Room";
  static collectionName = "rooms";

  constructor(record) {
    Object.assign(this, record);
  }

  get occupancyRate() {
    return Math.round((this.studentIds.length / this.capacity) * 100);
  }

  get emptySlots() {
    return Math.max(this.capacity - this.studentIds.length, 0);
  }
}

export class Facility {
  static entityName = "Facility";
  static collectionName = "facilities";

  constructor(record) {
    Object.assign(this, record);
  }
}

export class SupportRequest {
  static entityName = "SupportRequest";
  static collectionName = "requests";

  constructor(record) {
    Object.assign(this, record);
  }

  get isLate() {
    return new Date(this.dueAt).getTime() < Date.now() && this.status !== "Hoàn thành";
  }
}

export class ParkingTicket {
  static entityName = "ParkingTicket";
  static collectionName = "parkingTickets";

  constructor(record) {
    Object.assign(this, record);
  }
}
