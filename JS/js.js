// ======================
// USUARIOS DE PRUEBA
// ======================
const usuarios = [
  { username: "Juan",  password: "1234", rol: "tecnico" },
  { username: "michel", password: "1234", rol: "usuario" },
  { username: "Joel", password: "1234", rol: "tecnico" },
  { username: "Michel", password: "1234", rol: "usuario" },
  { username: "Pamela", password: "1234", rol: "usuario" },
  { username: "Eliana", password: "1234", rol: "usuario" },
  { username: "pamela", password: "1234", rol: "usuario" },
  { username: "Anabell", password: "1234", rol: "usuario" },
  { username: "Maitte", password: "1234", rol: "usuario" },
  { username: "Hilda", password: "1234", rol: "usuario" },
  { username: "hilda", password: "1234", rol: "usuario" },
  { username: "anabell", password: "1234", rol: "usuario" },
  { username: "maytte", password: "1234", rol: "usuario" },
  { username: "Chantal", password: "1234", rol: "usuario" },
  { username: "Carla", password: "1234", rol: "usuario" },
  { username: "eliana", password: "1234", rol: "usuario" },
  { username: "carla", password: "1234", rol: "usuario" },
  { username: "clara", password: "1234", rol: "usuario" },
  { username: "Clara", password: "1234", rol: "usuario" },
  { username: "Francisca", password: "1234", rol: "usuario" },
  { username: "Elizabeth", password: "1234", rol: "usuario" },
  { username: "Miladys", password: "1234", rol: "usuario" },
  { username: "elizabeth", password: "1234", rol: "usuario" },
  { username: "miladys", password: "1234", rol: "usuario" },
  { username: "Yanna", password: "1234", rol: "tecnico" },
  { username: "yanna", password: "1234", rol: "tecnico" },
  { username: "joel", password: "1234", rol: "tecnico" },
  { username: "juan", password: "1234", rol: "tecnico" }
];

// ======================
// LOGIN
// ======================
function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;
  let error = document.getElementById("login-error");

  let encontrado = usuarios.find(u => u.username === user && u.password === pass);

  if (encontrado) {
    localStorage.setItem("usuario", user);
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
const API_URL = "https://api.sheetbest.com/sheets/6c408e55-23aa-45f2-bf92-34a0fa26db33";

// ======================
// CREAR TICKET
// ======================
function crearTicket() {
  let titulo = document.getElementById("titulo").value;
  let descripcion = document.getElementById("descripcion").value;
  let depto = document.getElementById("depto").value;
  let usuario = localStorage.getItem("usuario") || "Invitado";

  if (!titulo || !descripcion || !depto) {
    alert("⚠️ Completa todos los campos");
    return;
  }

  let nuevoTicket = {
    id: Date.now().toString(),
    usuario: usuario,
    depto: depto,
    titulo: titulo,
    descripcion: descripcion,
    fecha: new Date().toLocaleString(),
    estado: "Pendiente",
    resolucion: "",
    participantes: "",
    fecha_resuelto: ""
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevoTicket)
  })
    .then(res => res.json())
    .then(() => {
      alert("✅ Ticket creado con éxito");
      document.getElementById("titulo").value = "";
      document.getElementById("descripcion").value = "";
      document.getElementById("depto").value = "";
      mostrarTickets();
    })
    .catch(err => console.error("Error:", err));
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

      data.filter(t => t.usuario === user).forEach(t => {
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
    })
    .catch(err => console.error("Error cargando tickets:", err));
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

        if (t.estado === "Pendiente") pendientes.appendChild(div);
        else if (t.estado === "En Proceso") enProceso.appendChild(div);
        else resueltos.appendChild(div);
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
window.onload = function () {
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

