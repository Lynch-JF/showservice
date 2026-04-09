// ======================
// USUARIOS DE PRUEBA
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
    { username: "michel",     password: "1234", rol: "usuario" },
    { username: "Doralina",     password: "gm1234", rol: "usuario" },
    { username: "doralina",     password: "gm1234", rol: "usuario" },
    { username: "Michel",     password: "1234", rol: "usuario" },
    { username: "Pamela",     password: "1234", rol: "usuario" },
    { username: "pamela",     password: "1234", rol: "usuario" },
    { username: "Eliana",     password: "1234", rol: "usuario" },
    { username: "eliana",     password: "1234", rol: "usuario" },
    { username: "Anabell",    password: "1234", rol: "usuario" },
    { username: "anabell",    password: "1234", rol: "usuario" },
    { username: "Maitte",     password: "1234", rol: "usuario" },
    { username: "maytte",     password: "1234", rol: "usuario" },
    { username: "Hilda",      password: "1234", rol: "usuario" },
    { username: "hilda",      password: "1234", rol: "usuario" },
    { username: "Chantal",    password: "1234", rol: "usuario" },
    { username: "chantal",    password: "1234", rol: "usuario" },
    { username: "Carla",      password: "1234", rol: "usuario" },
    { username: "carla",      password: "1234", rol: "usuario" },
    { username: "Clara",      password: "1234", rol: "usuario" },
    { username: "clara",      password: "1234", rol: "usuario" },
    { username: "Francisca",  password: "1234", rol: "usuario" },
    { username: "francisca",  password: "1234", rol: "usuario" },
    { username: "Miladys",    password: "1234", rol: "usuario" },
    { username: "miladys",    password: "1234", rol: "usuario" },
    { username: "Jasnaya",    password: "1234", rol: "usuario" },
    { username: "jasnaya",    password: "1234", rol: "usuario" },
    { username: "Enelson",    password: "1234", rol: "usuario" },
    { username: "enelson",    password: "1234", rol: "usuario" },
    { username: "Alexandra",  password: "LA701234", rol: "usuario" },
    { username: "alexandra",  password: "LA701234", rol: "usuario" },
    { username: "Ricarda",    password: "1234", rol: "usuario" },
    { username: "ricarda",    password: "1234", rol: "usuario" },
    { username: "Eduard",     password: "1234", rol: "usuario" },
    { username: "eduard",     password: "1234", rol: "usuario" },
    { username: "Enmanuel",   password: "1234", rol: "usuario" },
    { username: "enmanuel",   password: "1234", rol: "usuario" },
    { username: "Francis",    password: "1234", rol: "usuario" },
    { username: "francis",    password: "1234", rol: "usuario" },
    { username: "Edgar",      password: "1234", rol: "usuario" },
    { username: "edgar",      password: "1234", rol: "usuario" },
    { username: "Merlyn",     password: "1234", rol: "usuario" },
    { username: "merlyn",     password: "1234", rol: "usuario" },
    { username: "Elaine",     password: "1234", rol: "usuario" },
    { username: "Elaine",     password: "1234", rol: "usuario" },
    { username: "Esmerkin",     password: "CM1234", rol: "usuario" },
    { username: "Esmerkin",     password: "CM1234", rol: "usuario" }
  ]
};

// ======================
// API SheetBest
// ======================
const API_URL = "https://api.sheetbest.com/sheets/06ce2eea-4aea-44d9-96d0-136e689a9902";

// ======================
// LOGIN
// ======================
function login() {
  let user  = document.getElementById("username").value;
  let pass  = document.getElementById("password").value;
  let error = document.getElementById("login-error");

  const todos = [...usuarios.tecnico, ...usuarios.usuario];

  let encontrado = todos.find(
    u => u.username.toLowerCase() === user.toLowerCase() && u.password === pass
  );

  if (encontrado) {
    localStorage.setItem("usuario", encontrado.username);
    localStorage.setItem("rol", encontrado.rol);

    if (encontrado.rol === "tecnico") {
      window.location.href = "Asistencia.html";
    } else {
      window.location.href = "Dashboard.html";
    }
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
// CREAR TICKET ✅ CORREGIDO
// ======================
function crearTicket() {
  const titulo      = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const depto       = document.getElementById('depto').value;
  const asignado    = document.getElementById('asignadoA').value; // ✅ ID correcto
  const usuario     = localStorage.getItem("usuario");

  if (!titulo || !descripcion || !depto) {
    alert("Por favor rellena los campos obligatorios");
    return;
  }

  const nuevoTicket = {
    titulo:      titulo,
    descripcion: descripcion,
    depto:       depto,                              // ✅ campo unificado como "depto"
    asignado:    asignado || "Sin asignar",          // ✅ técnico asignado
    estado:      "Pendiente",
    usuario:     usuario,                            // ✅ incluye el usuario que creó el ticket
    fecha:       new Date().toLocaleString()
  };

  console.log("🟡 Creando ticket:", nuevoTicket);

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevoTicket)
  })
  .then(res => {
    if (!res.ok) throw new Error("Error creando ticket");
    return res.text();
  })
  .then(() => {
    alert("✅ Ticket creado correctamente");
    mostrarTickets();
    enviarCorreoTicket(nuevoTicket);
    // Limpiar campos
    document.getElementById("titulo").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("depto").value = "";
    document.getElementById("asignadoA").value = "Sin asignar";
  })
  .catch(err => {
    console.error("❌ Error creando ticket:", err);
    alert("❌ Error al crear el ticket");
  });
}

// ======================
// ENVIAR CORREO
// ======================
function enviarCorreoTicket(ticket) {
  console.log("📤 Enviando correo del ticket:", ticket);

  const form = document.getElementById("ticketForm");
  if (!form) return;

  form.querySelector('[name="ticket_id"]').value          = ticket.id || "";
  form.querySelector('[name="ticket_usuario"]').value     = ticket.usuario;
  form.querySelector('[name="ticket_departamento"]').value = ticket.depto;
  form.querySelector('[name="ticket_titulo"]').value      = ticket.titulo;
  form.querySelector('[name="ticket_descripcion"]').value = ticket.descripcion;
  form.querySelector('[name="ticket_fecha"]').value       = ticket.fecha;

  return emailjs.sendForm(
    "service_8oishge",
    "template_mferzbn",
    form,
    "60Wdt0a0Ejlr-BGGa"
  )
  .then(() => console.log("📧 Correo enviado"))
  .catch(err => console.error("❌ Error enviando correo:", err));
}

// ======================
// MOSTRAR TICKETS USUARIO
// ======================
function mostrarTickets() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      let cont = document.getElementById("listaTickets");
      if (!cont) return;

      let user = localStorage.getItem("usuario");
      cont.innerHTML = "";

      const misTickets = data.filter(t => t.usuario === user);

      if (misTickets.length === 0) {
        cont.innerHTML = "<p style='color:#94a3b8; text-align:center;'>No tienes tickets aún.</p>";
        return;
      }

      misTickets.forEach(t => {
        let div = document.createElement("div");
        div.className = "ticket-item";

        div.innerHTML = `
          <h4>
            <span style="color:#4e54c8; font-weight:600;">[${t.depto}]</span>
            ${t.titulo}
          </h4>

          <p>${t.descripcion}</p>
          <p><small>📅 ${t.fecha}</small></p>

          <!-- ✅ Técnico asignado visible con nombre completo -->
          ${(() => {
            const nombresCompletos = { "Xavier": "Xavier Rosario", "Juan": "Juan Francisco Jimenez" };
            const asig = t.asignado || "";
            const nombre = nombresCompletos[asig] || asig;
            return (asig && asig !== "Sin asignar")
              ? `<span class="badge-asignado">👤 Asignado a: ${nombre}</span>`
              : `<span class="badge-asignado" style="background:#fef3c7;color:#92400e;">⚠️ Sin asignar</span>`;
          })()}

          <div class="ticket-status ${
            t.estado === "Pendiente"  ? "status-pendiente" :
            t.estado === "En Proceso" ? "status-proceso"   :
            "status-resuelto"
          }">
            ${t.estado}
          </div>

          ${t.estado === "Pendiente"
            ? `<button class="btn-delete" onclick="eliminarTicket('${encodeURIComponent(t.titulo)}', '${encodeURIComponent(t.fecha)}')">🗑️ Eliminar</button>`
            : ""
          }

          ${t.estado === "Resuelto" ? `
            <div class="resolucion-box">
              <strong>✅ Resolución:</strong>
              <p>${t.resolucion || "No hay detalle"}</p>
              <small><b>Participantes:</b> ${t.participantes || "N/A"}</small><br>
              <small><b>Fecha:</b> ${t.fecha_resuelto || "-"}</small>
            </div>
          ` : ""}
        `;

        cont.appendChild(div);
      });
    })
    .catch(err => console.error("Error cargando tickets:", err));
}


// ======================
// ELIMINAR TICKET (solo pendiente)
// ======================
function eliminarTicket(titulo, fecha) {
  if (!titulo) {
    console.error("❌ No se encontró referencia del ticket");
    return;
  }

  if (!confirm("¿Seguro que deseas eliminar este ticket?")) return;

  // Busca y elimina por titulo y fecha (campos únicos combinados)
  fetch(`${API_URL}/titulo/${encodeURIComponent(titulo)}/fecha/${encodeURIComponent(fecha)}`, {
    method: "DELETE"
  })
  .then(() => {
    alert("🗑️ Ticket eliminado");
    mostrarTickets();
  })
  .catch(err => console.error("Error eliminando:", err));
}

// ======================
// UTILIDADES DE FECHA
// ======================
function parseFechaLatina(fechaStr) {
  if (!fechaStr) return null;
  const partes = fechaStr.split(",");
  const [d, m, y] = partes[0].trim().split("/");
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
}

function esHoyLatina(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = parseFechaLatina(fechaStr);
  if (!f) return false;
  f.setHours(0, 0, 0, 0);
  return f.getTime() === hoy.getTime();
}

// ======================
// MOSTRAR TICKETS PARA TÉCNICO ✅ FILTRO POR ASIGNACIÓN
// ======================
function mostrarTodosTickets() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      let pendientes = document.getElementById("pendientes");
      let enProceso  = document.getElementById("enProceso");
      let resueltos  = document.getElementById("resueltos");

      if (!pendientes) return;

      pendientes.innerHTML = "";
      enProceso.innerHTML  = "";
      resueltos.innerHTML  = "";

      const tecnicoActual = localStorage.getItem("usuario");

      // Cada técnico ve sus tickets + los sin asignar
      const ticketsFiltrados = data.filter(t =>
        !t.asignado ||
        t.asignado === "Sin asignar" ||
        t.asignado.toLowerCase() === tecnicoActual.toLowerCase()
      );

      ticketsFiltrados.forEach(t => {
        let div = document.createElement("div");
        div.className = "ticket-card";

        let extra = "";
        if (t.estado === "Resuelto") {
          extra = `
            <div class="resolucion-box">
              <strong>✅ Resolución:</strong><br>
              ${t.resolucion || "No hay detalle"}<br>
              <small><b>Participantes:</b> ${t.participantes || "N/A"}</small><br>
              <small><b>Fecha Resuelto:</b> ${t.fecha_resuelto || "-"}</small>
            </div>
          `;
        }

        // Badge de asignación — mapea username corto a nombre completo para mostrar
        const nombresCompletos = {
          "Xavier": "Xavier Rosario",
          "Juan":   "Juan Francisco Jimenez"
        };
        const tecnicoAsignado = t.asignado || "";
        const nombreMostrar   = nombresCompletos[tecnicoAsignado] || tecnicoAsignado;
        const badgeAsignado   = (tecnicoAsignado && tecnicoAsignado !== "Sin asignar")
          ? `<span class="badge-asignado">👤 ${nombreMostrar}</span>`
          : `<span class="badge-sin-asignar">⚠️ Sin asignar</span>`;

        div.innerHTML = `
          <div class="depto-tag">[${t.depto || ""}]</div>
          <div class="titulo">${t.titulo || ""}</div>
          <div class="descripcion">${t.descripcion || ""}</div>
          <div class="usuario-tag">🙍 Solicitado por: <b>${t.usuario || ""}</b></div>
          <div class="fecha">📅 ${t.fecha || ""}</div>
          ${badgeAsignado}
          <br>
          ${t.estado !== "Resuelto" ? `
            <button class="btn-proceso"  onclick="cambiarEstado('${encodeURIComponent(t.titulo)}', '${encodeURIComponent(t.fecha)}', 'En Proceso')">🔧 En Proceso</button>
            <button class="btn-resuelto" onclick="marcarResuelto('${encodeURIComponent(t.titulo)}', '${encodeURIComponent(t.fecha)}')">✅ Resuelto</button>
          ` : ""}
          ${extra}
        `;

        if (t.estado === "Pendiente") {
          pendientes.appendChild(div);
        } else if (t.estado === "En Proceso") {
          enProceso.appendChild(div);
        } else if (t.estado === "Resuelto") {
          if (esHoyLatina(t.fecha_resuelto)) {
            resueltos.appendChild(div);
          }
        }
      });
    })
    .catch(err => console.error("Error mostrando tickets técnico:", err));
}

// ======================
// CAMBIAR ESTADO (PATCH)
// ======================
function cambiarEstado(titulo, fecha, nuevoEstado) {
  titulo = decodeURIComponent(titulo);
  fecha  = decodeURIComponent(fecha);

  fetch(`${API_URL}/titulo/${encodeURIComponent(titulo)}/fecha/${encodeURIComponent(fecha)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: nuevoEstado })
  })
  .then(res => res.json())
  .then(() => mostrarTodosTickets())
  .catch(err => console.error("Error cambiando estado:", err));
}

// ======================
// MODAL RESOLVER TICKET
// ======================
let ticketResueltoTitulo = null;
let ticketResueltoFecha  = null;

function marcarResuelto(titulo, fecha) {
  ticketResueltoTitulo = decodeURIComponent(titulo);
  ticketResueltoFecha  = decodeURIComponent(fecha);
  document.getElementById("resueltoModal").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("resueltoModal").style.display = "none";
  document.getElementById("detalleResolucion").value = "";
  document.querySelectorAll(".participante").forEach(c => c.checked = false);
  ticketResueltoTitulo = null;
  ticketResueltoFecha  = null;
}

function guardarResolucion() {
  let checks        = document.querySelectorAll(".participante:checked");
  let participantes = Array.from(checks).map(c => c.value).join(", ");
  let detalle       = document.getElementById("detalleResolucion").value;

  if (!detalle) {
    alert("⚠️ Escribe cómo se resolvió la tarea");
    return;
  }

  let updateData = {
    estado:         "Resuelto",
    participantes:  participantes,
    resolucion:     detalle,
    fecha_resuelto: new Date().toLocaleString()
  };

  fetch(`${API_URL}/titulo/${encodeURIComponent(ticketResueltoTitulo)}/fecha/${encodeURIComponent(ticketResueltoFecha)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData)
  })
  .then(res => res.json())
  .then(() => {
    alert("✅ Ticket marcado como resuelto");
    cerrarModal();
    mostrarTodosTickets();
    mostrarTickets();
  })
  .catch(err => console.error("Error:", err));
}

// ======================
// AUTO REFRESH cada 30s
// ======================
setInterval(() => {
  if (localStorage.getItem("rol") === "usuario") {
    mostrarTickets();
  } else if (localStorage.getItem("rol") === "tecnico") {
    mostrarTodosTickets();
  }
}, 30000);

// ======================
// AUTO CARGA
// ======================
window.onload = function () {
  if (localStorage.getItem("rol") === "usuario") {
    mostrarTickets();
  } else if (localStorage.getItem("rol") === "tecnico") {
    mostrarTodosTickets();
  }
};

// ======================
// MODAL AYUDA
// ======================
function abrirAyuda() {
  document.getElementById("ayudaModal").classList.add("show");
}

function cerrarAyuda() {
  document.getElementById("ayudaModal").classList.remove("show");
}
