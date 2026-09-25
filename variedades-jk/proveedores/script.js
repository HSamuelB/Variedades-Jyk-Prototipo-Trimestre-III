document.addEventListener('DOMContentLoaded', () => {
    const usuario = protegerPagina();
    if (!usuario) return;
    marcarActivo();
    aplicarPermisos();

    document.getElementById('avatarInicial').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol + ' · ' + (usuario.turno || '');

    // ============ TABS ============
    document.querySelectorAll('.tab-principal').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.tab-principal').forEach(x => x.classList.remove('activo'));
            document.querySelectorAll('.tab-contenido').forEach(x => x.classList.remove('activo'));
            t.classList.add('activo');
            document.getElementById('tab-' + t.dataset.tab).classList.add('activo');
        });
    });

    // ============ PRODUCTOS BAJOS POR PROVEEDOR ============
    function productosBajosDe(proveedorNombre) {
        return getProductos().filter(p => p.proveedor === proveedorNombre && p.stock <= p.stockMinimo);
    }

    // ============ PINTAR PROVEEDORES ============
    function pintarProveedores() {
        const grid = document.getElementById('gridProveedores');
        const proveedores = getProveedores();

        if (!proveedores.length) {
            grid.innerHTML = '<p style="text-align:center;padding:40px;color:var(--ink-soft)">Aún no hay proveedores registrados.</p>';
            return;
        }

        grid.innerHTML = proveedores.map(pv => {
            const bajos = productosBajosDe(pv.nombre);
            const estadoHTML = bajos.length
                ? `<div class="proveedor-estado alerta">
                       <i class="fa-solid fa-triangle-exclamation"></i>
                       <div>
                           <strong>${bajos.length} producto(s) en nivel bajo</strong>
                           <p>Prepara el sugerido antes de su próxima visita</p>
                       </div>
                   </div>`
                : `<div class="proveedor-estado ok">
                       <i class="fa-solid fa-circle-check"></i>
                       <div>
                           <strong>Todo en buen nivel</strong>
                           <p>Nada urgente para pedirle por ahora</p>
                       </div>
                   </div>`;

            const chips = pv.categorias.map(c => `<span class="chip-cat">${c}</span>`).join('');

            return `
                <div class="tarjeta-proveedor">
                    <div class="proveedor-top">
                        <div>
                            <h3>${pv.nombre}</h3>
                            <p class="proveedor-contacto">
                                <i class="fa-solid fa-user"></i> ${pv.contacto} · ${pv.telefono}
                            </p>
                        </div>
                        <div class="proveedor-icono">
                            <i class="fa-solid fa-truck"></i>
                        </div>
                    </div>
                    <div class="proveedor-categorias">${chips}</div>
                    ${estadoHTML}
                    <div class="proveedor-acciones">
                        <button class="btn-ver-sugerido" onclick="abrirSugerido('${pv.nombre.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-clipboard-list"></i> Ver sugerido
                        </button>
                        <button class="btn-icono" title="Editar" onclick="editarProveedor(${pv.id})"><i class="fa-solid fa-pencil"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============ MODAL SUGERIDO ============
    let sugeridoProveedorActual = null;

    window.abrirSugerido = (proveedorNombre) => {
        sugeridoProveedorActual = proveedorNombre;
        document.getElementById('sugeridoTitulo').textContent = 'Sugerido para ' + proveedorNombre;

        const bajos = productosBajosDe(proveedorNombre);
        const lista = document.getElementById('sugeridoLista');

        if (!bajos.length) {
            lista.innerHTML = '<p style="text-align:center;padding:30px;color:var(--ink-soft)">No hay productos en nivel bajo de este proveedor.</p>';
        } else {
            lista.innerHTML = bajos.map(p => {
                const sugerido = Math.max(p.stockMinimo * 2 - p.stock, 10);
                return `
                    <div class="fila-producto">
                        <input type="checkbox" checked data-id="${p.id}">
                        <div class="info-prod">
                            <strong>${p.nombre}</strong>
                            <small>Stock: ${p.stock} · Mínimo: ${p.stockMinimo}</small>
                        </div>
                        <div class="cant-wrap">
                            <span>Pedir</span>
                            <input type="number" min="0" value="${sugerido}" data-cant="${p.id}">
                        </div>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('modalSugerido').classList.add('activo');
    };

    document.getElementById('btnGuardarSugerido').addEventListener('click', () => {
        if (!sugeridoProveedorActual) return;

        const items = [];
        document.querySelectorAll('#sugeridoLista .fila-producto').forEach(fila => {
            const chk = fila.querySelector('input[type="checkbox"]');
            const inp = fila.querySelector('input[type="number"]');
            if (chk.checked && Number(inp.value) > 0) {
                items.push({ productoId: chk.dataset.id, cantidad: Number(inp.value) });
            }
        });

        if (!items.length) {
            mostrarAviso('Sin productos seleccionados', 'Marca al menos un producto y define la cantidad a pedir.');
            return;
        }

        const sugeridos = getSugeridos();
        // Reemplaza si ya existe uno esperando para este proveedor
        const idxExistente = sugeridos.findIndex(s => s.proveedor === sugeridoProveedorActual && s.estado === 'esperando');
        const nuevo = {
            id: 'S-' + String(sugeridos.length + 1).padStart(3, '0'),
            proveedor: sugeridoProveedorActual,
            fecha: new Date().toISOString(),
            items,
            estado: 'esperando'
        };
        if (idxExistente >= 0) sugeridos[idxExistente] = nuevo;
        else sugeridos.push(nuevo);

        setSugeridos(sugeridos);
        cerrarModal('modalSugerido');
        mostrarExito({
            titulo: '¡Sugerido guardado!',
            subtitulo: `Se guardó la lista para ${sugeridoProveedorActual}`,
            detalle: [
                { label: 'Productos', valor: items.length },
                { label: 'Unidades totales', valor: items.reduce((s, i) => s + i.cantidad, 0) }
            ]
        });
        pintarMercancia();
    });

    // ============ MODAL INGRESO ============
    let ingresoProveedorActual = null;
    let ingresoSugeridoId = null;

    function cargarSelectProveedores() {
        const sel = document.getElementById('ingresoProveedor');
        sel.innerHTML = '<option value="">— Selecciona un proveedor —</option>' +
            getProveedores().map(p => `<option value="${p.nombre}">${p.nombre}</option>`).join('');
    }

    function cargarProductosIngreso(proveedorNombre) {
        const productos = getProductos().filter(p => p.proveedor === proveedorNombre);
        const lista = document.getElementById('ingresoLista');
        if (!productos.length) {
            lista.innerHTML = '<p style="text-align:center;padding:30px;color:var(--ink-soft)">Este proveedor no tiene productos registrados.</p>';
            return;
        }
        lista.innerHTML = productos.map(p => `
            <div class="fila-producto">
                <div class="info-prod">
                    <strong>${p.nombre}</strong>
                    <small>Stock actual: ${p.stock}</small>
                </div>
                <div class="cant-wrap">
                    <input type="number" min="0" value="0" data-ingreso="${p.id}">
                </div>
            </div>
        `).join('');
    }

    document.getElementById('ingresoProveedor').addEventListener('change', (e) => {
        if (e.target.value) cargarProductosIngreso(e.target.value);
        else document.getElementById('ingresoLista').innerHTML = '';
    });

    window.abrirIngreso = (proveedorNombre = '', sugeridoId = null) => {
        ingresoProveedorActual = proveedorNombre;
        ingresoSugeridoId = sugeridoId;
        cargarSelectProveedores();
        const sel = document.getElementById('ingresoProveedor');
        sel.value = proveedorNombre || '';
        document.getElementById('ingresoLista').innerHTML = '';
        if (proveedorNombre) cargarProductosIngreso(proveedorNombre);
        document.getElementById('modalIngreso').classList.add('activo');
    };

    document.getElementById('btnRegistrarIngreso').addEventListener('click', () => {
        window.abrirIngreso('');
    });

    document.getElementById('btnRegistrarIngresoOk').addEventListener('click', () => {
        const prov = document.getElementById('ingresoProveedor').value;
        if (!prov) { mostrarAviso('Falta el proveedor', 'Selecciona el proveedor que entregó la mercancía.'); return; }

        const items = [];
        document.querySelectorAll('#ingresoLista input[data-ingreso]').forEach(inp => {
            const cant = Number(inp.value);
            if (cant > 0) items.push({ productoId: inp.dataset.ingreso, cantidad: cant });
        });

        if (!items.length) { mostrarAviso('Sin cantidades', 'Ingresa al menos una cantidad mayor a 0.'); return; }

        // Sumar al stock
        const productos = getProductos();
        items.forEach(it => {
            const prod = productos.find(p => p.id === it.productoId);
            if (prod) prod.stock += it.cantidad;
        });
        setProductos(productos);

        // Guardar ingreso
        const ingresos = getIngresos();
        ingresos.push({
            id: 'I-' + String(ingresos.length + 1).padStart(3, '0'),
            proveedor: prov,
            fecha: new Date().toISOString(),
            items,
            totalUnidades: items.reduce((s, i) => s + i.cantidad, 0)
        });
        setIngresos(ingresos);

        // Marcar sugerido como recibido
        if (ingresoSugeridoId) {
            const sugs = getSugeridos();
            const s = sugs.find(x => x.id === ingresoSugeridoId);
            if (s) s.estado = 'recibido';
            setSugeridos(sugs);
        } else {
            // Marcar cualquier sugerido pendiente del mismo proveedor
            const sugs = getSugeridos();
            sugs.forEach(s => { if (s.proveedor === prov && s.estado === 'esperando') s.estado = 'recibido'; });
            setSugeridos(sugs);
        }

        cerrarModal('modalIngreso');
        pintarMercancia();
        pintarProveedores();
        mostrarExito({
            titulo: '¡Ingreso registrado!',
            subtitulo: `Mercancía de ${prov} sumada al inventario`,
            detalle: [
                { label: 'Productos', valor: items.length },
                { label: 'Unidades totales', valor: items.reduce((s, i) => s + i.cantidad, 0) }
            ]
        });
    });

    // ============ PINTAR MERCANCÍA ============
    function pintarMercancia() {
        const sugeridos = getSugeridos().filter(s => s.estado === 'esperando');
        const contSug = document.getElementById('listaSugeridos');

        if (!sugeridos.length) {
            contSug.innerHTML = '<p style="padding:20px;color:var(--ink-soft);font-size:13px;text-align:center;background:#fff;border:1px dashed var(--border);border-radius:12px;">No hay sugeridos pendientes de entrega.</p>';
        } else {
            contSug.innerHTML = sugeridos.map(s => {
                const fecha = new Date(s.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                const total = s.items.reduce((a, i) => a + i.cantidad, 0);
                return `
                    <div class="tarjeta-item-mercancia">
                        <div class="item-mercancia-icono esperando">
                            <i class="fa-solid fa-hourglass-half"></i>
                        </div>
                        <div class="item-mercancia-info">
                            <h4>${s.proveedor}</h4>
                            <p>Sugerido del ${fecha} · ${s.items.length} producto(s) · ${total} unidades por confirmar</p>
                        </div>
                        <span class="badge-esperando">Esperando entrega</span>
                        <button class="btn-registrar-ingreso" onclick="abrirIngreso('${s.proveedor.replace(/'/g, "\\'")}', '${s.id}')">
                            <i class="fa-solid fa-cash-register"></i> Registrar ingreso
                        </button>
                    </div>
                `;
            }).join('');
        }

        const ingresos = getIngresos().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const contHist = document.getElementById('listaHistorial');
        if (!ingresos.length) {
            contHist.innerHTML = '<p style="padding:20px;color:var(--ink-soft);font-size:13px;text-align:center;background:#fff;border:1px dashed var(--border);border-radius:12px;">Aún no hay ingresos registrados.</p>';
        } else {
            contHist.innerHTML = ingresos.map(i => {
                const fecha = new Date(i.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                const extra = i.ingresoLibre ? ' · ingreso libre' : '';
                return `
                    <div class="tarjeta-item-mercancia">
                        <div class="item-mercancia-icono recibido">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <div class="item-mercancia-info">
                            <h4>${i.proveedor}</h4>
                            <p>${fecha} · ${i.items.length} producto(s) · ${i.totalUnidades} unidades ingresadas${extra}</p>
                        </div>
                        <span class="badge-recibido">Recibido</span>
                    </div>
                `;
            }).join('');
        }
    }

    // ============ CATEGORÍAS DISPONIBLES ============
    const CATEGORIAS_DISPONIBLES = ['Abarrotes', 'Bebidas', 'Snacks', 'Lácteos', 'Aseo', 'Papelería'];

    function pintarCategoriasCheck(seleccionadas = []) {
        document.getElementById('categoriasCheck').innerHTML = CATEGORIAS_DISPONIBLES.map(cat => `
            <label class="categoria-check">
                <input type="checkbox" value="${cat}" ${seleccionadas.includes(cat) ? 'checked' : ''}>
                ${cat}
            </label>
        `).join('');
    }

    // ============ MODAL PROVEEDOR (Nuevo / Editar) ============
    const modalProv = document.getElementById('modalProveedor');
    const formProv = document.getElementById('formProveedor');

    document.getElementById('btnNuevoProveedor').addEventListener('click', () => {
        document.getElementById('tituloModalProveedor').textContent = 'Nuevo proveedor';
        formProv.reset();
        document.getElementById('provId').value = '';
        pintarCategoriasCheck([]);
        modalProv.classList.add('activo');
    });

    window.editarProveedor = (id) => {
        const pv = getProveedores().find(p => p.id === id);
        if (!pv) return;

        document.getElementById('tituloModalProveedor').textContent = 'Editar proveedor';
        document.getElementById('provId').value = pv.id;
        document.getElementById('provNombre').value = pv.nombre;
        document.getElementById('provContacto').value = pv.contacto;
        document.getElementById('provTelefono').value = pv.telefono;
        pintarCategoriasCheck(pv.categorias);
        modalProv.classList.add('activo');
    };

    formProv.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('provId').value;
        const categorias = Array.from(document.querySelectorAll('#categoriasCheck input:checked')).map(c => c.value);

        if (!categorias.length) {
            mostrarAviso('Falta categoría', 'Selecciona al menos una categoría que maneje el proveedor.');
            return;
        }

        const datos = {
            id: id ? Number(id) : (getProveedores().length ? Math.max(...getProveedores().map(p => p.id)) + 1 : 1),
            nombre: document.getElementById('provNombre').value.trim(),
            contacto: document.getElementById('provContacto').value.trim(),
            telefono: document.getElementById('provTelefono').value.trim(),
            categorias
        };

        const proveedores = getProveedores();
        const idx = proveedores.findIndex(p => p.id === datos.id);

        if (idx >= 0) proveedores[idx] = datos;
        else proveedores.push(datos);

        setProveedores(proveedores);
        cerrarModal('modalProveedor');
        pintarProveedores();

        mostrarExito({
            titulo: id ? '¡Proveedor actualizado!' : '¡Proveedor creado!',
            subtitulo: `${datos.nombre} · ${datos.contacto}`,
            detalle: [
                { label: 'Teléfono', valor: datos.telefono },
                { label: 'Categorías', valor: categorias.join(', ') }
            ]
        });
    });

    // ============ AUTO-COMPLETAR PROVEEDORES EN PRODUCTOS ============
    // Si un producto tiene un proveedor que no existe en la lista, lo agregamos
    // (esto mantiene la coherencia entre ambos módulos)
    (function sincronizarProveedores() {
        const productos = getProductos();
        const proveedores = getProveedores();
        const nombresExistentes = new Set(proveedores.map(p => p.nombre));
        const faltantes = [...new Set(productos.map(p => p.proveedor))].filter(n => n && !nombresExistentes.has(n));

        if (!faltantes.length) return;
        let cont = proveedores.length;
        faltantes.forEach(nombre => {
            cont++;
            proveedores.push({
                id: cont,
                nombre,
                contacto: 'Sin contacto',
                telefono: '—',
                categorias: [...new Set(productos.filter(p => p.proveedor === nombre).map(p => p.categoria))]
            });
        });
        setProveedores(proveedores);
    })();

    // ============ ABRIR SUGERIDO POR URL ============
    const params = new URLSearchParams(window.location.search);
    const sugeridoParam = params.get('sugerido');
    if (sugeridoParam) {
        // Esperar a que se pinten los datos
        setTimeout(() => window.abrirSugerido(sugeridoParam), 100);
    }

    pintarProveedores();
    pintarMercancia();
});