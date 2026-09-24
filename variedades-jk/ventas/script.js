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
    let carrito = [];  // [{ id, nombre, precio, cantidad }]
    let metodoPago = null;

    // Chips
    document.getElementById('chipsVentas').innerHTML = CATEGORIAS.map(c =>
        `<button class="chip ${c === 'Todos' ? 'activo' : ''}" data-cat="${c}">${c}</button>`
    ).join('');

    document.getElementById('chipsVentas').addEventListener('click', (e) => {
        if (!e.target.classList.contains('chip')) return;
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('activo'));
        e.target.classList.add('activo');
        categoriaActiva = e.target.dataset.cat;
        pintarProductos();
    });

    document.getElementById('buscarVenta').addEventListener('input', (e) => {
        busqueda = e.target.value.toLowerCase();
        pintarProductos();
    });

    function pintarProductos() {
        const productos = getProductos().filter(p => p.stock > 0);
        const filtrados = productos.filter(p => {
            const cCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
            const cBusq = p.nombre.toLowerCase().includes(busqueda) || p.id.toLowerCase().includes(busqueda);
            return cCat && cBusq;
        });

        const grid = document.getElementById('gridProductos');
        if (!filtrados.length) {
            grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--texto-suave)">Sin productos que mostrar</p>';
            return;
        }

        grid.innerHTML = filtrados.map(p => {
            const img = p.imagen ? `<img src="${p.imagen}">` : '📦';
            const claseStock = p.stock <= p.stockMinimo ? 'badge-amarillo' : 'badge-verde';
            return `
                <div class="tarjeta-producto" onclick="agregarAlCarrito('${p.id}')">
                    <div class="imagen">${img}</div>
                    <p class="nombre">${p.nombre} <span class="badge ${claseStock} stock-mini">${p.stock} uds</span></p>
                    <p class="categoria">${p.categoria}</p>
                    <p class="precio">${formatoCOP(p.precio)}</p>
                </div>
            `;
        }).join('');
    }

    // ==================== CARRITO ====================
    window.agregarAlCarrito = (id) => {
        const productos = getProductos();
        const prod = productos.find(p => p.id === id);
        if (!prod) return;

        const enCarrito = carrito.find(i => i.id === id);
        if (enCarrito) {
            if (enCarrito.cantidad >= prod.stock) { alert('No hay más stock disponible'); return; }
            enCarrito.cantidad++;
        } else {
            carrito.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 });
        }
        pintarCarrito();
    };

    function pintarCarrito() {
        const cont = document.getElementById('carritoItems');
        const pago = document.getElementById('carritoPago');

        if (!carrito.length) {
            cont.innerHTML = '<p class="carrito-vacio">El carrito está vacío <i class="fa-solid fa-cart-shopping" style="color: rgb(0, 0, 0);"></i></p>';
            pago.style.display = 'none';
        } else {
            pago.style.display = 'block';
            cont.innerHTML = carrito.map(i => `
                <div class="item-carrito">
                    <div class="fila-top">
                        <div>
                            <p class="nombre">${i.nombre}</p>
                            <p class="precio-unit">${formatoCOP(i.precio)} c/u</p>
                        </div>
                        <button class="quitar" onclick="quitarDelCarrito('${i.id}')">✕</button>
                    </div>
                    <div class="controles">
                        <div class="qty">
                            <button onclick="cambiarCantidad('${i.id}', -1)">−</button>
                            <span>${i.cantidad}</span>
                            <button onclick="cambiarCantidad('${i.id}', 1)">+</button>
                        </div>
                        <span class="subtotal">${formatoCOP(i.precio * i.cantidad)}</span>
                    </div>
                </div>
            `).join('');
        }

        const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
        document.getElementById('totalCarrito').textContent = formatoCOP(total);
        calcularCambio();
    }

    window.quitarDelCarrito = (id) => {
        carrito = carrito.filter(i => i.id !== id);
        pintarCarrito();
    };

    window.cambiarCantidad = (id, delta) => {
        const item = carrito.find(i => i.id === id);
        if (!item) return;
        const prod = getProductos().find(p => p.id === id);
        const nueva = item.cantidad + delta;
        if (nueva <= 0) { quitarDelCarrito(id); return; }
        if (prod && nueva > prod.stock) { alert('No hay más stock disponible'); return; }
        item.cantidad = nueva;
        pintarCarrito();
    };

    // Método de pago
    document.querySelectorAll('.metodo').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.metodo').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            metodoPago = btn.dataset.metodo;
            document.getElementById('pagoEfectivo').style.display = metodoPago === 'Efectivo' ? 'block' : 'none';
        });
    });

    document.getElementById('recibido').addEventListener('input', calcularCambio);

    function calcularCambio() {
        const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
        const recibido = Number(document.getElementById('recibido').value) || 0;
        const cambio = Math.max(0, recibido - total);
        document.getElementById('cambio').textContent = formatoCOP(cambio);
    }

    // Finalizar venta
    document.getElementById('btnFinalizar').addEventListener('click', () => {
        if (!carrito.length) { alert('El carrito está vacío'); return; }
        if (!metodoPago) { alert('Selecciona un método de pago'); return; }

        const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
        if (metodoPago === 'Efectivo') {
            const recibido = Number(document.getElementById('recibido').value) || 0;
            if (recibido < total) { alert('El efectivo recibido es menor al total'); return; }
        }

        // Guardar venta
        const ventas = getVentas();
        const productos = getProductos();
        const fecha = new Date().toISOString();
        let cont = ventas.length + 1;

        carrito.forEach(item => {
            const prod = productos.find(p => p.id === item.id);
            ventas.push({
                id: 'V-' + String(cont).padStart(4, '0'),
                fecha,
                productoId: item.id,
                productoNombre: item.nombre,
                cantidad: item.cantidad,
                precioUnitario: item.precio,
                costoUnitario: prod ? prod.costo : 0,
                metodoPago,
                total: item.precio * item.cantidad
            });
            cont++;

            // Descontar stock
            if (prod) prod.stock -= item.cantidad;
        });

        setVentas(ventas);
        setProductos(productos);

        alert(`✅ Venta registrada con éxito\nTotal: ${formatoCOP(total)}\nMétodo: ${metodoPago}`);
        carrito = [];
        metodoPago = null;
        document.querySelectorAll('.metodo').forEach(b => b.classList.remove('activo'));
        document.getElementById('recibido').value = 0;
        document.getElementById('pagoEfectivo').style.display = 'none';
        pintarCarrito();
        pintarProductos();
    });

    document.getElementById('btnVaciar').addEventListener('click', () => {
        if (!carrito.length) return;
        if (!confirm('¿Vaciar el carrito?')) return;
        carrito = [];
        pintarCarrito();
    });

    pintarProductos();
    pintarCarrito();
});