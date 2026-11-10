/* ============================================================
   RESPALDO DE LA BASE DE DATOS — componente para la sección de Configuración
   Uso:
     RespaldoUI.montar(document.getElementById('respaldo'), {
       api: 'https://mi-backend/api/respaldo',   // ruta del backend (GET /formatos y GET /?formato=)
       token: () => localStorage.getItem('token'),
       rol: () => usuario.rol,                    // solo se muestra a los roles permitidos
       roles: ['superadmin', 'admin'],
       prefijo: 'mi-sistema',                     // nombre sugerido del archivo
     });
   Descarga el respaldo completo (estructura + todos los datos) en el formato elegido para restaurarlo en
   PostgreSQL, MySQL/MariaDB, SQL Server, SQLite o JSON. Si el navegador lo permite (Chrome/Edge), se escribe
   directo al archivo sin cargarlo en memoria. Solo se da por bueno si termina con la marca de fin del servidor.
   ============================================================ */
(function () {
  'use strict';
  const FORMATOS_DEFECTO = [
    { id: 'postgres', nombre: 'PostgreSQL', extension: 'sql', restaurar: 'psql "postgresql://usuario:clave@servidor:5432/base_nueva" -f ARCHIVO' },
    { id: 'mysql', nombre: 'MySQL / MariaDB', extension: 'sql', restaurar: 'mysql -u usuario -p base_nueva < ARCHIVO' },
    { id: 'sqlserver', nombre: 'SQL Server', extension: 'sql', restaurar: 'sqlcmd -S servidor -d BaseNueva -i ARCHIVO -f 65001' },
    { id: 'sqlite', nombre: 'SQLite', extension: 'sql', restaurar: 'sqlite3 nueva.db < ARCHIVO' },
    { id: 'json', nombre: 'JSON (cualquier motor)', extension: 'json', restaurar: 'Importador propio' },
  ];
  const norm = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '');

  const CSS = `
  .rsp-card{border:1px solid var(--border,rgba(127,127,127,.3));border-radius:12px;padding:18px 20px;margin:16px 0;background:var(--bg-card,var(--bg-elevated,transparent));color:inherit;font:inherit}
  .rsp-card h3{margin:0 0 6px;font-size:1.05em}
  .rsp-card p{margin:0 0 12px;opacity:.85;line-height:1.45}
  .rsp-fila{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}
  .rsp-card select{padding:8px 10px;border-radius:8px;border:1px solid var(--border,rgba(127,127,127,.4));background:var(--bg-input,var(--bg,transparent));color:inherit;font:inherit;min-width:220px}
  .rsp-card code{display:block;white-space:pre-wrap;word-break:break-all;font-size:.85em;padding:8px 10px;border-radius:8px;background:rgba(127,127,127,.12)}
  .rsp-btn{padding:9px 16px;border-radius:8px;border:1px solid transparent;cursor:pointer;font:inherit;font-weight:600}
  .rsp-btn.prim{background:var(--accent,#0d6efd);color:var(--text-on-accent,#fff)}
  .rsp-btn.sec{background:transparent;color:inherit;border-color:var(--border,rgba(127,127,127,.5))}
  .rsp-btn:disabled{opacity:.5;cursor:not-allowed}
  .rsp-barra{height:6px;border-radius:3px;background:rgba(127,127,127,.2);overflow:hidden;display:none}
  .rsp-barra i{display:block;height:100%;width:30%;background:var(--accent,#0d6efd);animation:rsp-mov 1.2s infinite ease-in-out}
  @keyframes rsp-mov{0%{margin-left:-30%}100%{margin-left:100%}}
  .rsp-estado{min-height:1.4em;font-size:.92em;margin-top:8px;white-space:pre-wrap;word-break:break-word}
  .rsp-ok{color:var(--success,#198754)} .rsp-error{color:var(--danger,#dc3545)}`;

  function tamano(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function sello() {
    const d = new Date(), z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
  }

  function montar(contenedor, op) {
    if (!contenedor) return;
    const permitidos = (op.roles || ['superadmin', 'admin']).map(norm);
    if (!permitidos.includes(norm(op.rol && op.rol()))) { contenedor.innerHTML = ''; return; }
    if (!document.getElementById('rsp-estilos')) {
      const st = document.createElement('style'); st.id = 'rsp-estilos'; st.textContent = CSS; document.head.appendChild(st);
    }
    const api = String(op.api).replace(/\/+$/, '');
    contenedor.innerHTML = `
      <div class="rsp-card">
        <h3>🗄️ Respaldo de la base de datos</h3>
        <p>Descarga una copia <b>completa</b> de la base (todas las tablas, su estructura y todos sus datos) en un archivo que
           se restaura en una base nueva del motor elegido. Sirve como respaldo y para migrar a otro servidor o a otro
           sistema de base de datos. Solo para super administradores y administradores.</p>
        <div class="rsp-fila"><label>Formato / motor destino&nbsp;</label><select class="rsp-formato"></select></div>
        <code class="rsp-restaurar"></code>
        <div class="rsp-fila">
          <button class="rsp-btn prim rsp-hacer">⬇ Hacer respaldo completo</button>
          <button class="rsp-btn sec rsp-cancelar" disabled>Cancelar</button>
        </div>
        <div class="rsp-barra"><i></i></div>
        <div class="rsp-estado"></div>
      </div>`;
    const $ = (s) => contenedor.querySelector(s);
    const sel = $('.rsp-formato'), btn = $('.rsp-hacer'), cancelar = $('.rsp-cancelar'), estado = $('.rsp-estado'), barra = $('.rsp-barra');
    let formatos = FORMATOS_DEFECTO, marca = 'FIN DEL RESPALDO', control = null;
    const cab = () => ({ Authorization: 'Bearer ' + (op.token ? op.token() : '') });
    const mostrar = (txt, clase) => { estado.textContent = txt; estado.className = 'rsp-estado' + (clase ? ' ' + clase : ''); };
    const pintar = () => {
      sel.innerHTML = formatos.map((f) => `<option value="${f.id}">${f.nombre}</option>`).join('');
      instrucciones();
    };
    const instrucciones = () => {
      const f = formatos.find((x) => x.id === sel.value) || formatos[0];
      $('.rsp-restaurar').textContent = f.id === 'json'
        ? 'Estructura de cada tabla + todas sus filas en JSON, sin depender de un motor.'
        : 'Para restaurar en una base nueva y vacía:\n' + String(f.restaurar || '').replace('ARCHIVO', 'respaldo.' + f.extension);
    };
    sel.addEventListener('change', instrucciones);
    pintar();
    fetch(api + '/formatos', { headers: cab() }).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { btn.disabled = true; mostrar(r.status === 404 ? 'El servidor todavía no tiene la función de respaldo (actualiza el backend).' : (j.error || 'Sin acceso al respaldo.'), 'rsp-error'); return; }
      if (j.fin) marca = j.fin;
      if (Array.isArray(j.formatos) && j.formatos.length) { formatos = j.formatos; pintar(); }
    }).catch(() => mostrar('No se pudo consultar el servidor.', 'rsp-error'));

    cancelar.addEventListener('click', () => control && control.abort());
    btn.addEventListener('click', async () => {
      const f = formatos.find((x) => x.id === sel.value);
      const nombre = `${op.prefijo || 'base'}-respaldo-${sello()}-${f.id}.${f.extension}`;
      let escritor = null;
      // Chrome / Edge: se elige el archivo antes y se escribe por partes (no se carga todo en memoria).
      if (window.showSaveFilePicker) {
        try {
          const h = await window.showSaveFilePicker({ suggestedName: nombre, types: [{ description: f.extension === 'json' ? 'Respaldo JSON' : 'Script SQL', accept: { [f.extension === 'json' ? 'application/json' : 'application/sql']: ['.' + f.extension] } }] });
          escritor = await h.createWritable();
        } catch (e) { if (e && e.name === 'AbortError') return; escritor = null; }
      }
      control = new AbortController();
      btn.disabled = sel.disabled = true; cancelar.disabled = false; barra.style.display = 'block';
      mostrar('Generando el respaldo en el servidor…');
      const inicio = Date.now(), partes = [];
      let bytes = 0, cola = new Uint8Array(0);
      try {
        const r = await fetch(`${api}?formato=${encodeURIComponent(f.id)}`, { headers: cab(), signal: control.signal });
        if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || ('Error ' + r.status)); }
        const lector = r.body.getReader();
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          bytes += value.length;
          if (escritor) await escritor.write(value); else partes.push(value);
          // Se guardan los últimos 512 bytes para comprobar la marca de fin.
          if (value.length >= 512) cola = value.slice(value.length - 512);
          else { const t = new Uint8Array(cola.length + value.length); t.set(cola); t.set(value, cola.length); cola = t.slice(Math.max(0, t.length - 512)); }
          mostrar(`Descargando… ${tamano(bytes)}  (${Math.round((Date.now() - inicio) / 1000)} s)`);
        }
        if (!new TextDecoder().decode(cola).includes(marca)) throw new Error('El respaldo llegó incompleto (falta la marca de fin). Intenta de nuevo.');
        if (escritor) await escritor.close();
        else {
          const url = URL.createObjectURL(new Blob(partes, { type: f.extension === 'json' ? 'application/json' : 'application/sql' }));
          const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        mostrar(`✔ Respaldo completo descargado (${tamano(bytes)} en ${Math.round((Date.now() - inicio) / 1000)} s): ${nombre}\nGuárdalo en un lugar seguro: contiene todos los datos.`, 'rsp-ok');
      } catch (e) {
        if (escritor) { try { await escritor.abort(); } catch (_) { /* nada */ } }
        mostrar(e.name === 'AbortError' ? 'Respaldo cancelado. No se guardó ningún archivo.' : 'No se pudo hacer el respaldo: ' + e.message, e.name === 'AbortError' ? '' : 'rsp-error');
      } finally {
        control = null; btn.disabled = sel.disabled = false; cancelar.disabled = true; barra.style.display = 'none';
      }
    });
  }
  window.RespaldoUI = { montar };
})();
