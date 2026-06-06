import { seedData, SESSION_KEY, STORAGE_KEY } from "./data.js";
import { assertKnownCollection, assertPrimaryKey, collectionNames } from "./schema.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

const normalizeState = (state) => {
  const normalized = { ...state };
  for (const collectionName of collectionNames) {
    normalized[collectionName] = Array.isArray(normalized[collectionName]) ? normalized[collectionName] : [];
  }
  return normalized;
};

export class LocalStorageRepository {
  constructor(storage = window.localStorage) {
    this.storage = storage;
  }

  ensureSeed() {
    if (!this.storage.getItem(STORAGE_KEY)) {
      this.writeState(seedData);
      return;
    }

    this.migrateDemoAccounts();
  }

  migrateDemoAccounts() {
    const state = normalizeState(JSON.parse(this.storage.getItem(STORAGE_KEY)));
    const existingUsernames = new Set(state.users.map((user) => user.username));
    const missingUsers = seedData.users.filter((user) => !existingUsernames.has(user.username));

    if (!missingUsers.length) return;

    state.users = [...state.users, ...missingUsers];
    this.writeState(state);
  }

  reset() {
    this.writeState(seedData);
    window.sessionStorage.removeItem(SESSION_KEY);
  }

  readState() {
    this.ensureSeed();
    return normalizeState(JSON.parse(this.storage.getItem(STORAGE_KEY)));
  }

  writeState(state) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(clone(normalizeState(state))));
  }

  assertCollection(collectionName) {
    assertKnownCollection(collectionName);
  }

  list(collectionName) {
    this.assertCollection(collectionName);
    return this.readState()[collectionName] ?? [];
  }

  find(collectionName, predicate) {
    return this.list(collectionName).find(predicate);
  }

  exists(collectionName, predicate) {
    return Boolean(this.find(collectionName, predicate));
  }

  assertUnique(collectionName, fieldName, value, excludeId = null) {
    this.assertCollection(collectionName);
    const duplicated = this.list(collectionName).some(
      (record) => record[fieldName] === value && (!excludeId || record.id !== excludeId),
    );
    if (duplicated) throw new Error(`${fieldName} đã tồn tại trong ${collectionName}.`);
  }

  add(collectionName, record) {
    this.assertCollection(collectionName);
    assertPrimaryKey(collectionName, record);
    const state = this.readState();
    state[collectionName] = [...state[collectionName], record];
    this.writeState(state);
    return record;
  }

  update(collectionName, id, patch) {
    this.assertCollection(collectionName);
    const state = this.readState();
    const exists = state[collectionName].some((record) => record.id === id);
    if (!exists) throw new Error(`Không tìm thấy bản ghi ${id} trong ${collectionName}.`);
    state[collectionName] = state[collectionName].map((record) =>
      record.id === id ? { ...record, ...patch } : record,
    );
    this.writeState(state);
    return state[collectionName].find((record) => record.id === id);
  }

  mutate(mutator) {
    const state = this.readState();
    const result = mutator(state);
    this.writeState(state);
    return result;
  }
}

export class SessionRepository {
  constructor(storage = window.sessionStorage) {
    this.storage = storage;
  }

  getCurrentUserId() {
    return this.storage.getItem(SESSION_KEY);
  }

  setCurrentUserId(userId) {
    this.storage.setItem(SESSION_KEY, userId);
  }

  clear() {
    this.storage.removeItem(SESSION_KEY);
  }
}
