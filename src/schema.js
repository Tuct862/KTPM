export const COLLECTION_SCHEMAS = {
  users: {
    tableName: "users",
    primaryKey: "id",
    unique: ["username"],
    fields: {
      id: { type: "string", required: true, sqlType: "VARCHAR(20)", note: "Khóa chính tài khoản." },
      username: { type: "string", required: true, sqlType: "VARCHAR(50)", note: "Tên đăng nhập, không trùng." },
      password: { type: "string", required: true, sqlType: "VARCHAR(255)", note: "Demo dùng plaintext; production phải dùng password_hash." },
      role: { type: "enum", required: true, values: ["manager", "student"], sqlType: "VARCHAR(20)", note: "Vai trò phân quyền." },
      studentId: { type: "string", required: false, references: "students.id", sqlType: "VARCHAR(20)", note: "Chỉ có với tài khoản sinh viên." },
      name: { type: "string", required: true, sqlType: "NVARCHAR(100)" },
      email: { type: "string", required: true, sqlType: "VARCHAR(120)" },
    },
  },
  students: {
    tableName: "students",
    primaryKey: "id",
    unique: ["code", "email"],
    fields: {
      id: { type: "string", required: true, sqlType: "VARCHAR(20)", note: "Khóa chính sinh viên." },
      code: { type: "string", required: true, sqlType: "VARCHAR(30)", note: "Mã sinh viên, không trùng." },
      name: { type: "string", required: true, sqlType: "NVARCHAR(100)" },
      className: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
      birthDate: { type: "date", required: true, sqlType: "DATE" },
      phone: { type: "string", required: true, sqlType: "VARCHAR(20)" },
      email: { type: "string", required: true, sqlType: "VARCHAR(120)" },
      hometown: { type: "string", required: true, sqlType: "NVARCHAR(100)" },
      roomId: { type: "string", required: true, references: "rooms.id", sqlType: "VARCHAR(20)" },
      checkInDate: { type: "date", required: true, sqlType: "DATE" },
      monthlyRent: { type: "number", required: true, min: 0, sqlType: "DECIMAL(12,2)" },
      utilityDebt: { type: "number", required: true, min: 0, sqlType: "DECIMAL(12,2)" },
    },
  },
  rooms: {
    tableName: "rooms",
    primaryKey: "id",
    unique: ["name"],
    fields: {
      id: { type: "string", required: true, sqlType: "VARCHAR(20)" },
      name: { type: "string", required: true, sqlType: "VARCHAR(20)", note: "Tên phòng, không trùng." },
      building: { type: "string", required: true, sqlType: "VARCHAR(20)" },
      floor: { type: "number", required: true, min: 1, sqlType: "INT" },
      capacity: { type: "number", required: true, min: 1, sqlType: "INT" },
      status: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
      monthlyPrice: { type: "number", required: true, min: 0, sqlType: "DECIMAL(12,2)" },
      studentIds: { type: "array", required: true, references: "students.id", note: "Dữ liệu dẫn xuất cho demo localStorage; SQL nên lấy từ students.room_id." },
      facilityIds: { type: "array", required: true, references: "facilities.id", note: "Demo lưu mảng ID; SQL nên tách room_facilities." },
      electricityKwh: { type: "number", required: true, min: 0, sqlType: "DECIMAL(10,2)" },
      waterM3: { type: "number", required: true, min: 0, sqlType: "DECIMAL(10,2)" },
    },
  },
  facilities: {
    tableName: "facilities",
    primaryKey: "id",
    fields: {
      id: { type: "string", required: true, sqlType: "VARCHAR(20)" },
      name: { type: "string", required: true, sqlType: "NVARCHAR(100)" },
      quantity: { type: "number", required: true, min: 1, sqlType: "INT" },
      condition: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
    },
  },
  requests: {
    tableName: "support_requests",
    primaryKey: "id",
    fields: {
      id: { type: "string", required: true, sqlType: "VARCHAR(30)" },
      studentId: { type: "string", required: true, references: "students.id", sqlType: "VARCHAR(20)" },
      roomId: { type: "string", required: true, references: "rooms.id", sqlType: "VARCHAR(20)" },
      type: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
      content: { type: "string", required: true, sqlType: "NVARCHAR(1000)" },
      status: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
      createdAt: { type: "datetime", required: true, sqlType: "DATETIME" },
      updatedAt: { type: "datetime", required: true, sqlType: "DATETIME" },
      dueAt: { type: "datetime", required: true, sqlType: "DATETIME" },
      reply: { type: "string", required: false, sqlType: "NVARCHAR(1000)" },
    },
  },
  parkingTickets: {
    tableName: "parking_tickets",
    primaryKey: "id",
    fields: {
      id: { type: "string", required: true, sqlType: "VARCHAR(30)" },
      studentId: { type: "string", required: true, references: "students.id", sqlType: "VARCHAR(20)" },
      vehicleType: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
      plateNumber: { type: "string", required: true, sqlType: "VARCHAR(30)" },
      zone: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
      status: { type: "string", required: true, sqlType: "NVARCHAR(50)" },
      validFrom: { type: "date", required: true, sqlType: "DATE" },
      validTo: { type: "date", required: true, sqlType: "DATE" },
      monthlyFee: { type: "number", required: true, min: 0, sqlType: "DECIMAL(12,2)" },
    },
  },
};

export const DATA_RELATIONSHIPS = [
  { from: "users.studentId", to: "students.id", type: "0..1" },
  { from: "students.roomId", to: "rooms.id", type: "N..1" },
  { from: "requests.studentId", to: "students.id", type: "N..1" },
  { from: "requests.roomId", to: "rooms.id", type: "N..1" },
  { from: "parkingTickets.studentId", to: "students.id", type: "N..1" },
  { from: "rooms.facilityIds", to: "facilities.id", type: "N..N demo" },
];

export const NORMALIZATION_NOTES = [
  "rooms.studentIds được giữ để render nhanh trong bản demo localStorage; khi dùng SQL nên suy ra từ students.room_id.",
  "rooms.facilityIds mô phỏng quan hệ nhiều-nhiều; khi dùng SQL nên tách bảng room_facilities(room_id, facility_id).",
  "users.password chỉ dùng cho demo frontend; production phải đổi thành password_hash ở backend.",
];

export const collectionNames = Object.freeze(Object.keys(COLLECTION_SCHEMAS));

export const getCollectionSchema = (collectionName) => COLLECTION_SCHEMAS[collectionName];

export const assertKnownCollection = (collectionName) => {
  if (!getCollectionSchema(collectionName)) {
    throw new Error(`Collection không tồn tại trong schema: ${collectionName}`);
  }
};

export const assertPrimaryKey = (collectionName, record) => {
  const schema = getCollectionSchema(collectionName);
  const primaryKey = schema?.primaryKey ?? "id";
  if (!record?.[primaryKey]) {
    throw new Error(`Bản ghi ${collectionName} thiếu khóa chính ${primaryKey}.`);
  }
};
