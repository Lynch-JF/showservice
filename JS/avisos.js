/* ══════════════════════════════════════════════════════════════
   AVISOS — notificaciones del panel (admin, técnico, analista y usuario)
   También: Avisos.conversacion (mensajes de un ticket) y
   Cuenta.cambiarContrasena (ventana para cambiar la contraseña).
   Se arman con los datos que el panel ya tiene (tickets y chat) más los
   mensajes de ticket sin leer. Lo leído se guarda en este navegador.

   Uso en cada panel:
     const avisos = Avisos.iniciar({
       usuario, rol, lista:"avisosList", badges:["nb-avisos"],
       tickets: () => allTickets, chats: () => chatConvs,
       nombre: u => "Nombre completo", abrir: aviso => { ... }
     });
     avisos.actualizar();   // cada vez que cambian los tickets o el chat
   ══════════════════════════════════════════════════════════════ */
(function () {
  const DIAS_RECIENTE = 7;                 // avisos de cambios de estado de los últimos 7 días
  const ROLES_EQUIPO = ["superadmin", "admin", "tecnico", "analista"];

  const lower = s => String(s || "").trim().toLowerCase();
  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const ms = v => { const d = new Date(v); return isNaN(d) ? 0 : +d; };
  const sinAsignar = a => !a || lower(a) === "sin asignar";
  const recibido = t => t.recibido === true || t.recibido === "si";
  function leerJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }
  function guardarJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  function hace(ts) {
    const m = Math.max(0, Date.now() - ts) / 60000;
    if (m < 1) return "ahora";
    if (m < 60) return "hace " + Math.round(m) + " min";
    if (m < 48 * 60) return "hace " + Math.round(m / 60) + " h";
    return "hace " + Math.round(m / 1440) + " d";
  }

  const ICONOS = { asig: "📥", nuevo: "🆕", msg: "💬", chat: "✉️", rec: "📩", proc: "🔧", res: "✅" };

  function estilos() {
    if (document.getElementById("avisos-css")) return;
    const s = document.createElement("style");
    s.id = "avisos-css";
    // Usa los colores del panel donde esté (cada panel nombra sus variables distinto).
    s.textContent = `
.av-wrap{display:flex;flex-direction:column;gap:12px;max-width:820px}
.av-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.av-tab{height:32px;padding:0 13px;border-radius:99px;border:1px solid var(--b2,var(--line,#d0d5dd));background:none;color:var(--t1,var(--ink-2,#475467));font:inherit;font-size:13px;cursor:pointer}
.av-tab.active{background:var(--btn-bg,var(--brand,#1d2939));border-color:transparent;color:var(--btn-fg,#fff)}
.av-bar .av-sp{flex:1}
.av-link{border:0;background:none;color:var(--blue,var(--brand,#2f6fb5));font:inherit;font-size:13px;cursor:pointer;padding:6px 4px}
.av-link:disabled{opacity:.45;cursor:default}
.av-list{display:flex;flex-direction:column;border:1px solid var(--b1,var(--line,#e4e7ec));border-radius:12px;overflow:hidden;background:var(--s1,var(--surface,#fff))}
.av-item{display:flex;gap:12px;align-items:flex-start;width:100%;padding:13px 15px;border:0;border-bottom:1px solid var(--b1,var(--line,#e4e7ec));background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.av-item:last-child{border-bottom:0}
.av-item:hover{background:var(--s2,var(--surface-2,#f2f4f7))}
.av-item.unread{background:color-mix(in srgb,var(--blue,var(--brand,#2f6fb5)) 7%,transparent)}
.av-ico{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--s2,var(--surface-2,#f2f4f7))}
.av-body{flex:1;min-width:0}
.av-t{font-size:14px;font-weight:600;line-height:1.35;color:var(--t0,var(--ink,#101828))}
.av-d{font-size:13px;line-height:1.4;color:var(--t2,var(--ink-3,#667085));overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.av-time{font-size:12px;color:var(--t3,var(--ink-3,#98a2b3));white-space:nowrap;padding-top:2px}
.av-item.unread .av-t::after{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--blue,var(--brand,#2f6fb5));margin-left:7px;vertical-align:middle}
.av-empty{padding:34px 18px;text-align:center;color:var(--t2,var(--ink-3,#667085));font-size:14px}
.av-empty b{display:block;font-size:15px;color:var(--t0,var(--ink,#101828));margin-bottom:4px}
.av-hint{font-size:12.5px;color:var(--t2,var(--ink-3,#667085))}
.av-flash{animation:avFlash 2.2s ease-out}
@keyframes avFlash{0%,35%{box-shadow:0 0 0 3px var(--blue,var(--brand,#2f6fb5))}100%{box-shadow:0 0 0 3px transparent}}
.av-modal{position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}
.av-dlg{width:min(520px,100%);max-height:min(640px,calc(100dvh - 32px));display:flex;flex-direction:column;background:var(--s1,var(--surface,#fff));color:var(--t0,var(--ink,#101828));border:1px solid var(--b1,var(--line,#e4e7ec));border-radius:14px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.av-dlg-h{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;border-bottom:1px solid var(--b1,var(--line,#e4e7ec))}
.av-dlg-h div{flex:1;min-width:0}.av-dlg-h b{display:block;font-size:15px}.av-dlg-h span{font-size:12.5px;color:var(--t2,var(--ink-3,#667085))}
.av-x{border:0;background:none;color:inherit;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px}
.av-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-height:160px;background:var(--bg,var(--surface-2,#f9fafb))}
.av-m{max-width:85%;padding:8px 12px;border-radius:12px;font-size:14px;line-height:1.45;background:var(--s2,var(--surface,#fff));border:1px solid var(--b1,var(--line,#e4e7ec));overflow-wrap:anywhere;white-space:pre-wrap}
.av-m.mio{align-self:flex-end;background:var(--btn-bg,var(--brand,#1d2939));color:var(--btn-fg,#fff);border-color:transparent}
.av-m small{display:block;font-size:11.5px;opacity:.7;margin-bottom:2px}
.av-m a{color:inherit}
.av-send{display:flex;gap:8px;padding:12px;border-top:1px solid var(--b1,var(--line,#e4e7ec))}
.av-send input{flex:1;min-width:0;height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--b2,var(--line,#d0d5dd));background:var(--bg,#fff);color:inherit;font:inherit;font-size:14px}
.av-send button{height:40px;padding:0 16px;border:0;border-radius:10px;background:var(--btn-bg,var(--brand,#1d2939));color:var(--btn-fg,#fff);font:inherit;font-size:14px;cursor:pointer}
.av-send button:disabled{opacity:.5;cursor:default}
.av-form{display:flex;flex-direction:column;gap:12px;padding:16px}
.av-form label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;color:var(--t1,var(--ink-2,#344054))}
.av-form input{height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--b2,var(--line,#d0d5dd));background:var(--bg,#fff);color:var(--t0,var(--ink,#101828));font:inherit;font-size:14px;font-weight:400}
.av-form .av-err{min-height:18px;font-size:13px;color:#d92d20}
.av-form .av-ok{font-size:13px;color:#039855}
.av-acc{display:flex;justify-content:flex-end;gap:8px}
.av-acc button{height:38px;padding:0 16px;border-radius:10px;font:inherit;font-size:14px;cursor:pointer;border:1px solid var(--b2,var(--line,#d0d5dd));background:none;color:inherit}
.av-acc button.pri{border-color:transparent;background:var(--btn-bg,var(--brand,#1d2939));color:var(--btn-fg,#fff)}
.av-acc button:disabled{opacity:.5;cursor:default}`;
    document.head.appendChild(s);
  }

  function iniciar(o) {
    const yo = lower(o.usuario);
    const rol = lower(o.rol);
    const equipo = ROLES_EQUIPO.includes(rol);
    const K_LEIDAS = "gmt_avisos_leidos_" + yo;
    const K_AVISADOS = "gmt_avisos_escritorio_" + yo;
    const nombre = u => (o.nombre ? o.nombre(u) : u) || u || "—";
    let msgsNoLeidos = [];          // [{ticket_id, no_leidos}]
    let pestaña = "todas";
    let ultimos = [];
    let primeraVez = !localStorage.getItem(K_AVISADOS);

    function construir() {
      const tickets = (o.tickets ? o.tickets() : []) || [];
      const chats = (o.chats ? o.chats() : []) || [];
      const desde = Date.now() - DIAS_RECIENTE * 864e5;
      const out = [];
      const ref = t => `#${t.id} ${t.titulo || "Sin título"}`;
      const porId = new Map(tickets.map(t => [Number(t.id), t]));

      tickets.forEach(t => {
        const abierto = t.estado !== "Resuelto";
        const asignadoAMi = lower(t.asignado) === yo;
        const loAbriYo = lower(t.usuario) === yo;

        // Lo que me asignan
        if (equipo && asignadoAMi && abierto && !recibido(t))
          out.push({ key: "asig-" + t.id, tipo: "asig", titulo: "Te asignaron un ticket", desc: ref(t) + (t.depto ? ", " + t.depto : ""), ts: ms(t.actualizado_en) || ms(t.creado_en), id: t.id });

        // Tickets nuevos sin responsable (admin y superadmin reparten el trabajo)
        if ((rol === "admin" || rol === "superadmin") && abierto && t.estado === "Pendiente" && sinAsignar(t.asignado) && ms(t.creado_en) >= desde)
          out.push({ key: "nuevo-" + t.id, tipo: "nuevo", titulo: "Ticket nuevo sin asignar", desc: ref(t) + (t.depto ? ", " + t.depto : "") + (t.usuario ? ", de " + nombre(t.usuario) : ""), ts: ms(t.creado_en), id: t.id });

        // Lo que pasa con los tickets que abrí yo
        if (loAbriYo && !asignadoAMi) {
          const cambio = ms(t.actualizado_en);
          if (t.estado === "Resuelto" && (ms(t.fecha_resuelto) || cambio) >= desde)
            out.push({ key: "res-" + t.id, tipo: "res", titulo: "Tu ticket fue resuelto", desc: ref(t) + (t.resolucion ? ": " + t.resolucion : ""), ts: ms(t.resuelto_iso || t.fecha_resuelto) || cambio, id: t.id });
          else if (t.estado === "En Proceso" && cambio >= desde)
            out.push({ key: "proc-" + t.id, tipo: "proc", titulo: "Están trabajando en tu ticket", desc: ref(t) + (sinAsignar(t.asignado) ? "" : ", con " + nombre(t.asignado)), ts: cambio, id: t.id });
          else if (abierto && recibido(t) && cambio >= desde)
            out.push({ key: "rec-" + t.id, tipo: "rec", titulo: "Tu ticket fue recibido", desc: ref(t) + (sinAsignar(t.asignado) ? "" : ", por " + nombre(t.asignado)), ts: cambio, id: t.id });
        }
      });

      // Mensajes nuevos dentro de un ticket (de los míos: asignados a mí o abiertos por mí)
      (o.mensajes ? o.mensajes() || [] : msgsNoLeidos).forEach(m => {
        const t = porId.get(Number(m.ticket_id));
        if (!t || !m.no_leidos) return;
        if (lower(t.asignado) !== yo && lower(t.usuario) !== yo) return;
        out.push({ key: `msg-${t.id}-${m.clave || m.no_leidos}`, tipo: "msg", titulo: m.no_leidos === 1 ? "Mensaje nuevo en un ticket" : m.no_leidos + " mensajes nuevos en un ticket", desc: ref(t), ts: ms(t.actualizado_en) || Date.now(), id: t.id });
      });

      // Chat interno
      chats.filter(c => c.no_leidos > 0).forEach(c => out.push({
        key: `chat-${lower(c.usuario)}-${c.ultimo_fecha || c.no_leidos}`, tipo: "chat",
        titulo: nombre(c.usuario) + " te escribió", desc: c.ultimo_mensaje || "", ts: ms(c.ultimo_fecha) || Date.now(), chat: c.usuario,
      }));

      const leidas = new Set(leerJSON(K_LEIDAS, []));
      out.forEach(n => { n.leida = leidas.has(n.key); });
      return out.sort((a, b) => b.ts - a.ts);
    }

    function guardarLeidas(keys) {
      const vigentes = new Set(ultimos.map(n => n.key));
      const set = new Set(leerJSON(K_LEIDAS, []).filter(k => vigentes.has(k)));
      keys.forEach(k => set.add(k));
      guardarJSON(K_LEIDAS, [...set]);
    }

    // Aviso de escritorio una sola vez por aviso. La primera vez en este navegador no se avisa
    // de lo que ya había (sería una ráfaga de avisos viejos).
    function escritorio(lista) {
      const avisados = new Set(leerJSON(K_AVISADOS, []));
      const nuevos = lista.filter(n => !n.leida && !avisados.has(n.key));
      lista.forEach(n => avisados.add(n.key));
      const vigentes = new Set(lista.map(n => n.key));
      guardarJSON(K_AVISADOS, [...avisados].filter(k => vigentes.has(k)));
      if (primeraVez) { primeraVez = false; return; }
      if (o.escritorio === false || !nuevos.length || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const n = nuevos[0];
      try {
        const not = new Notification("GM Tickets: " + n.titulo, { body: (nuevos.length > 1 ? `(+${nuevos.length - 1} más) ` : "") + n.desc, tag: "gmt-aviso-" + n.key, icon: "IMG/2.ico" });
        not.onclick = () => { window.focus(); not.close(); abrir(n.key); };
      } catch {}
    }

    function pintarBadges() {
      const n = ultimos.filter(x => !x.leida).length;
      (o.badges || []).forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        el.textContent = n > 99 ? "99+" : n;
        el.style.display = n > 0 ? "" : "none";
        if (el.classList.contains("bnav-dot")) el.classList.toggle("show", n > 0);
      });
    }

    function pintar() {
      const cont = document.getElementById(o.lista); if (!cont) return;
      const lista = pestaña === "sin-leer" ? ultimos.filter(n => !n.leida) : ultimos;
      const sinLeer = ultimos.filter(n => !n.leida).length;
      const permiso = typeof Notification === "undefined" ? "no" : Notification.permission;
      cont.innerHTML = `<div class="av-wrap">
        <div class="av-bar">
          <button type="button" class="av-tab ${pestaña === "todas" ? "active" : ""}" data-av-tab="todas">Todas</button>
          <button type="button" class="av-tab ${pestaña === "sin-leer" ? "active" : ""}" data-av-tab="sin-leer">Sin leer${sinLeer ? " (" + sinLeer + ")" : ""}</button>
          <span class="av-sp"></span>
          ${permiso === "default" ? `<button type="button" class="av-link" data-av-permiso>Avisarme en el escritorio</button>` : ""}
          <button type="button" class="av-link" data-av-todas ${sinLeer ? "" : "disabled"}>Marcar todo como leído</button>
        </div>
        <div class="av-list">${lista.map(n => `<button type="button" class="av-item ${n.leida ? "" : "unread"}" data-av-key="${esc(n.key)}">
            <span class="av-ico">${ICONOS[n.tipo] || "🔔"}</span>
            <span class="av-body"><span class="av-t" style="display:block">${esc(n.titulo)}</span><span class="av-d">${esc(n.desc)}</span></span>
            <span class="av-time">${esc(hace(n.ts))}</span></button>`).join("")
          || `<div class="av-empty"><b>${pestaña === "sin-leer" ? "Estás al día" : "Sin avisos"}</b>${esc(o.vacio || "Aquí aparecen los tickets que te asignan, los cambios en tus tickets y los mensajes nuevos.")}</div>`}</div>
        ${permiso === "denied" ? `<div class="av-hint">Los avisos de escritorio están bloqueados en este navegador. Puedes activarlos en el candado de la barra de direcciones.</div>` : ""}
      </div>`;
      cont.querySelectorAll("[data-av-tab]").forEach(b => b.onclick = () => { pestaña = b.dataset.avTab; pintar(); });
      cont.querySelectorAll("[data-av-key]").forEach(b => b.onclick = () => abrir(b.dataset.avKey));
      const t = cont.querySelector("[data-av-todas]"); if (t) t.onclick = marcarTodas;
      const p = cont.querySelector("[data-av-permiso]"); if (p) p.onclick = () => Notification.requestPermission().then(pintar);
    }

    function actualizar() {
      ultimos = construir();
      escritorio(ultimos);
      pintarBadges();
      pintar();
    }

    function abrir(key) {
      const n = ultimos.find(x => x.key === key); if (!n) return;
      guardarLeidas([key]);
      actualizar();
      if (o.abrir) o.abrir(n);
    }
    function marcarTodas() { guardarLeidas(ultimos.map(n => n.key)); actualizar(); }

    async function cargarMensajes() {
      try {
        const r = await apiFetch("/tickets/mensajes/no-leidos");
        if (!r.ok) return;
        const d = await r.json();
        msgsNoLeidos = Array.isArray(d) ? d : [];
        actualizar();
      } catch {}
    }

    estilos();
    // El panel puede dar sus propios mensajes sin leer (opción "mensajes"); si no, se piden al servidor.
    if (!o.mensajes) {
      cargarMensajes();
      setInterval(() => { if (!document.hidden) cargarMensajes(); }, (o.segundos || 60) * 1000);
    }
    return { actualizar, marcarTodas, refrescar: o.mensajes ? actualizar : cargarMensajes, sinLeer: () => ultimos.filter(n => !n.leida).length };
  }

  // Lleva la vista a la tarjeta del ticket (las tarjetas llevan data-tid) y la marca un momento.
  function resaltar(id) {
    setTimeout(() => {
      const el = [...document.querySelectorAll(`[data-tid="${CSS.escape(String(id))}"]`)].find(e => e.offsetParent !== null);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("av-flash"); void el.offsetWidth; el.classList.add("av-flash");
    }, 80);
    return true;
  }

  // Conversación de un ticket (la misma que ve el usuario en su panel): leer y responder.
  async function conversacion(t, alCerrar) {
    estilos();
    const yo = lower(localStorage.getItem("usuario"));
    const m = document.createElement("div");
    m.className = "av-modal";
    m.innerHTML = `<div class="av-dlg" role="dialog" aria-modal="true" aria-label="Mensajes del ticket">
      <div class="av-dlg-h"><div><b>#${esc(t.id)} ${esc(t.titulo || "Sin título")}</b><span>Mensajes con ${esc(t.usuario || "el usuario")}${t.estado ? " · " + esc(t.estado) : ""}</span></div><button type="button" class="av-x" aria-label="Cerrar">×</button></div>
      <div class="av-msgs"><div class="av-empty">Cargando…</div></div>
      ${t.estado === "Resuelto" ? `<div class="av-send"><span class="av-hint">El ticket está resuelto; ya no se pueden enviar mensajes.</span></div>`
        : `<form class="av-send"><input maxlength="5000" placeholder="Escribe un mensaje" aria-label="Mensaje"><button type="submit">Enviar</button></form>`}
    </div>`;
    document.body.appendChild(m);
    const cont = m.querySelector(".av-msgs");
    const cerrar = () => { m.remove(); document.removeEventListener("keydown", esc_); if (alCerrar) alCerrar(); };
    const esc_ = e => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", esc_);
    m.addEventListener("click", e => { if (e.target === m) cerrar(); });
    m.querySelector(".av-x").onclick = cerrar;
    const fmt = v => { const d = new Date(v); return isNaN(d) ? "" : d.toLocaleString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
    async function cargar() {
      try {
        const r = await apiFetch(`/tickets/${encodeURIComponent(t.id)}/mensajes`);
        if (!r.ok) throw new Error();
        const lista = await r.json();
        cont.innerHTML = (Array.isArray(lista) ? lista : []).map(x => {
          const mio = lower(x.autor_usuario) === yo;
          const adj = x.adjunto_url && /^https?:\/\//i.test(x.adjunto_url) ? `<br><a href="${esc(x.adjunto_url)}" target="_blank" rel="noopener">Ver adjunto</a>` : "";
          return `<div class="av-m ${mio ? "mio" : ""}"><small>${mio ? "Tú" : esc(x.autor_usuario)} · ${esc(fmt(x.creado_en))}</small>${esc(x.contenido)}${adj}</div>`;
        }).join("") || `<div class="av-empty">Todavía no hay mensajes en este ticket.</div>`;
        cont.scrollTop = cont.scrollHeight;
      } catch (e) { if (e.message !== "Unauthorized") cont.innerHTML = `<div class="av-empty">No se pudieron cargar los mensajes.</div>`; }
    }
    const form = m.querySelector("form");
    if (form) {
      const inp = form.querySelector("input"), btn = form.querySelector("button");
      form.onsubmit = async e => {
        e.preventDefault();
        const txt = inp.value.trim(); if (!txt) return;
        btn.disabled = true;
        try {
          const r = await apiFetch(`/tickets/${encodeURIComponent(t.id)}/mensajes`, { method: "POST", body: JSON.stringify({ contenido: txt }) });
          if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "HTTP " + r.status); }
          inp.value = ""; await cargar();
        } catch (e2) { if (e2.message !== "Unauthorized") alert("No se pudo enviar: " + e2.message); }
        finally { btn.disabled = false; inp.focus(); }
      };
      setTimeout(() => inp.focus(), 50);
    }
    await cargar();
  }

  // Cambiar la contraseña propia (PATCH /auth/change-password pide la actual).
  function cambiarContrasena() {
    estilos();
    const m = document.createElement("div");
    m.className = "av-modal";
    m.innerHTML = `<div class="av-dlg" role="dialog" aria-modal="true" aria-label="Cambiar contraseña" style="width:min(420px,100%)">
      <div class="av-dlg-h"><div><b>Cambiar contraseña</b><span>@${esc(localStorage.getItem("usuario") || "")}</span></div><button type="button" class="av-x" aria-label="Cerrar">×</button></div>
      <form class="av-form" autocomplete="off">
        <label>Contraseña actual<input type="password" name="actual" autocomplete="current-password" required></label>
        <label>Nueva contraseña<input type="password" name="nueva" autocomplete="new-password" minlength="6" required></label>
        <label>Repetir la nueva<input type="password" name="nueva2" autocomplete="new-password" required></label>
        <div class="av-err" aria-live="polite"></div>
        <div class="av-acc"><button type="button" data-cancel>Cancelar</button><button type="submit" class="pri">Cambiar contraseña</button></div>
      </form></div>`;
    document.body.appendChild(m);
    const form = m.querySelector("form"), err = m.querySelector(".av-err"), btn = form.querySelector("button[type=submit]");
    const cerrar = () => { m.remove(); document.removeEventListener("keydown", tecla); };
    const tecla = e => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", tecla);
    m.addEventListener("click", e => { if (e.target === m) cerrar(); });
    m.querySelector(".av-x").onclick = cerrar;
    m.querySelector("[data-cancel]").onclick = cerrar;
    form.onsubmit = async e => {
      e.preventDefault();
      const actual = form.actual.value, nueva = form.nueva.value, nueva2 = form.nueva2.value;
      err.className = "av-err";
      if (nueva.length < 6) { err.textContent = "La nueva contraseña debe tener al menos 6 caracteres."; return; }
      if (nueva !== nueva2) { err.textContent = "Las contraseñas nuevas no coinciden."; return; }
      if (nueva === actual) { err.textContent = "La nueva contraseña debe ser diferente a la actual."; return; }
      btn.disabled = true; err.textContent = "";
      try {
        const r = await apiFetch("/auth/change-password", { method: "PATCH", body: JSON.stringify({ contrasena_actual: actual, contrasena_nueva: nueva }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "El servidor respondió " + r.status);
        form.innerHTML = `<div class="av-ok">Listo, tu contraseña quedó cambiada. Úsala la próxima vez que inicies sesión.</div><div class="av-acc"><button type="button" class="pri">Cerrar</button></div>`;
        form.querySelector("button").onclick = cerrar;
      } catch (e2) {
        if (e2.message !== "Unauthorized") err.textContent = e2.message;
        btn.disabled = false;
      }
    };
    setTimeout(() => form.actual.focus(), 50);
  }

  window.Avisos = { iniciar, resaltar, conversacion };
  window.Cuenta = { cambiarContrasena };
})();
