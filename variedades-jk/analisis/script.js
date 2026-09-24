document.addEventListener('DOMContentLoaded', () => {
    const usuario = protegerPagina();
    if (!usuario) return;
    marcarActivo();
    aplicarPermisos();

    document.getElementById('avatarInicial').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol + ' · ' + (usuario.turno || '');

    // Rango por defecto: últimos 30 días
    const hoy = new Date();
    const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);
    document.getElementById('fechaHasta').value = hoy.toISOString().split('T')[0];
    document.getElementById('fechaDesde').value = hace30.toISOString().split('T')[0];

    function calcular() {
        const desde = new Date(document.getElementById('fechaDesde').value + 'T00:00:00');
        const hasta = new Date(document.getElementById('fechaHasta').value + 'T23:59:59');
        hasta.setHours(23, 59, 59, 999);

        document.getElementById('infoRango').textContent =
            `Reporte de rotación comercial · ${desde.toLocaleDateString('es-CO')} a ${hasta.toLocaleDateString('es-CO')}`;

        const ventas = getVentas().filter(v => {
            const d = new Date(v.fecha);
            return d >= desde && d <= hasta;
        });

        const productos = getProductos();
        const stats = productos.map(p => {
            const ventasProd = ventas.filter(v => v.productoId === p.id);
            return {
                id: p.id,
                nombre: p.nombre,
                unidades: ventasProd.reduce((s, v) => s + v.cantidad, 0),
                ingresos: ventasProd.reduce((s, v) => s + v.total, 0)
            };
        });

        const ordenados = [...stats].sort((a, b) => b.unidades - a.unidades);
        pintarTabla('tablaTop', ordenados.slice(0, 10), true);
        pintarTabla('tablaBottom', [...ordenados].reverse().slice(0, 10), false);

        // Historial de pedidos
        const hist = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const cuerpo = document.getElementById('historialVentas');
        if (!hist.length) {
            cuerpo.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--texto-suave)">Sin ventas registradas</td></tr>`;
        } else {
            cuerpo.innerHTML = hist.map(v => `
                <tr>
                    <td><strong>${v.id}</strong></td>
                    <td>${new Date(v.fecha).toLocaleDateString('es-CO')} ${new Date(v.fecha).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</td>
                    <td>${v.productoNombre}</td>
                    <td>${v.cantidad}</td>
                    <td><span class="badge badge-gris">${v.metodoPago}</span></td>
                    <td><strong>${formatoCOP(v.total)}</strong></td>
                </tr>
            `).join('');
        }
    }

    function pintarTabla(id, lista, top) {
        const cuerpo = document.getElementById(id);
        if (!lista.length) {
            cuerpo.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--texto-suave)">Sin datos</td></tr>`;
            return;
        }
        cuerpo.innerHTML = lista.map((s, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${s.nombre} <span class="codigo">${s.id}</span></td>
                <td>${s.unidades}</td>
                <td><strong>${formatoCOP(s.ingresos)}</strong></td>
            </tr>
        `).join('');
    }

    document.getElementById('fechaDesde').addEventListener('change', calcular);
    document.getElementById('fechaHasta').addEventListener('change', calcular);

    document.getElementById('btnExportar').addEventListener('click', () => {
        window.print();
    });

    calcular();
});