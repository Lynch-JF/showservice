// ======================
// USUARIOS DE PRUEBA
// ======================
const usuarios = {
  tecnico: [
    { username: "Juan", password: "1234", rol: "tecnico" },
    { username: "juan", password: "1234", rol: "tecnico" },
    { username: "JUAN", password: "1234", rol: "tecnico" },
    { username: "Joel", password: "1234", rol: "tecnico" },
    { username: "joel", password: "1234", rol: "tecnico" },
    { username: "Yanna", password: "1234", rol: "tecnico" },
    { username: "yanna", password: "1234", rol: "tecnico" }
  ],

  usuario: [
    { username: "michel", password: "1234", rol: "usuario", po:"Administradora SJM" },
    { username: "Michel", password: "1234", rol: "usuario" },
    { username: "Pamela", password: "1234", rol: "usuario" },
    { username: "pamela", password: "1234", rol: "usuario" },
    { username: "Eliana", password: "1234", rol: "usuario" },
    { username: "eliana", password: "1234", rol: "usuario" },
    { username: "Anabell", password: "1234", rol: "usuario" },
    { username: "anabell", password: "1234", rol: "usuario" },
    { username: "Maitte", password: "1234", rol: "usuario" },
    { username: "maytte", password: "1234", rol: "usuario" },
    { username: "Hilda", password: "1234", rol: "usuario" },
    { username: "hilda", password: "1234", rol: "usuario" },
    { username: "Chantal", password: "1234", rol: "usuario" },
    { username: "chantal", password: "1234", rol: "usuario" },
    { username: "Carla", password: "1234", rol: "usuario" },
    { username: "carla", password: "1234", rol: "usuario" },
    { username: "Clara", password: "1234", rol: "usuario" },
    { username: "clara", password: "1234", rol: "usuario" },
    { username: "Francisca", password: "1234", rol: "usuario" },
    { username: "francisca", password: "1234", rol: "usuario" },
    { username: "Miladys", password: "1234", rol: "usuario" },
    { username: "miladys", password: "1234", rol: "usuario" },
    { username: "Jasnahia", password: "1234", rol: "usuario" },
    { username: "Jasnahia", password: "1234", rol: "usuario" },
    { username: "Enelso", password: "1234", rol: "usuario" },
    { username: "enelso", password: "1234", rol: "usuario" },
    { username: "Alexandra", password: "1234", rol: "usuario" },
    { username: "alexandra", password: "1234", rol: "usuario" },
    { username: "Ricarda", password: "1234", rol: "usuario" },
    { username: "ricarda", password: "1234", rol: "usuario" },
    { username: "Eduard", password: "1234", rol: "usuario" },
    { username: "eduard", password: "1234", rol: "usuario" },
    { username: "Enmanuel", password: "1234", rol: "usuario" },
    { username: "enmanuel", password: "1234", rol: "usuario" },
    { username: "Francis", password: "1234", rol: "usuario" },
    { username: "francis", password: "1234", rol: "usuario" },
    { username: "Edgar", password: "1234", rol: "usuario" },
    { username: "edgar", password: "1234", rol: "usuario" },
    { username: "Merlyn", password: "1234", rol: "usuario" },
    { username: "merlyn", password: "1234", rol: "usuario" },
    { username: "Elaine", password: "1234", rol: "usuario" },
    { username: "elaine", password: "1234", rol: "usuario" },
  ]
};



// ======================
// LOGIN
// ======================
function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;
  let error = document.getElementById("login-error");

  // Unimos todos los usuarios
  const todos = [
    ...usuarios.tecnico,
    ...usuarios.usuario
  ];

  // Búsqueda sin importar mayúsculas/minúsculas
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
// API SheetBest
// ======================

console.log("🟡 Iniciando creación de ticket y nuevos usuarios administradores tiendas...");
const API_URL = "https://api.sheetbest.com/sheets/7d5e6df5-e5b8-4e84-8bc4-bf9c4e4589eb";

// ======================
// CREAR TICKET
// ======================
function crearTicket() {
  let titulo = document.getElementById("titulo").value.trim();
  let descripcion = document.getElementById("descripcion").value.trim();
  let depto = document.getElementById("depto").value;
  let usuario = localStorage.getItem("usuario") || "Invitado";

  if (!titulo || !descripcion || !depto) {
    alert("⚠️ Completa todos los campos");
    return;
  }

  let nuevoTicket = {
    id: Date.now().toString(), // solo informativo
    usuario,
    depto,
    titulo,
    descripcion,
    fecha: new Date().toLocaleString(),
    estado: "Pendiente",
    resolucion: "",
    participantes: "",
    fecha_resuelto: ""
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
    console.log("✅ Ticket creado correctamente");

    alert("✅ Ticket creado correctamente");

    // Limpiar formulario
    document.getElementById("titulo").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("depto").value = "";

    mostrarTickets();

    // ⏱ Enviar correo DESPUÉS del alert
    setTimeout(() => {
      enviarCorreoTicket(nuevoTicket);
    }, 0);
  })
  .catch(err => {
    console.error("❌ Error creando ticket:", err);
    alert("❌ Error al crear el ticket");
  });
}


function enviarCorreoTicket(ticket) {
  console.log("📤 Intentando enviar correo del ticket:", ticket);

  return emailjs.send("service_8oishge", "template_mferzbn", {
    ticket_id: ticket.id,
    ticket_usuario: ticket.usuario,
    ticket_departamento: ticket.depto,
    ticket_titulo: ticket.titulo,
    ticket_descripcion: ticket.descripcion,
    ticket_fecha: ticket.fecha
  })
  .then(() => {
    console.log("📧 Correo enviado correctamente");
  })
  .catch(err => {
    console.error("❌ Error enviando correo:", err);
  });
}



// ======================
// MOSTRAR TICKETS USUARIO
// ======================
function mostrarTickets() {
  const cont = document.getElementById("listaTickets");
  if (!cont) return;

  const user = localStorage.getItem("usuario");

  // 1️⃣ Primero intentamos desde cache
  const cache = JSON.parse(localStorage.getItem("tickets_cache"));
  if (cache) {
    renderTickets(cache, user, cont);
  }

  // 2️⃣ Solo sincronizamos si no hay cache o si quieres forzar actualización
  if (!cache) {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        // Guardamos en cache
        localStorage.setItem("tickets_cache", JSON.stringify(data));
        renderTickets(data, user, cont);
      })
      .catch(err => console.error("Error cargando tickets:", err));
  }
}

function renderTickets(data, user, cont) {
  cont.innerHTML = "";

  data
    .filter(t => t.usuario === user)
    .forEach(t => {
      let div = document.createElement("div");
      div.className = "ticket-item";

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

      div.innerHTML = `
        <strong>[${t.depto}]</strong> ${t.titulo}<br>
        ${t.descripcion}<br>
        <small>${t.fecha}</small><br>
        Estado: <b>${t.estado}</b>
        ${t.estado === "Pendiente" ? `<button class="btn-delete" onclick="eliminarTicket('${t.id}')">🗑️</button>` : ""}
        ${extra}
      `;

      cont.appendChild(div);
    });
}

// ======================
// ELIMINAR TICKET (solo pendiente)
// ======================
function eliminarTicket(id) {
  if (!id) {
    console.error("❌ No se encontró ID");
    return;
  }

  fetch(`${API_URL}/id/${id}`, { method: "DELETE" })
    .then(res => res.json())
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

  // Ej: "25/9/2025, 10:04:15 a. m."
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
// MOSTRAR TICKETS PARA TÉCNICO
// ======================
function mostrarTodosTickets() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      let pendientes = document.getElementById("pendientes");
      let enProceso = document.getElementById("enProceso");
      let resueltos = document.getElementById("resueltos");

      if (!pendientes) return;

      pendientes.innerHTML = "";
      enProceso.innerHTML = "";
      resueltos.innerHTML = "";

      data.forEach(t => {
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

        div.innerHTML = `
          <strong>[${t.depto}]</strong> ${t.titulo} - ${t.usuario}<br>
          <em>${t.descripcion}</em><br>
          <small>${t.fecha}</small><br>
          Estado: <b>${t.estado}</b><br>
          ${t.estado !== "Resuelto" ? `
            <button class="btn-proceso" onclick="cambiarEstado('${t.id}', 'En Proceso')">En Proceso</button>
            <button class="btn-resuelto" onclick="marcarResuelto('${t.id}')">Resuelto</button>
          ` : ""}
          ${extra}
        `;

        if (t.estado === "Pendiente") {
          pendientes.appendChild(div);
        }
        else if (t.estado === "En Proceso") {
          enProceso.appendChild(div);
        }
        else if (t.estado === "Resuelto") {
          // 🔥 SOLO LOS RESUELTOS DE HOY
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
function cambiarEstado(id, nuevoEstado) {
  if (!id) {
    console.error("❌ No se encontró ID");
    return;
  }

  fetch(`${API_URL}/id/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: nuevoEstado })
  })
    .then(res => res.json())
    .then(() => {
      mostrarTodosTickets();
    })
    .catch(err => console.error("Error cambiando estado:", err));
}

// ======================
// MODAL RESOLVER TICKET
// ======================
let ticketResueltoId = null;

function marcarResuelto(id) {
  ticketResueltoId = id;
  document.getElementById("resueltoModal").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("resueltoModal").style.display = "none";
  document.getElementById("detalleResolucion").value = "";
  document.querySelectorAll(".participante").forEach(c => c.checked = false);
  ticketResueltoId = null;
}

function guardarResolucion() {
  let checks = document.querySelectorAll(".participante:checked");
  let participantes = Array.from(checks).map(c => c.value).join(", ");
  let detalle = document.getElementById("detalleResolucion").value;

  if (!detalle) {
    alert("⚠️ Escribe cómo se resolvió la tarea");
    return;
  }

  let updateData = {
    estado: "Resuelto",
    participantes: participantes,
    resolucion: detalle,
    fecha_resuelto: new Date().toLocaleString()
  };

  fetch(`${API_URL}/id/${ticketResueltoId}`, {
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

// ======================
// USUARIO TOP (OPCIÓN PRO)
// ======================
function mostrarUsuarioTop() {
  const usuario = localStorage.getItem("usuario");
  const rol = localStorage.getItem("po");

  if (!usuario) return;

  const userBtn = document.getElementById("userBtn");
  const userName = document.getElementById("userNameTop");

  if (!userBtn || !userName) return;

  userName.textContent = usuario;

  // Crear dropdown si no existe
  if (!document.getElementById("userDropdown")) {
    const dropdown = document.createElement("div");
    dropdown.id = "userDropdown";
    dropdown.className = "user-dropdown";
    dropdown.innerHTML = `
      <div class="dropdown-item"><strong>👤 ${usuario}</strong></div>
      <div class="dropdown-item">🔑 Rol: ${po}</div>
      <hr>
      <div class="dropdown-item logout-item" onclick="logout()">🚪 Cerrar sesión</div>
    `;
    userBtn.parentElement.appendChild(dropdown);
  }

  // Toggle dropdown
  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("userDropdown").classList.toggle("show");
  });
}

// Cerrar dropdown al hacer click fuera
document.addEventListener("click", () => {
  const dropdown = document.getElementById("userDropdown");
  if (dropdown) dropdown.classList.remove("show");
});




window.onload = function () {
    mostrarUsuarioTop();

  if (localStorage.getItem("rol") === "usuario") {
    mostrarTickets();
  } else if (localStorage.getItem("rol") === "tecnico") {
    mostrarTodosTickets();
  }
};

function abrirAyuda() {
  document.getElementById("ayudaModal").style.display = "flex";
}

function cerrarAyuda() {
  document.getElementById("ayudaModal").style.display = "none";
}

