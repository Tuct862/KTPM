import { seedData, SESSION_KEY, STORAGE_KEY } from "./data.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

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
    const state = JSON.parse(this.storage.getItem(STORAGE_KEY));
    const existingUsernames = new Set((state.users ?? []).map((user) => user.username));
    const missingUsers = seedData.users.filter((user) => !existingUsernames.has(user.username));

    if (!missingUsers.length) return;

    state.users = [...(state.users ?? []), ...missingUsers];
    this.writeState(state);
  }

  reset() {
    this.writeState(seedData);
    window.sessionStorage.removeItem(SESSION_KEY);
  }

  readState() {
    this.ensureSeed();
    return JSON.parse(this.storage.getItem(STORAGE_KEY));
  }

  writeState(state) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(clone(state)));
  }

  list(collectionName) {
    return this.readState()[collectionName] ?? [];
  }

  find(collectionName, predicate) {
    return this.list(collectionName).find(predicate);
  }

  add(collectionName, record) {
    const state = this.readState();
    state[collectionName] = [...state[collectionName], record];
    this.writeState(state);
    return record;
  }

  update(collectionName, id, patch) {
    const state = this.readState();
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
