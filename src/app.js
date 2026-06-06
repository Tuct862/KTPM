import { LocalStorageRepository, SessionRepository } from "./repository.js";
import { AuthService, DormitoryService, ReportService } from "./services.js";
import { AppView, managerViews, studentViews } from "./views.js";
import { assertManager, assertStudent, canAccessRoute, defaultRouteForRole } from "./security.js";

class DormitoryAppController {
  constructor(root) {
    this.repository = new LocalStorageRepository();
    this.sessionRepository = new SessionRepository();
    this.authService = new AuthService(this.repository, this.sessionRepository);
    this.dormitoryService = new DormitoryService(this.repository);
    this.reportService = new ReportService(this.dormitoryService);
    this.view = new AppView(root);
    this.route = "dashboard";
    this.errorMessage = "";
    this.operationMessage = "";
    this.editing = null;
  }

  init() {
    this.repository.ensureSeed();
    this.bindEvents();
    this.render();
  }

  runAction(action) {
    try {
      action();
      this.operationMessage = "";
    } catch (error) {
      this.operationMessage = error.message;
    }
    this.render();
  }

  bindEvents() {
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("form");
      if (!form) return;
      event.preventDefault();

      if (form.dataset.form === "login") this.handleLogin(form);
      if (form.dataset.form === "support") this.runAction(() => this.handleSupportRequest(form));
      if (form.dataset.form === "parking") this.runAction(() => this.handleParkingRequest(form));
      if (form.dataset.form === "student") this.runAction(() => this.handleStudentSave(form));
      if (form.dataset.form === "room") this.runAction(() => this.handleRoomSave(form));
      if (form.dataset.form === "facility") this.runAction(() => this.handleFacilitySave(form));
    });

    document.addEventListener("click", (event) => {
      const routeButton = event.target.closest("[data-route]");
      const actionButton = event.target.closest("[data-action]");

      if (routeButton) {
        this.runAction(() => this.navigate(routeButton.dataset.route));
      }

      if (actionButton?.dataset.action === "logout") {
        this.authService.logout();
        this.route = "dashboard";
        this.operationMessage = "";
        this.editing = null;
        this.render();
      }

      if (actionButton?.dataset.action === "reset-demo") {
        this.repository.reset();
        this.route = "dashboard";
        this.errorMessage = "";
        this.operationMessage = "";
        this.editing = null;
        this.render();
      }

      if (actionButton?.dataset.action === "edit-student") {
        this.runAction(() => {
          assertManager(this.authService.getCurrentUser());
          this.editing = { type: "student", id: actionButton.dataset.id };
        });
      }

      if (actionButton?.dataset.action === "edit-room") {
        this.runAction(() => {
          assertManager(this.authService.getCurrentUser());
          this.editing = { type: "room", id: actionButton.dataset.id };
        });
      }

      if (actionButton?.dataset.action === "edit-facility") {
        this.runAction(() => {
          assertManager(this.authService.getCurrentUser());
          this.editing = { type: "facility", id: actionButton.dataset.id };
        });
      }

      if (actionButton?.dataset.action === "cancel-edit") {
        this.editing = null;
        this.operationMessage = "";
        this.render();
      }
    });

    document.addEventListener("change", (event) => {
      const target = event.target;
      if (target.dataset.action === "request-status") {
        this.runAction(() => {
          assertManager(this.authService.getCurrentUser());
          this.dormitoryService.updateRequestStatus(target.dataset.id, target.value);
        });
      }

      if (target.dataset.action === "parking-status") {
        this.runAction(() => {
          assertManager(this.authService.getCurrentUser());
          this.dormitoryService.updateParkingStatus(target.dataset.id, target.value);
        });
      }
    });
  }

  navigate(route) {
    const user = this.authService.getCurrentUser();
    if (!canAccessRoute(user, route)) {
      this.route = defaultRouteForRole(user?.role);
      this.editing = null;
      throw new Error("Bạn không có quyền truy cập chức năng này.");
    }
    this.route = route;
    this.editing = null;
  }

  handleLogin(form) {
    const formData = new FormData(form);
    try {
      const user = this.authService.login({
        role: formData.get("role"),
        username: formData.get("username")?.trim(),
        password: formData.get("password")?.trim(),
      });
      this.errorMessage = "";
      this.operationMessage = "";
      this.route = user.isManager() ? "dashboard" : "profile";
    } catch (error) {
      this.errorMessage = error.message;
    }

    this.render();
  }

  handleSupportRequest(form) {
    const user = this.authService.getCurrentUser();
    assertStudent(user);
    const student = this.dormitoryService.getStudentForUser(user);
    const formData = new FormData(form);
    this.dormitoryService.createSupportRequest(student, {
      type: formData.get("type"),
      content: formData.get("content")?.trim(),
    });
    form.reset();
  }

  handleParkingRequest(form) {
    const user = this.authService.getCurrentUser();
    assertStudent(user);
    const student = this.dormitoryService.getStudentForUser(user);
    const formData = new FormData(form);
    this.dormitoryService.createParkingTicket(student, {
      vehicleType: formData.get("vehicleType"),
      plateNumber: formData.get("plateNumber")?.trim(),
      zone: formData.get("zone"),
    });
    form.reset();
  }

  handleStudentSave(form) {
    assertManager(this.authService.getCurrentUser());
    const payload = this.readForm(form);
    if (payload.id) {
      this.dormitoryService.updateStudent(payload.id, payload);
    } else {
      this.dormitoryService.createStudent(payload);
    }
    this.editing = null;
    form.reset();
  }

  handleRoomSave(form) {
    assertManager(this.authService.getCurrentUser());
    const payload = this.readForm(form);
    if (payload.id) {
      this.dormitoryService.updateRoom(payload.id, payload);
    } else {
      this.dormitoryService.createRoom(payload);
    }
    this.editing = null;
    form.reset();
  }

  handleFacilitySave(form) {
    assertManager(this.authService.getCurrentUser());
    const payload = this.readForm(form);
    if (payload.id) {
      this.dormitoryService.updateFacility(payload.id, payload);
    } else {
      this.dormitoryService.createFacility(payload);
    }
    this.editing = null;
    form.reset();
  }

  readForm(form) {
    return Object.fromEntries(
      [...new FormData(form).entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
    );
  }

  render() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.view.renderLogin(this.errorMessage);
      return;
    }

    if (!canAccessRoute(user, this.route)) {
      this.route = defaultRouteForRole(user.role);
    }

    if (user.isManager()) {
      this.renderManager(user);
      return;
    }

    this.renderStudent(user);
  }

  renderManager(user) {
    const rooms = this.dormitoryService.getRooms();
    const students = this.dormitoryService.getStudents();
    const requests = this.dormitoryService.getRequests();
    const tickets = this.dormitoryService.getParkingTickets();
    const facilitiesByRoom = new Map(rooms.map((room) => [room.id, this.dormitoryService.getRoomFacilities(room.id)]));
    const bodyByRoute = {
      dashboard: () =>
        managerViews.dashboard({
          stats: this.dormitoryService.getDashboardStats(),
          requests,
          rooms,
        }),
      rooms: () =>
        managerViews.rooms({
          rooms,
          students,
          facilities: this.dormitoryService.getFacilities(),
          facilitiesByRoom,
          editing: this.editing,
        }),
      students: () => managerViews.students({ students, rooms, editing: this.editing }),
      requests: () => managerViews.requests({ requests, students }),
      parking: () => managerViews.parking({ tickets, students }),
      reports: () => managerViews.reports({ report: this.reportService.getOperationalReport() }),
    };

    const route = bodyByRoute[this.route] ? this.route : "dashboard";
    this.route = route;
    this.view.renderShell({ user, route, body: bodyByRoute[route](), operationMessage: this.operationMessage });
  }

  renderStudent(user) {
    const student = this.dormitoryService.getStudentForUser(user);
    const room = this.dormitoryService.getRoomById(student.roomId);
    const tickets = this.dormitoryService.getParkingForStudent(student.id);
    const bodyByRoute = {
      profile: () => studentViews.profile({ student, room, tickets }),
      room: () =>
        studentViews.room({
          student,
          room,
          roommates: this.dormitoryService.getRoommates(student.id),
          facilities: this.dormitoryService.getRoomFacilities(room.id),
        }),
      "student-parking": () => studentViews.parking({ tickets }),
      support: () => studentViews.support({ requests: this.dormitoryService.getRequestsForStudent(student.id) }),
    };

    const route = bodyByRoute[this.route] ? this.route : "profile";
    this.route = route;
    this.view.renderShell({ user, route, body: bodyByRoute[route](), operationMessage: this.operationMessage });
  }
}

const app = new DormitoryAppController(document.querySelector("#app"));
app.init();
