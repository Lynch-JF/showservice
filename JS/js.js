// ======================
// USUARIOS
// ======================
const usuarios = {
  tecnico: [
    { username: "Juan",   password: "1234", rol: "tecnico" },
    { username: "juan",   password: "1234", rol: "tecnico" },
    { username: "JUAN",   password: "1234", rol: "tecnico" },
    { username: "Joel",   password: "1234", rol: "tecnico" },
    { username: "joel",   password: "1234", rol: "tecnico" },
    { username: "Yanna",  password: "1234", rol: "tecnico" },
    { username: "Xavier", password: "1234", rol: "tecnico" },
    { username: "xavier", password: "1234", rol: "tecnico" },
    { username: "yanna",  password: "1234", rol: "tecnico" }
  ],
  usuario: [
    { username: "michel",     password: "1234",     rol: "usuario" },
    { username: "Doralina",   password: "gm1234",   rol: "usuario" },
    { username: "doralina",   password: "gm1234",   rol: "usuario" },
    { username: "Michel",     password: "1234",     rol: "usuario" },
    { username: "Pamela",     password: "1234",     rol: "usuario" },
    { username: "pamela",     password: "1234",     rol: "usuario" },
    { username: "Eliana",     password: "1234",     rol: "usuario" },
    { username: "eliana",     password: "1234",     rol: "usuario" },
    { username: "Anabell",    password: "1234",     rol: "usuario" },
    { username: "anabell",    password: "1234",     rol: "usuario" },
    { username: "Maitte",     password: "1234",     rol: "usuario" },
    { username: "maytte",     password: "1234",     rol: "usuario" },
    { username: "Hilda",      password: "1234",     rol: "usuario" },
    { username: "hilda",      password: "1234",     rol: "usuario" },
    { username: "Chantal",    password: "1234",     rol: "usuario" },
    { username: "chantal",    password: "1234",     rol: "usuario" },
    { username: "Carla",      password: "1234",     rol: "usuario" },
    { username: "carla",      password: "1234",     rol: "usuario" },
    { username: "Clara",      password: "1234",     rol: "usuario" },
    { username: "clara",      password: "1234",     rol: "usuario" },
    { username: "Francisca",  password: "1234",     rol: "usuario" },
    { username: "francisca",  password: "1234",     rol: "usuario" },
    { username: "Miladys",    password: "1234",     rol: "usuario" },
    { username: "miladys",    password: "1234",     rol: "usuario" },
    { username: "Jasnaya",    password: "1234",     rol: "usuario" },
    { username: "jasnaya",    password: "1234",     rol: "usuario" },
    { username: "Enelson",    password: "1234",     rol: "usuario" },
    { username: "enelson",    password: "1234",     rol: "usuario" },
    { username: "Alexandra",  password: "LA701234", rol: "usuario" },
    { username: "alexandra",  password: "LA701234", rol: "usuario" },
    { username: "Ricarda",    password: "1234",     rol: "usuario" },
    { username: "ricarda",    password: "1234",     rol: "usuario" },
    { username: "Eduard",     password: "1234",     rol: "usuario" },
    { username: "eduard",     password: "1234",     rol: "usuario" },
    { username: "Enmanuel",   password: "1234",     rol: "usuario" },
    { username: "enmanuel",   password: "1234",     rol: "usuario" },
    { username: "Francis",    password: "1234",     rol: "usuario" },
    { username: "francis",    password: "1234",     rol: "usuario" },
    { username: "Edgar",      password: "1234",     rol: "usuario" },
    { username: "edgar",      password: "1234",     rol: "usuario" },
    { username: "Merlyn",     password: "1234",     rol: "usuario" },
    { username: "merlyn",     password: "1234",     rol: "usuario" },
    { username: "Elaine",     password: "1234",     rol: "usuario" },
    { username: "Esmerkin",   password: "CM1234",   rol: "usuario" }
  ]
};

// ======================
// API SheetBest
// ======================
const API_URL = "https://api.sheetbest.com/sheets/06ce2eea-4aea-44d9-96d0-136e689a9902";

// ======================
// CLOUDINARY CONFIG
// ======================
const CLOUDINARY_CLOUD_NAME   = "dy50psi1g";
const CLOUDINARY_UPLOAD_PRESET = "tickets_preset";

// ======================
// ESTADO DE ARCHIVOS
// (compartido entre Dashboard.html y js.js)
// ======================
let archivosSeleccionados = [];
let archivosSubidos       = [];

// ======================
// LOGIN
// ======================
function login() {
  const user  = document.getElementById("username").value;
  const pass  = document.getElementById("password").value;
  const error = document.getElementById("login-error");

  const todos     = [...usuarios.tecnico, ...usuarios.usuario];
  const encontrado = todos.find(
    u => u.username.toLowerCase() === user.toLowerCase() && u.password === pass
  );

  if (encontrado) {
    localStorage.setItem("usuario", encontrado.username);
    localStorage.setItem("rol",     encontrado.rol);
    window.location.href = encontrado.rol === "tecnico" ? "Asistencia.html" : "Dashboard.html";
  } else {
    error.textContent = "Usuario o contraseña incorrectos.";
  }
}

function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");
  window.location.href = "index.html";
}

// ======================
// GENERAR ID
// ======================
function generarID() {
  return "TK-" + Date.now().toString().slice(-6);
}

// ======================
// ARCHIVOS — helpers UI
// ======================
function getFileIcon(ext) {
  const map = {
    pdf: "📄", doc: "📝", docx: "📝",
    xls: "📊", xlsx: "📊",
    zip: "🗜️", rar: "🗜️",
    txt: "📃",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", webp: "🖼️", svg: "🖼️",
    mp4: "🎬", mov: "🎬", avi: "🎬",
  };
  return map[ext] || "📁";
}

function agregarArchivos(lista) {
  [...lista].forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      alert(`"${file.name}" supera los 10 MB y no será agregado.`);
      return;
    }
    if (archivosSeleccionados.find(a => a.nombre === file.name)) return;
    archivosSeleccionados.push({ file, nombre: file.name, tamano: file.size });
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
async function subirArchivosACloudinary() {
  if (archivosSeleccionados.length === 0) return [];

  const progressBar  = document.getElementById("uploadProgressBar");
  const progressFill = document.getElementById("uploadProgressFill");
  const statusLabel  = document.getElementById("uploadStatus");

  if (progressBar)  progressBar.style.display  = "block";
  if (statusLabel)  statusLabel.style.display  = "block";

  const resultados = [];
  const total      = archivosSeleccionados.length;

  for (let i = 0; i < total; i++) {
    const { file, nombre } = archivosSeleccionados[i];
    if (statusLabel) statusLabel.textContent = `Subiendo ${i + 1} de ${total}: ${nombre}`;

    const formData = new FormData();
    formData.append("file",           file);
    formData.append("upload_preset",  CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder",         "tickets");
    formData.append("public_id",      `ticket_${Date.now()}_${nombre.replace(/\s+/g, "_")}`);

    try {
      const ext          = nombre.split(".").pop().toLowerCase();
      const esImagen     = ["png","jpg","jpeg","gif","webp","svg","bmp"].includes(ext);
      const esVideo      = ["mp4","mov","avi","mkv"].includes(ext);
      const resourceType = esImagen ? "image" : esVideo ? "video" : "raw";

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

  if (statusLabel) statusLabel.textContent = `✅ ${resultados.length} archivo(s) subido(s) correctamente.`;
  if (progressFill) progressFill.style.width = "100%";

  setTimeout(() => {
    if (progressBar)  { progressBar.style.display  = "none"; }
    if (statusLabel)  { statusLabel.style.display  = "none"; }
    if (progressFill) { progressFill.style.width   = "0%";   }
  }, 3000);

  return resultados;
}

// ======================
// CREAR TICKET  ← ÚNICA versión, usa SheetBest
// ======================
async function crearTicket() {
  const titulo      = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const depto       = document.getElementById("depto").value;
  const asignadoA   = document.getElementById("asignadoA").value || "Sin asignar";
  const usuario     = localStorage.getItem("usuario") || "Usuario";

  if (!titulo || !descripcion || !depto) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  const btnEnviar = document.querySelector('#ticketForm button[type="button"]');
  if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.textContent = "Subiendo archivos..."; }

  // 1. Subir archivos a Cloudinary
  archivosSubidos = await subirArchivosACloudinary();

  if (btnEnviar) btnEnviar.textContent = "Enviando ticket...";

  // 2. Construir ticket (campos normalizados)
  const ticketId     = "TK-" + Date.now();
  const fecha        = new Date().toLocaleString("es-DO");
  const adjuntosStr  = archivosSubidos.map(a => a.url).join(", ");

  const nuevoTicket = {
    id:           ticketId,
    titulo:       titulo,
    descripcion:  descripcion,
    depto:        depto,          // ← columna en el sheet
    asignado:     asignadoA,      // ← columna en el sheet
    estado:       "Pendiente",
    usuario:      usuario,
    fecha:        fecha,
    adjuntos:     adjuntosStr,    // URLs separadas por coma
    resolucion:   "",
    participantes:"",
    fecha_resuelto:""
  };

  console.log("🟡 Enviando a SheetBest:", nuevoTicket);

  // 3. POST a SheetBest
  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(nuevoTicket)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    console.log("✅ Ticket guardado en SheetBest");

    // 4. Enviar correo vía EmailJS
    enviarCorreoTicket(nuevoTicket, archivosSubidos.map(a => a.url));

    // 5. Limpiar formulario
    document.getElementById("titulo").value      = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("depto").value       = "";
    document.getElementById("asignadoA").value   = "Sin asignar";
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

  form.querySelector('[name="ticket_id"]').value           = ticket.id           || "";
  form.querySelector('[name="ticket_usuario"]').value      = ticket.usuario       || "";
  form.querySelector('[name="ticket_departamento"]').value = ticket.depto         || "";
  form.querySelector('[name="ticket_titulo"]').value       = ticket.titulo        || "";
  form.querySelector('[name="ticket_descripcion"]').value  =
    ticket.descripcion +
    (adjuntosUrls.length ? "\n\n📎 Adjuntos:\n" + adjuntosUrls.join("\n") : "");
  form.querySelector('[name="ticket_fecha"]').value        = ticket.fecha         || "";

  const asignadoInput = form.querySelector('[name="ticket_asignado"]');
  if (asignadoInput) asignadoInput.value = ticket.asignado || "Sin asignar";

  emailjs.sendForm("service_8oishge", "template_mferzbn", form, "60Wdt0a0Ejlr-BGGa")
    .then(()  => console.log("📧 Correo enviado"))
    .catch(e  => console.warn("⚠️ Error EmailJS:", e));
}

// ======================
// MOSTRAR TICKETS USUARIO
// ======================
function mostrarTickets() {
  const cont = document.getElementById("listaTickets");
  if (!cont) return;

  const usuario = localStorage.getItem("usuario");
  cont.innerHTML = "<p style='color:#94a3b8; text-align:center;'>Cargando...</p>";

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      cont.innerHTML = "";
      const misTickets = data.filter(t => t.usuario === usuario);

      if (misTickets.length === 0) {
        cont.innerHTML = "<p style='color:#94a3b8; text-align:center;'>No tienes tickets registrados aún.</p>";
        return;
      }

      misTickets.reverse().forEach(t => {
        const statusClass =
          t.estado === "Resuelto"    ? "status-resuelto"  :
          t.estado === "En Proceso"  ? "status-proceso"   : "status-pendiente";

        const nombresCompletos = { "Xavier": "Xavier Rosario", "Juan": "Juan Francisco Jimenez" };
        const nombreAsignado   = nombresCompletos[t.asignado] || t.asignado || "";

        const asignadoBadge = (t.asignado && t.asignado !== "Sin asignar")
          ? `<span class="badge-asignado">👤 ${nombreAsignado}</span>`
          : `<span class="badge-sin-asignar">⏳ Sin asignar</span>`;

        const resolucionHtml = t.resolucion
          ? `<div class="resolucion-box">✅ <strong>Resolución:</strong> ${t.resolucion}
               <br><small><b>Participantes:</b> ${t.participantes || "N/A"}</small>
               <br><small><b>Fecha:</b> ${t.fecha_resuelto || "-"}</small>
             </div>` : "";

        // Adjuntos: el campo es string CSV en SheetBest
        let adjuntosHtml = "";
        if (t.adjuntos && t.adjuntos.trim() !== "") {
          const urls  = t.adjuntos.split(",").map(u => u.trim()).filter(Boolean);
          const links = urls.map(url => {
            const nombre = decodeURIComponent(url.split("/").pop().split("?")[0]);
            const ext    = nombre.split(".").pop().toLowerCase();
            return `<a class="uploaded-file-link" href="${url}" target="_blank" rel="noopener">
                      ${getFileIcon(ext)} ${nombre}
                    </a>`;
          }).join("");
          adjuntosHtml = `
            <div class="ticket-attachments">
              <p>📎 Archivos adjuntos</p>
              <div class="uploaded-files-list">${links}</div>
            </div>`;
        }

        const div = document.createElement("div");
        div.className = "ticket-item";
        div.innerHTML = `
          <h4><span style="color:#4e54c8;">[${t.depto || ""}]</span> ${t.titulo}</h4>
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

  pendientes.innerHTML = enProceso.innerHTML = resueltos.innerHTML = "";

  const tecnicoActual = localStorage.getItem("usuario");

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const ticketsFiltrados = data.filter(t =>
        !t.asignado ||
        t.asignado === "Sin asignar" ||
        t.asignado.toLowerCase() === tecnicoActual.toLowerCase()
      );

      ticketsFiltrados.forEach(t => {
        const div = document.createElement("div");
        div.className = "ticket-card";

        const nombresCompletos = { "Xavier": "Xavier Rosario", "Juan": "Juan Francisco Jimenez" };
        const nombreMostrar    = nombresCompletos[t.asignado] || t.asignado || "";
        const badgeAsignado    = (t.asignado && t.asignado !== "Sin asignar")
          ? `<span class="badge-asignado">👤 ${nombreMostrar}</span>`
          : `<span class="badge-sin-asignar">⚠️ Sin asignar</span>`;

        const extra = t.estado === "Resuelto" ? `
          <div class="resolucion-box">
            <strong>✅ Resolución:</strong><br>${t.resolucion || "No hay detalle"}<br>
            <small><b>Participantes:</b> ${t.participantes || "N/A"}</small><br>
            <small><b>Fecha Resuelto:</b> ${t.fecha_resuelto || "-"}</small>
          </div>` : "";

        // Adjuntos del ticket
        let adjuntosHtml = "";
        if (t.adjuntos && t.adjuntos.trim() !== "") {
          const urls  = t.adjuntos.split(",").map(u => u.trim()).filter(Boolean);
          const links = urls.map(url => {
            const nombre = decodeURIComponent(url.split("/").pop().split("?")[0]);
            const ext    = nombre.split(".").pop().toLowerCase();
            return `<a class="uploaded-file-link" href="${url}" target="_blank" rel="noopener">
                      ${getFileIcon(ext)} ${nombre}
                    </a>`;
          }).join("");
          adjuntosHtml = `
            <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #e2e8f0;">
              <p style="font-size:11px; font-weight:600; color:#94a3b8; margin:0 0 6px;">📎 Archivos adjuntos</p>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">${links}</div>
            </div>`;
        }

        div.innerHTML = `
          <div class="depto-tag">[${t.depto || ""}]</div>
          <div class="titulo">${t.titulo || ""}</div>
          <div class="descripcion">${t.descripcion || ""}</div>
          <div class="usuario-tag">🙍 Solicitado por: <b>${t.usuario || ""}</b></div>
          <div class="fecha">📅 ${t.fecha || ""}</div>
          ${badgeAsignado}
          ${adjuntosHtml}
          <br>
          ${t.estado !== "Resuelto" ? `
            <button class="btn-proceso"  onclick="cambiarEstado('${encodeURIComponent(t.id)}', 'En Proceso')">🔧 En Proceso</button>
            <button class="btn-resuelto" onclick="marcarResuelto('${encodeURIComponent(t.id)}')">✅ Resuelto</button>
          ` : ""}
          ${extra}
        `;

        if      (t.estado === "Pendiente")  pendientes.appendChild(div);
        else if (t.estado === "En Proceso") enProceso.appendChild(div);
        else if (t.estado === "Resuelto" && esHoyLatina(t.fecha_resuelto)) resueltos.appendChild(div);
      });
    })
    .catch(err => console.error("Error mostrando tickets técnico:", err));
}

// ======================
// CAMBIAR ESTADO (PATCH)
// ======================
function cambiarEstado(id, nuevoEstado) {
  fetch(`${API_URL}/id/${encodeURIComponent(id)}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ estado: nuevoEstado })
  })
  .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
  .then(() => mostrarTodosTickets())
  .catch(err => console.error("Error cambiando estado:", err));
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
  const checks        = document.querySelectorAll(".participante:checked");
  const participantes = Array.from(checks).map(c => c.value).join(", ");
  const detalle       = document.getElementById("detalleResolucion").value;

  if (!detalle) { alert("⚠️ Escribe cómo se resolvió la tarea"); return; }

  const updateData = {
    estado:          "Resuelto",
    participantes:   participantes,
    resolucion:      detalle,
    fecha_resuelto:  new Date().toLocaleString()
  };

  fetch(`${API_URL}/id/${encodeURIComponent(ticketResueltoId)}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(updateData)
  })
  .then(res => res.json())
  .then(() => { alert("✅ Ticket marcado como resuelto"); cerrarModal(); mostrarTodosTickets(); mostrarTickets(); })
  .catch(err => console.error("Error:", err));
}

// ======================
// UTILIDADES DE FECHA
// ======================
function parseFechaLatina(fechaStr) {
  if (!fechaStr) return null;
  const partes = fechaStr.split(",");
  const [d, m, y] = partes[0].trim().split("/");
  return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
}

function esHoyLatina(fechaStr) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const f   = parseFechaLatina(fechaStr);
  if (!f) return false;
  f.setHours(0,0,0,0);
  return f.getTime() === hoy.getTime();
}

// ======================
// MODAL AYUDA
// ======================
function abrirAyuda() { document.getElementById("ayudaModal").classList.add("show"); }
function cerrarAyuda() { document.getElementById("ayudaModal").classList.remove("show"); }

// ======================
// AUTO REFRESH cada 30s
// ======================
setInterval(() => {
  const rol = localStorage.getItem("rol");
  if (rol === "usuario")  mostrarTickets();
  else if (rol === "tecnico") mostrarTodosTickets();
}, 30000);

// ======================
// AUTO CARGA
// ======================
window.onload = function () {
  const rol = localStorage.getItem("rol");
  if (rol === "usuario")  mostrarTickets();
  else if (rol === "tecnico") mostrarTodosTickets();
};
