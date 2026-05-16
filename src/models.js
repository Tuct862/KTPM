export class User {
  constructor(record) {
    Object.assign(this, record);
  }

  isManager() {
    return this.role === "manager";
  }
}

export class Student {
  constructor(record) {
    Object.assign(this, record);
  }

  get displayCode() {
    return `${this.code} - ${this.name}`;
  }
}

export class Room {
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
  constructor(record) {
    Object.assign(this, record);
  }
}

export class SupportRequest {
  constructor(record) {
    Object.assign(this, record);
  }

  get isLate() {
    return new Date(this.dueAt).getTime() < Date.now() && this.status !== "Hoàn thành";
  }
}

export class ParkingTicket {
  constructor(record) {
    Object.assign(this, record);
  }
}
