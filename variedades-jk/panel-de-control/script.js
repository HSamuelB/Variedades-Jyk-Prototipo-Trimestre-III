document.addEventListener('DOMContentLoaded', () => {
    const usuario = protegerPagina();
    if (!usuario) return;

    marcarActivo();
    aplicarPermisos();

    // Header
    document.getElementById('avatarInicial').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol + ' · ' + (usuario.turno || '');

    // Saludo
    const hoy = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('saludo').textContent = `Hola, ${usuario.nombre.split(' ')[0]} 👋`;
    document.getElementById('fechaHoy').textContent =
        hoy.toLocaleDateString('es-CO', opciones).replace(/^\w/, c => c.toUpperCase()) +
        ' · Este es el resumen de tu tienda hoy';

    // ============ KPIs ============
    const ventas = getVentas();
    const hoyStr = hoy.toDateString();

    const ventasHoy = ventas.filter(v => new Date(v.fecha).toDateString() === hoyStr);
    const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
    const gananciaHoy = ventasHoy.reduce((s, v) => s + ((v.precioUnitario - v.costoUnitario) * v.cantidad), 0);
    const productosVendidos = ventasHoy.reduce((s, v) => s + v.cantidad, 0);
    const ticket = ventasHoy.length ? totalHoy / ventasHoy.length : 0;

    document.getElementById('kpiVentas').textContent    = formatoCOP(totalHoy);
    document.getElementById('kpiGanancia').textContent  = formatoCOP(gananciaHoy);
    document.getElementById('kpiProductos').textContent = productosVendidos;
    document.getElementById('kpiTicket').textContent    = formatoCOP(Math.round(ticket));

    // ============ Gráfico semanal ============
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const totalesPorDia = [0,0,0,0,0,0,0];

    ventas.forEach(v => {
        const d = new Date(v.fecha);
        const dif = Math.floor((hoy - d) / 86400000);
        if (dif >= 0 && dif < 7) {
            const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
            totalesPorDia[idx] += v.total;
        }
    });

    const maxDia = Math.max(...totalesPorDia, 1);
    const grafico = document.getElementById('grafico');
    grafico.innerHTML = dias.map((dia, i) => {
        const valor = totalesPorDia[i];
        const altura = (valor / maxDia) * 100;
        const esHoy = i === (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1);
        return `
            <div class="barra-wrap ${esHoy ? 'hoy' : ''}">
                <span class="barra-valor">${formatoCOP(valor)}</span>
                <div class="barra ${esHoy ? 'hoy' : ''}" style="height:${altura}%"></div>
                <span class="barra-etiqueta">${dia}</span>
            </div>
        `;
    }).join('');

    const totalSemana = totalesPorDia.reduce((a, b) => a + b, 0);
    document.getElementById('totalSemana').textContent = formatoCOP(totalSemana);
    document.getElementById('promedioDiario').textContent = formatoCOP(Math.round(totalSemana / 7));

    // ============ Alertas ============
    const productos = getProductos();

    const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo);
    const agotados  = productos.filter(p => p.stock === 0);
    document.getElementById('contStock').textContent = stockBajo.length + agotados.length;

    const hoyMs = Date.now();
    const alertasVenc = productos.filter(p => {
        const dias = Math.ceil((new Date(p.vencimiento) - hoyMs) / 86400000);
        return dias <= 30;
    });
    document.getElementById('contVenc').textContent = alertasVenc.length;

    // Panel stock
    const panelStock = document.getElementById('panel-stock');
    let htmlStock = '';
    agotados.forEach(p => {
        htmlStock += `
            <div class="alerta-item agotado">
                <div class="info"><h4>${p.nombre}</h4><p>Agotado</p></div>
                <button class="btn-mini" onclick="location.href='../inventario/index.html'">Ver</button>
            </div>`;
    });
    stockBajo.forEach(p => {
        htmlStock += `
            <div class="alerta-item bajo">
                <div class="info"><h4>${p.nombre}</h4><p>${p.stock} unidades restantes</p></div>
                <button class="btn-mini" onclick="location.href='../inventario/index.html'">Ver</button>
            </div>`;
    });
    panelStock.innerHTML = htmlStock || '<p class="alerta-vacio">✅ Sin alertas de stock</p>';

    // Panel vencimiento
    const panelVenc = document.getElementById('panel-venc');
    let htmlVenc = '';
    alertasVenc.forEach(p => {
        const dias = Math.ceil((new Date(p.vencimiento) - hoyMs) / 86400000);
        const clase = dias < 0 ? 'vencido' : 'prox';
        const txt = dias < 0 ? `Vencido hace ${Math.abs(dias)} días` : `Vence en ${dias} días`;
        htmlVenc += `
            <div class="alerta-item ${clase}">
                <div class="info"><h4>${p.nombre}</h4><p>${txt}</p></div>
                <button class="btn-mini" onclick="location.href='../inventario/index.html'">Ver</button>
            </div>`;
    });
    panelVenc.innerHTML = htmlVenc || '<p class="alerta-vacio">✅ Sin vencimientos próximos</p>';

    // Tabs
    document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(x => x.classList.remove('activo'));
            document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('activo'));
            t.classList.add('activo');
            document.getElementById('panel-' + t.dataset.tab).classList.add('activo');
        });
    });
});