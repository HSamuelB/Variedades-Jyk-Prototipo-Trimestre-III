document.addEventListener('DOMContentLoaded', () => {
    const usuario = protegerPagina();
    if (!usuario) return;
    marcarActivo();
    aplicarPermisos();

    document.getElementById('avatarInicial').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol + ' · ' + (usuario.turno || '');

    const CATEGORIAS = ['Todos', 'Abarrotes', 'Bebidas', 'Snacks', 'Lácteos', 'Aseo', 'Papelería'];
    let categoriaActiva = 'Todos';
    let busqueda = '';

    // Chips
    const chips = document.getElementById('chipsCategorias');
    chips.innerHTML = CATEGORIAS.map(c =>
        `<button class="chip ${c === 'Todos' ? 'activo' : ''}" data-cat="${c}">${c}</button>`
    ).join('');

    chips.addEventListener('click', (e) => {
        if (!e.target.classList.contains('chip')) return;
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('activo'));
        e.target.classList.add('activo');
        categoriaActiva = e.target.dataset.cat;
        pintarTabla();
    });

    document.getElementById('buscarProducto').addEventListener('input', (e) => {
        busqueda = e.target.value.toLowerCase();
        pintarTabla();
    });

    // ==================== Pintar tabla ====================
    function pintarTabla() {
        const admin = esAdmin();
        const productos = getProductos();

        const filtrados = productos.filter(p => {
            const coincideCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
            const coincideBusq = p.nombre.toLowerCase().includes(busqueda) || p.id.toLowerCase().includes(busqueda);
            return coincideCat && coincideBusq;
        });

        const cuerpo = document.getElementById('cuerpoTabla');
        if (!filtrados.length) {
            cuerpo.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--texto-suave)">Sin productos que mostrar</td></tr>`;
            return;
        }

        cuerpo.innerHTML = filtrados.map(p => {
            const imgContenido = p.imagen
                ? `<img src="${p.imagen}" alt="${p.nombre}">`
                : '📦';
            const claseBadge = p.stock === 0 ? 'badge-rojo' : (p.stock <= p.stockMinimo ? 'badge-amarillo' : 'badge-verde');
            const txtBadge = p.stock === 0 ? 'Agotado' : (p.stock <= p.stockMinimo ? `${p.stock} uds · bajo` : `${p.stock} uds`);

            return `
                <tr>
                    <td><strong>${p.id}</strong></td>
                    <td>
                        <div class="celda-producto">
                            <div class="mini-img">${imgContenido}</div>
                            <span class="nombre">${p.nombre}</span>
                        </div>
                    </td>
                    <td>${p.categoria}</td>
                    <td><strong>${formatoCOP(p.precio)}</strong></td>
                    ${admin ? `<td><strong>${formatoCOP(p.costo)}</strong></td>` : ''}
                    <td><span class="badge ${claseBadge}">${txtBadge}</span></td>
                    <td>${p.proveedor}</td>
                    <td>
                        <div class="celda-acciones">
                            <button class="icon-btn" title="Editar" onclick="editarProducto('${p.id}')">✏️</button>
                            <button class="icon-btn rojo" title="Eliminar" onclick="eliminarProducto('${p.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==================== Modal Producto ====================
    const modal = document.getElementById('modalProducto');
    const form = document.getElementById('formProducto');
    let imagenBase64 = '';

    document.getElementById('btnNuevo').addEventListener('click', () => {
        document.getElementById('tituloModal').textContent = 'Nuevo producto';
        form.reset();
        document.getElementById('prodId').value = '';
        imagenBase64 = '';
        modal.classList.add('activo');
    });

    document.getElementById('prodImagen').addEventListener('change', (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        if (archivo.size > 1024 * 1024) { alert('La imagen no puede superar 1MB'); e.target.value=''; return; }
        const reader = new FileReader();
        reader.onload = (ev) => { imagenBase64 = ev.target.result; };
        reader.readAsDataURL(archivo);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('prodId').value;
        const productos = getProductos();

        const data = {
            id: id || 'P-' + String(productos.length + 1).padStart(3, '0'),
            nombre: document.getElementById('prodNombre').value.trim(),
            categoria: document.getElementById('prodCategoria').value,
            precio: Number(document.getElementById('prodPrecio').value),
            costo: Number(document.getElementById('prodCosto').value) || 0,
            stock: Number(document.getElementById('prodStock').value),
            stockMinimo: Number(document.getElementById('prodStockMin').value),
            proveedor: document.getElementById('prodProveedor').value,
            vencimiento: document.getElementById('prodVencimiento').value,
            imagen: imagenBase64 || (id ? (productos.find(p => p.id === id)?.imagen || '') : '')
        };

        if (id) {
            const idx = productos.findIndex(p => p.id === id);
            productos[idx] = data;
        } else {
            productos.push(data);
        }

        setProductos(productos);
        cerrarModal('modalProducto');
        pintarTabla();
        form.reset();
        imagenBase64 = '';
    });

    // ==================== Editar / Eliminar ====================
    window.editarProducto = (id) => {
        const p = getProductos().find(x => x.id === id);
        if (!p) return;
        document.getElementById('tituloModal').textContent = 'Editar producto';
        document.getElementById('prodId').value = p.id;
        document.getElementById('prodNombre').value = p.nombre;
        document.getElementById('prodCategoria').value = p.categoria;
        document.getElementById('prodPrecio').value = p.precio;
        document.getElementById('prodCosto').value = p.costo || '';
        document.getElementById('prodStock').value = p.stock;
        document.getElementById('prodStockMin').value = p.stockMinimo;
        document.getElementById('prodProveedor').value = p.proveedor;
        document.getElementById('prodVencimiento').value = p.vencimiento || '';
        imagenBase64 = p.imagen || '';
        modal.classList.add('activo');
    };

    window.eliminarProducto = (id) => {
        const prod = getProductos().find(p => p.id === id);
        if (!prod) return;
        mostrarConfirmacion(
            '¿Eliminar producto?',
            `Se eliminará "${prod.nombre}" del catálogo. Esta acción no se puede deshacer.`,
            () => {
                setProductos(getProductos().filter(p => p.id !== id));
                pintarTabla();
            }
        );
    };

    // ==================== Modal Devolución ====================
    const modalDev = document.getElementById('modalDevolucion');
    const formDev = document.getElementById('formDevolucion');
    const selectDev = document.getElementById('devProducto');

    document.getElementById('btnDevolver').addEventListener('click', () => {
        const productos = getProductos();
        selectDev.innerHTML = productos.map(p => `<option value="${p.id}">${p.nombre} (stock: ${p.stock})</option>`).join('');
        modalDev.classList.add('activo');
    });

    formDev.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = selectDev.value;
        const cant = Number(document.getElementById('devCantidad').value);
        const productos = getProductos();
        const idx = productos.findIndex(p => p.id === id);
        if (idx === -1) return;

        if (productos[idx].stock < cant) {
            alert('No hay suficiente stock para devolver esa cantidad.');
            return;
        }
        productos[idx].stock -= cant;
        setProductos(productos);
        cerrarModal('modalDevolucion');
        pintarTabla();
        formDev.reset();
    });

    pintarTabla();
});

function cerrarModal(id) {
    document.getElementById(id).classList.remove('activo');
}