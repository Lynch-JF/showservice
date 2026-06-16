// ======================
// API SheetBest — TICKETS
// ======================
const API_URL = "https://api.sheetbest.com/sheets/a50a59f4-402a-4937-a0fc-e20789380908";

// ======================
// API SheetBest — USUARIOS
// ======================
const USERS_SHEET_API = "https://api.sheetbest.com/sheets/6784d1e5-1e26-4605-9c19-329eb2b6ea12";

// ======================
// CLOUDINARY CONFIG
// ======================
const CLOUDINARY_CLOUD_NAME    = "dy50psi1g";
const CLOUDINARY_UPLOAD_PRESET = "tickets_preset";

// ======================
// CACHÉ DE USUARIOS
// ======================
const CACHE_KEY    = "tickets_users_cache";
const CACHE_TS_KEY = "tickets_users_cache_ts";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

// Rutas por rol
const ROUTES = {
  tecnico:    "Asistencia.html",
  admin:      "Admin.html",
  usuario:    "Dashboard.html",
  superadmin: "SuperUsuario.html",
    analista:   "analista.html"


};

// Nombres completos de técnicos (fuente única de verdad)
const NOMBRES_COMPLETOS_TECNICOS = {
  "Juan":   "Juan Francisco Jiménez",
  "Joel":   "Joel Holguin",
  "Yanna":  "Yanna Martínez",
  "Xavier": "Xavier Rosario"
};

const ANALISTAS_TESORERIA = {
  eliana:  "Eliana Asuncion Payano Jimenez (Supervisora)",
  chantal: "Chantal Sosa Rosario",
  yanela:  "Yanela Almonte"
};

const TECNICOS_DISPONIBLES = ["Sin asignar", "Juan", "Joel", "Yanna", "Xavier"];

// ======================
// SHA-256 (Web Crypto API)
// ======================
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ======================
// CACHÉ — helpers
// ======================
function getCachedUsers() {
  try {
    const ts = parseInt(localStorage.getItem(CACHE_TS_KEY) || "0", 10);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUsers(users) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(users));
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
  } catch (e) {
    console.warn("No se pudo guardar caché:", e);
  }
}

async function fetchUsersFromSheet() {
  const res = await fetch(USERS_SHEET_API);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const users = Array.isArray(data) ? data : [];
  setCachedUsers(users);
  return users;
}

// ======================
// LOGIN — con protección anti-doble clic
// ======================
let _loginInProgress = false;

async function login() {
  if (_loginInProgress) return;

  const userEl   = document.getElementById("username") || document.getElementById("usuario");
  const passEl   = document.getElementById("password") || document.getElementById("contrasena");
  const errorEl  = document.getElementById("login-error");
  const btnLogin = document.getElementById("btn-login") || document.querySelector(".btn-ingresar");

  const userInput = userEl ? userEl.value.trim() : "";
  const passInput = passEl ? passEl.value : "";

  // Limpiar error previo
  if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }

  if (!userInput || !passInput) {
    _setLoginError(errorEl, "Completa usuario y contraseña.");
    return;
  }

  _loginInProgress = true;
  if (btnLogin) { btnLogin.disabled = true; btnLogin.textContent = "Verificando..."; }

  try {
    const hashIngresado = await sha256(passInput);

    let users     = getCachedUsers();
    let usedCache = !!users;
    if (!users) users = await fetchUsersFromSheet();

    let encontrado = _findUser(users, userInput, hashIngresado);

    // Si no encontrado en caché, refrescar una vez
    if (!encontrado && usedCache) {
      console.log("[Auth] No encontrado en caché, refrescando...");
      users      = await fetchUsersFromSheet();
      encontrado = _findUser(users, userInput, hashIngresado);
    }

    if (encontrado) {
      _guardarSesion(encontrado);
      window.location.href = ROUTES[localStorage.getItem("rol")] || "Dashboard.html";
    } else {
      _setLoginError(errorEl, "Usuario o contraseña incorrectos.");
    }

  } catch (err) {
    console.error("[Auth] Error en login:", err);

    // Fallback: caché de emergencia
    const emergencia = getCachedUsers();
    if (emergencia) {
      console.warn("[Auth] Sin red — usando caché de emergencia");
      try {
        const hashIngresado = await sha256(passInput);
        const encontrado    = _findUser(emergencia, userInput, hashIngresado);
        if (encontrado) {
          _guardarSesion(encontrado);
          window.location.href = ROUTES[localStorage.getItem("rol")] || "Dashboard.html";
          return;
        }
      } catch { /* ignorar */ }
    }

    _setLoginError(errorEl, "Error de conexión. Inténtalo de nuevo.");

  } finally {
    _loginInProgress = false;
    if (btnLogin) { btnLogin.disabled = false; btnLogin.textContent = "Ingresar"; }
  }
}

// ─── Helpers internos de login ───
function _findUser(users, username, hash) {
  return users.find(u =>
    (u.NombreUsuario || "").toLowerCase() === username.toLowerCase() &&
    (u.Contraseña    || "") === hash
  ) || null;
}

function _guardarSesion(usuario) {
  let rol = usuario.Rol;
  if ((usuario.NombreUsuario || "").toLowerCase() === "juan") rol = "superadmin";
  localStorage.setItem("usuario",        usuario.NombreUsuario);
  localStorage.setItem("rol",            rol);
  localStorage.setItem("depto",          usuario.Departamento   || "");
  localStorage.setItem("nombreCompleto", usuario.NombreCompleto || usuario.NombreUsuario);
}

function _setLoginError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  // Shake animation si existe la clase
  el.classList.remove("shake");
  void el.offsetWidth; // reflow
  el.classList.add("shake");
}

// ======================
// LOGOUT
// ======================
function logout() {
  ["usuario", "rol", "depto", "nombreCompleto"].forEach(k => localStorage.removeItem(k));
  window.location.href = "index.html";
}

// ======================
// PROTECCIÓN DE PÁGINAS
// ======================
function protegerPagina(rolRequerido) {
  if (localStorage.getItem("rol") !== rolRequerido) window.location.href = "index.html";
}

function protegerPaginaRoles(...rolesPermitidos) {
  if (!rolesPermitidos.includes(localStorage.getItem("rol"))) window.location.href = "index.html";
}

// ======================
// ENTER en campos de login
// ======================
document.addEventListener("DOMContentLoaded", () => {
  ["password", "contrasena", "username", "usuario"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("keydown", e => { if (e.key === "Enter") login(); });
  });
});

// ======================
// ESTADO DE ARCHIVOS
// ======================
let archivosSeleccionados = [];
let archivosSubidos       = [];

// ======================
// GENERAR ID
// ======================
function generarID() {
  return "TK-" + Date.now().toString().slice(-6);
}

// ======================
// ARCHIVOS — helpers UI
// ======================
const FILE_ICONS = {
  pdf: "📄", doc: "📝", docx: "📝",
  xls: "📊", xlsx: "📊",
  zip: "🗜️", rar: "🗜️",
  txt: "📃",
  png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", webp: "🖼️", svg: "🖼️",
  mp4: "🎬", mov: "🎬", avi: "🎬",
};

function getFileIcon(ext) {
  return FILE_ICONS[ext.toLowerCase()] || "📁";
}

function agregarArchivos(lista) {
  [...lista].forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      alert(`"${file.name}" supera los 10 MB y no será agregado.`);
      return;
    }
    if (!archivosSeleccionados.find(a => a.nombre === file.name)) {
      archivosSeleccionados.push({ file, nombre: file.name, tamano: file.size });
    }
  });
  renderPreview();
}

function eliminarArchivo(idx) {
  archivosSeleccionados.splice(idx, 1);
  renderPreview();
}

function renderPreview() {
  const lista = document.getElementById("filePreviewList");
  if (!lista) return;
  lista.innerHTML = "";

  archivosSeleccionados.forEach((a, idx) => {
    const ext  = a.nombre.split(".").pop().toLowerCase();
    const icon = getFileIcon(ext);
    const kb   = a.tamano < 1024 * 1024
      ? (a.tamano / 1024).toFixed(1) + " KB"
      : (a.tamano / 1024 / 1024).toFixed(1) + " MB";

    const item = document.createElement("div");
    item.className = "file-preview-item";
    item.innerHTML = `
      <span class="file-icon">${icon}</span>
      <div class="file-info">
        <div class="file-name">${a.nombre}</div>
        <div class="file-size">${kb}</div>
      </div>
      <button class="file-remove" onclick="eliminarArchivo(${idx})" title="Quitar">✕</button>
    `;
    lista.appendChild(item);
  });
}

// ======================
// SUBIDA A CLOUDINARY
// ======================
const IMAGE_EXTS = new Set(["png","jpg","jpeg","gif","webp","svg","bmp"]);
const VIDEO_EXTS = new Set(["mp4","mov","avi","mkv"]);

function getResourceType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  return "raw";
}

async function subirArchivosACloudinary() {
  if (!archivosSeleccionados.length) return [];

  const progressBar  = document.getElementById("uploadProgressBar");
  const progressFill = document.getElementById("uploadProgressFill");
  const statusLabel  = document.getElementById("uploadStatus");

  if (progressBar)  progressBar.style.display  = "block";
  if (statusLabel)  statusLabel.style.display   = "block";

  const resultados = [];
  const total      = archivosSeleccionados.length;

  for (let i = 0; i < total; i++) {
    const { file, nombre } = archivosSeleccionados[i];
    if (statusLabel) statusLabel.textContent = `Subiendo ${i + 1} de ${total}: ${nombre}`;

    const formData = new FormData();
    formData.append("file",          file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder",        "tickets");
    formData.append("public_id",     `ticket_${Date.now()}_${nombre.replace(/\s+/g, "_")}`);

    try {
      const resourceType = getResourceType(nombre);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      resultados.push({ url: data.secure_url, public_id: data.public_id, nombre });
    } catch (err) {
      console.error("Error subiendo", nombre, err);
      if (statusLabel) statusLabel.textContent = `⚠️ Error subiendo "${nombre}". Continuando...`;
    }

    if (progressFill) progressFill.style.width = Math.round(((i + 1) / total) * 100) + "%";
  }

  if (statusLabel)  statusLabel.textContent  = `✅ ${resultados.length} archivo(s) subido(s).`;
  if (progressFill) progressFill.style.width = "100%";

  setTimeout(() => {
    if (progressBar)  progressBar.style.display  = "none";
    if (statusLabel)  statusLabel.style.display   = "none";
    if (progressFill) progressFill.style.width    = "0%";
  }, 3000);

  return resultados;
}

// ======================
// CREAR TICKET
// ======================
async function crearTicket() {
  const titulo      = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const asignadoA   = document.getElementById("asignadoA").value || "Sin asignar";
  const usuario     = localStorage.getItem("usuario") || "Usuario";
  const depto       = localStorage.getItem("depto")   || "Sin departamento";

  if (!titulo || !descripcion) {
    alert("Por favor completa el título y la descripción.");
    return;
  }

  const btnEnviar = document.querySelector('#ticketForm button[type="button"]');
  if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.textContent = "Subiendo archivos..."; }

  archivosSubidos = await subirArchivosACloudinary();
  if (btnEnviar) btnEnviar.textContent = "Enviando ticket...";

  const nuevoTicket = {
    id:             "TK-" + Date.now(),
    titulo,
    descripcion,
    depto,
    asignado:       asignadoA,
    estado:         "Pendiente",
    usuario,
    fecha:          new Date().toLocaleString("es-DO"),
    adjuntos:       archivosSubidos.map(a => a.url).join(", "),
    resolucion:     "",
    participantes:  "",
    fecha_recibido: "",
    recibido_por:   "",
    fecha_resuelto: ""
  };

  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(nuevoTicket)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    enviarCorreoTicket(nuevoTicket, archivosSubidos.map(a => a.url));

    ["titulo", "descripcion"].forEach(id => { document.getElementById(id).value = ""; });
    document.getElementById("asignadoA").value = "Sin asignar";
    archivosSeleccionados = [];
    archivosSubidos       = [];
    renderPreview();

    alert("✅ Ticket creado correctamente.");
    mostrarTickets();

  } catch (err) {
    console.error("❌ Error creando ticket:", err);
    alert("❌ Error al guardar el ticket. Revisa la consola.");
  } finally {
    if (btnEnviar) { btnEnviar.disabled = false; btnEnviar.textContent = "Enviar Ticket"; }
  }
}

// ======================
// ENVIAR CORREO (EmailJS)
// ======================
function enviarCorreoTicket(ticket, adjuntosUrls = []) {
  const form = document.getElementById("ticketForm");
  if (!form) { console.warn("⚠️ ticketForm no encontrado"); return; }

  const set = (name, val) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.value = val;
  };

  set("ticket_id",           ticket.id          || "");
  set("ticket_usuario",      ticket.usuario      || "");
  set("ticket_departamento", ticket.depto        || "");
  set("ticket_titulo",       ticket.titulo       || "");
  set("ticket_descripcion",  ticket.descripcion + (adjuntosUrls.length ? "\n\n📎 Adjuntos:\n" + adjuntosUrls.join("\n") : ""));
  set("ticket_fecha",        ticket.fecha        || "");
  set("ticket_asignado",     ticket.asignado     || "Sin asignar");

  emailjs.sendForm("service_8oishge", "template_mferzbn", form, "60Wdt0a0Ejlr-BGGa")
    .then(()  => console.log("📧 Correo enviado"))
    .catch(e  => console.warn("⚠️ Error EmailJS:", e));
}

// ======================
// HELPER — construir adjuntos HTML
// ======================
function _buildAdjuntosHtml(adjuntos) {
  if (!adjuntos || !adjuntos.trim()) return "";
  const urls  = adjuntos.split(",").map(u => u.trim()).filter(Boolean);
  if (!urls.length) return "";
  const links = urls.map(url => {
    const nombre = decodeURIComponent(url.split("/").pop().split("?")[0]);
    const ext    = nombre.split(".").pop().toLowerCase();
    return `<a class="uploaded-file-link" href="${url}" target="_blank" rel="noopener">
              ${getFileIcon(ext)} ${nombre}
            </a>`;
  }).join("");
  return `
    <div style="margin-top:10px;padding-top:8px;border-top:1px dashed #e2e8f0;">
      <p style="font-size:11px;font-weight:600;color:#94a3b8;margin:0 0 6px;">📎 Archivos adjuntos</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${links}</div>
    </div>`;
}

// ======================
// HELPER — construir card de ticket
// ======================
function _buildTicketCard(t, opciones = {}) {
  const { mostrarBotones = false, esAdmin = false, mostrarBotonesAdmin = false } = opciones;

  const nombreMostrar = NOMBRES_COMPLETOS_TECNICOS[t.asignado] || t.asignado || "";
  const badgeAsignado = (t.asignado && t.asignado !== "Sin asignar")
    ? `<span class="badge-asignado">👤 ${nombreMostrar}</span>`
    : `<span class="badge-sin-asignar">⚠️ Sin asignar</span>`;

  const extra = t.estado === "Resuelto" ? `
    <div class="resolucion-box">
      <strong>✅ Resolución:</strong><br>${t.resolucion || "No hay detalle"}<br>
      <small><b>Participantes:</b> ${t.participantes || "N/A"}</small><br>
      <small><b>Fecha Resuelto:</b> ${t.fecha_resuelto || "-"}</small>
    </div>` : "";

  const adjuntosHtml = _buildAdjuntosHtml(t.adjuntos);

  // Botones de acción
  let botonesAccion = "";
  const idEnc = encodeURIComponent(t.id);
  if (t.estado !== "Resuelto") {
    if (mostrarBotones) {
      botonesAccion = `
        <button class="btn-proceso"  onclick="cambiarEstado('${idEnc}','En Proceso')">🔧 En Proceso</button>
        <button class="btn-resuelto" onclick="marcarResuelto('${idEnc}')">✅ Resuelto</button>`;
    } else if (mostrarBotonesAdmin) {
      if (t.estado === "Pendiente") {
        botonesAccion = `
          <button class="btn-proceso"  onclick="cambiarEstadoAdmin('${idEnc}','En Proceso')">🔧 En Proceso</button>
          <button class="btn-resuelto" onclick="marcarResuelto('${idEnc}')">✅ Resuelto</button>`;
      } else if (t.estado === "En Proceso") {
        botonesAccion = `<button class="btn-resuelto" onclick="marcarResuelto('${idEnc}')">✅ Resuelto</button>`;
      }
    }
  }

  const btnReasignar = esAdmin
    ? `<button class="btn-reasignar" onclick="abrirReasignar('${idEnc}')">🔁 Reasignar</button>`
    : "";

  const div = document.createElement("div");
  div.className = "ticket-card";
  if (t.fecha_resuelto) div.dataset.fechaResuelto = t.fecha_resuelto;

  div.innerHTML = `
    <div class="depto-tag">[${t.depto || ""}]</div>
    <div class="titulo">${t.titulo || ""}</div>
    <div class="descripcion">${t.descripcion || ""}</div>
    <div class="usuario-tag">🙍 Solicitado por: <b>${t.usuario || ""}</b></div>
    <div class="fecha">📅 ${t.fecha || ""}</div>
    ${badgeAsignado}
    ${adjuntosHtml}
    <br>
    ${botonesAccion}
    ${btnReasignar}
    ${extra}
  `;
  return div;
}

// ======================
// MOSTRAR TICKETS USUARIO
// ======================
function mostrarTickets() {
  const cont = document.getElementById("listaTickets");
  if (!cont) return;

  const usuario = localStorage.getItem("usuario");
  cont.innerHTML = "<p style='color:#94a3b8;text-align:center;'>Cargando...</p>";

  fetch(API_URL)
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then(data => {
      cont.innerHTML = "";
      const misTickets = data.filter(t => t.usuario === usuario).reverse();

      if (!misTickets.length) {
        cont.innerHTML = "<p style='color:#94a3b8;text-align:center;'>No tienes tickets registrados aún.</p>";
        return;
      }

      misTickets.forEach(t => {
        const statusClass =
          t.estado === "Resuelto"   ? "status-resuelto" :
          t.estado === "En Proceso" ? "status-proceso"   : "status-pendiente";

        const nombreAsignado = NOMBRES_COMPLETOS_TECNICOS[t.asignado] || t.asignado || "";
        const asignadoBadge  = (t.asignado && t.asignado !== "Sin asignar")
          ? `<span class="badge-asignado">👤 ${nombreAsignado}</span>`
          : `<span class="badge-sin-asignar">⏳ Sin asignar</span>`;

        const resolucionHtml = t.resolucion ? `
          <div class="resolucion-box">✅ <strong>Resolución:</strong> ${t.resolucion}
            <br><small><b>Participantes:</b> ${t.participantes || "N/A"}</small>
            <br><small><b>Fecha:</b> ${t.fecha_resuelto || "-"}</small>
          </div>` : "";

        const adjuntosHtml = _buildAdjuntosHtml(t.adjuntos)
          .replace('style="margin-top:10px;', 'class="ticket-attachments" style="margin-top:10px;');

        const div = document.createElement("div");
        div.className = "ticket-item";
        div.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px;">
            <h4 style="margin:0;"><span style="color:#4e54c8;">[${t.depto || ""}]</span> ${t.titulo}</h4>
            <span style="font-family:monospace;font-size:11px;font-weight:700;background:#ede9fe;color:#5b21b6;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;white-space:nowrap;"># ${t.id || "—"}</span>
          </div>
          <p>${t.descripcion}</p>
          <p><strong>Departamento:</strong> ${t.depto || ""}</p>
          <p><strong>Fecha:</strong> ${t.fecha || ""}</p>
          ${asignadoBadge}
          <span class="ticket-status ${statusClass}">${t.estado}</span>
          ${resolucionHtml}
          ${adjuntosHtml}
          <br>
          ${t.estado === "Pendiente"
            ? `<button class="btn-delete" onclick="eliminarTicket('${encodeURIComponent(t.id)}')">🗑 Eliminar</button>`
            : ""}
        `;
        cont.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Error cargando tickets:", err);
      cont.innerHTML = "<p style='color:#ef4444;'>Error al cargar tickets.</p>";
    });
}

// ======================
// ELIMINAR TICKET
// ======================
function eliminarTicket(id) {
  if (!confirm("¿Seguro que deseas eliminar este ticket?")) return;
  fetch(`${API_URL}/id/${encodeURIComponent(id)}`, { method: "DELETE" })
    .then(() => { alert("🗑️ Ticket eliminado"); mostrarTickets(); })
    .catch(err => console.error("Error eliminando:", err));
}

// ======================
// MOSTRAR TICKETS TÉCNICO
// ======================
function mostrarTodosTickets() {
  const pendientes = document.getElementById("pendientes");
  const enProceso  = document.getElementById("enProceso");
  const resueltos  = document.getElementById("resueltos");
  if (!pendientes) return;

  pendientes.innerHTML = enProceso.innerHTML = "";
  if (resueltos) resueltos.innerHTML = "";

  const tecnicoActual = localStorage.getItem("usuario");

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      data.filter(t =>
        !t.asignado ||
        t.asignado === "Sin asignar" ||
        t.asignado.toLowerCase() === tecnicoActual.toLowerCase()
      ).forEach(t => {
        const div = _buildTicketCard(t, { mostrarBotones: true });
        if      (t.estado === "Pendiente")  pendientes.appendChild(div);
        else if (t.estado === "En Proceso") enProceso.appendChild(div);
        else if (t.estado === "Resuelto" && esHoyLatina(t.fecha_resuelto)) {
          if (resueltos) resueltos.appendChild(div);
        }
      });

      if (!pendientes.innerHTML.trim())
        pendientes.innerHTML = "<p style='color:#94a3b8;text-align:center;'>Sin tickets pendientes.</p>";
      if (!enProceso.innerHTML.trim())
        enProceso.innerHTML  = "<p style='color:#94a3b8;text-align:center;'>Ningún ticket en proceso.</p>";
    })
    .catch(err => console.error("Error mostrando tickets técnico:", err));
}

// ======================
// MOSTRAR TICKETS ADMIN
// ======================
function mostrarTicketsAdmin() {
  const pendientes   = document.getElementById("pendientes");
  const enProceso    = document.getElementById("enProceso");
  const resueltos    = document.getElementById("resueltos");
  const misAsignados = document.getElementById("misAsignados");
  if (!pendientes) return;

  pendientes.innerHTML = enProceso.innerHTML = resueltos.innerHTML = "";
  if (misAsignados) misAsignados.innerHTML = "";

  const adminActual = localStorage.getItem("usuario");
  let cntPendientes = 0, cntProceso = 0;

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      data.forEach(t => {
        if      (t.estado === "Pendiente")  { pendientes.appendChild(_buildTicketCard(t, { esAdmin: true })); cntPendientes++; }
        else if (t.estado === "En Proceso") { enProceso.appendChild(_buildTicketCard(t, { esAdmin: true })); cntProceso++; }
        else if (t.estado === "Resuelto")   { resueltos.appendChild(_buildTicketCard(t, { esAdmin: true })); }

        if (misAsignados && t.asignado?.toLowerCase() === adminActual.toLowerCase() && t.estado !== "Resuelto") {
          misAsignados.appendChild(_buildTicketCard(t, { mostrarBotonesAdmin: true, esAdmin: true }));
        }
      });

      const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      setEl("statsTotal",      data.length);
      setEl("statsPendientes", cntPendientes);
      setEl("statsEnProceso",  cntProceso);

      if (misAsignados && !misAsignados.innerHTML.trim())
        misAsignados.innerHTML = "<p style='color:#94a3b8;text-align:center;'>No tienes tickets asignados activos.</p>";
      if (!pendientes.innerHTML.trim())
        pendientes.innerHTML   = "<p style='color:#94a3b8;text-align:center;'>Sin tickets pendientes.</p>";
      if (!enProceso.innerHTML.trim())
        enProceso.innerHTML    = "<p style='color:#94a3b8;text-align:center;'>Ningún ticket en proceso.</p>";

      if (typeof aplicarFiltroResueltos === "function") aplicarFiltroResueltos();
    })
    .catch(err => {
      console.error("Error mostrando tickets admin:", err);
      pendientes.innerHTML = "<p style='color:#ef4444;'>Error al cargar tickets.</p>";
    });
}

// ======================
// CAMBIAR ESTADO — Técnico
// ======================
function cambiarEstado(id, nuevoEstado) {
  fetch(`${API_URL}/id/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: nuevoEstado })
  })
  .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
  .then(() => mostrarTodosTickets())
  .catch(err => console.error("Error cambiando estado:", err));
}

// ======================
// CAMBIAR ESTADO — Admin
// ======================
function cambiarEstadoAdmin(id, nuevoEstado) {
  fetch(`${API_URL}/id/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: nuevoEstado })
  })
  .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
  .then(() => mostrarTicketsAdmin())
  .catch(err => console.error("Error cambiando estado (admin):", err));
}

// ======================
// MODAL RESOLVER TICKET
// ======================
let ticketResueltoId = null;

function marcarResuelto(id) {
  ticketResueltoId = decodeURIComponent(id);
  document.getElementById("resueltoModal").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("resueltoModal").style.display = "none";
  document.getElementById("detalleResolucion").value = "";
  document.querySelectorAll(".participante").forEach(c => c.checked = false);
  ticketResueltoId = null;
}

function guardarResolucion() {
  const checks       = document.querySelectorAll(".participante:checked");
  const participantes = Array.from(checks).map(c => c.value).join(", ");
  const detalle       = document.getElementById("detalleResolucion").value.trim();

  if (!detalle) { alert("⚠️ Escribe cómo se resolvió la tarea"); return; }

  const updateData = {
    estado:         "Resuelto",
    participantes,
    resolucion:     detalle,
    fecha_resuelto: new Date().toLocaleString("es-DO")
  };

  fetch(`${API_URL}/id/${encodeURIComponent(ticketResueltoId)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData)
  })
  .then(res => res.json())
  .then(() => {
    alert("✅ Ticket marcado como resuelto");
    cerrarModal();
    const rol = localStorage.getItem("rol");
    if (rol === "admin" || rol === "superadmin") mostrarTicketsAdmin();
    else                                          mostrarTodosTickets();
    mostrarTickets();
  })
  .catch(err => console.error("Error:", err));
}

// ======================
// MODAL REASIGNAR (ADMIN)
// ======================
let ticketReasignarId = null;

function abrirReasignar(id) {
  ticketReasignarId = decodeURIComponent(id);
  const select = document.getElementById("selectTecnico");
  if (!select) return;
  select.innerHTML = TECNICOS_DISPONIBLES.map(t => {
    const label = t === "Sin asignar" ? "⚠️ Sin asignar" : `👤 ${NOMBRES_COMPLETOS_TECNICOS[t] || t}`;
    return `<option value="${t}">${label}</option>`;
  }).join("");
  document.getElementById("reasignarModal").style.display = "flex";
}

function cerrarReasignar() {
  document.getElementById("reasignarModal").style.display = "none";
  ticketReasignarId = null;
}

function guardarReasignacion() {
  const nuevo = document.getElementById("selectTecnico").value;
  if (!ticketReasignarId) return;

  fetch(`${API_URL}/id/${encodeURIComponent(ticketReasignarId)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asignado: nuevo })
  })
  .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
  .then(() => {
    alert(`✅ Ticket reasignado a: ${NOMBRES_COMPLETOS_TECNICOS[nuevo] || nuevo}`);
    cerrarReasignar();
    mostrarTicketsAdmin();
  })
  .catch(err => console.error("Error reasignando:", err));
}

// ======================
// UTILIDADES DE FECHA
// ======================
function parseFechaLatina(fechaStr) {
  if (!fechaStr) return null;
  const [d, m, y] = fechaStr.split(",")[0].trim().split("/");
  return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
}

function esHoyLatina(fechaStr) {
  const f = parseFechaLatina(fechaStr);
  if (!f) return false;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  f.setHours(0,0,0,0);
  return f.getTime() === hoy.getTime();
}

// ======================
// MODAL AYUDA
// ======================
function abrirAyuda()  { document.getElementById("ayudaModal")?.classList.add("show"); }
function cerrarAyuda() { document.getElementById("ayudaModal")?.classList.remove("show"); }


(function iniciarAutoRefresh() {
  const rol = localStorage.getItem("rol");
  if      (rol === "usuario")                       setInterval(mostrarTickets,      30000);
  else if (rol === "tecnico")                       setInterval(mostrarTodosTickets, 30000);
  else if (rol === "admin" || rol === "superadmin") setInterval(mostrarTicketsAdmin, 60000);
  // analista maneja su propio refresh en Analista.html
})();

window.onload = function () {
  const rol = localStorage.getItem("rol");
  if      (rol === "usuario")                       mostrarTickets();
  else if (rol === "tecnico")                       mostrarTodosTickets();
  else if (rol === "admin" || rol === "superadmin") mostrarTicketsAdmin();
};
