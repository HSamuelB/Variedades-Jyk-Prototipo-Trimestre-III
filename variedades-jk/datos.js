/* ==========================================
   VARIEDADES J&K - Datos compartidos
   ========================================== */

const DATOS_SEMILLA = {
    usuarios: [
        { id: 1, nombre: 'Karen Gómez',  usuario: 'Maria',    password: '1234', rol: 'Administradora', turno: 'Turno mañana' },
        { id: 2, nombre: 'Carlos López', usuario: 'Empleado', password: 'abcd', rol: 'Vendedor',        turno: 'Turno tarde'  }
    ],
    productos: [
        { id: 'P-001', nombre: 'Arroz Diana 500g',    categoria: 'Abarrotes', precio: 3200, costo: 2400, stock: 45, stockMinimo: 10, proveedor: 'Distribuidora La Economía', imagen: '../imgProductos/arrozDiana.jpg', vencimiento: '2027-03-15' },
        { id: 'P-002', nombre: 'Coca-Cola 400ml',     categoria: 'Bebidas',   precio: 2500, costo: 1800, stock: 8,  stockMinimo: 10, proveedor: 'Bebidas Andinas',          imagen: '../imgProductos/cocaCola.jpg', vencimiento: '2026-12-01' },
        { id: 'P-003', nombre: 'Jabón Rey 300g',      categoria: 'Aseo',      precio: 2200, costo: 1500, stock: 30, stockMinimo: 8,  proveedor: 'Aseo Total',               imagen: '../imgProductos/jabonRey.jpg', vencimiento: '2027-06-20' },
        { id: 'P-004', nombre: 'Papas Margarita',     categoria: 'Snacks',    precio: 2000, costo: 1300, stock: 5,  stockMinimo: 10, proveedor: 'Alimentos del Valle',      imagen: '../imgProductos/papas.jpg', vencimiento: '2026-11-10' },
        { id: 'P-005', nombre: 'Leche Alquería 1L',   categoria: 'Lácteos',   precio: 4300, costo: 3200, stock: 20, stockMinimo: 8,  proveedor: 'Distribuidora La Economía', imagen: '../imgProductos/lecheAlqueria.jpg', vencimiento: '2026-10-05' },
        { id: 'P-006', nombre: 'Chocoramo',           categoria: 'Snacks',    precio: 1500, costo: 900,  stock: 60, stockMinimo: 15, proveedor: 'Alimentos del Valle',      imagen: '../imgProductos/chocorramo.jpg', vencimiento: '2026-12-30' },
        { id: 'P-007', nombre: 'Queso campesino 250g',categoria: 'Lácteos',   precio: 9800, costo: 7500, stock: 12, stockMinimo: 5,  proveedor: 'Distribuidora La Economía', imagen: '../imgProductos/quesoCampesino.jpg', vencimiento: '2026-10-20' },
        { id: 'P-008', nombre: 'Agua Cristal 600ml',  categoria: 'Bebidas',   precio: 1800, costo: 1100, stock: 40, stockMinimo: 12, proveedor: 'Bebidas Andinas',          imagen: '../imgProductos/aguaCristal.jpg', vencimiento: '2027-01-15' },
        { id: 'P-009', nombre: 'Detergente Fab 900g', categoria: 'Aseo',      precio: 12500,costo: 9800, stock: 3,  stockMinimo: 6,  proveedor: 'Aseo Total',               imagen: '../imgProductos/detergenteFab.jpg', vencimiento: '2026-09-28' }
    ]
};

/* --- Inicializar localStorage --- */
function inicializarDatos() {
    if (!localStorage.getItem('jk_productos')) {
        localStorage.setItem('jk_productos', JSON.stringify(DATOS_SEMILLA.productos));
    }
    if (!localStorage.getItem('jk_usuarios')) {
        localStorage.setItem('jk_usuarios', JSON.stringify(DATOS_SEMILLA.usuarios));
    }
    if (!localStorage.getItem('jk_ventas')) {
        localStorage.setItem('jk_ventas', JSON.stringify(generarVentasSemilla()));
    }
}

/* --- Generador de ventas de los últimos 7 días (para que el dashboard tenga datos) --- */
function generarVentasSemilla() {
    const productos = DATOS_SEMILLA.productos;
    const ventas = [];
    const hoy = new Date();

    // Total objetivo de ventas por día (Lun → Dom)
    // Distribución pensada para que se vean los 3 colores del gráfico:
    //   < 150.000       → rojo
    //   150.000 - 400.000 → amarillo
    //   > 400.000       → verde
    const objetivosPorDia = [
        380000,   // Lun → amarillo
        95000,    // Mar → rojo
        280000,   // Mié → amarillo
        520000,   // Jue → verde
        120000,   // Vie → rojo
        610000,   // Sáb → verde
        185000    // Dom → amarillo
    ];

    let contador = 1;

    for (let i = 0; i < 7; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - (6 - i));

        const objetivo = objetivosPorDia[i];
        let acumulado = 0;

        // Generar transacciones hasta alcanzar el total objetivo del día
        while (acumulado < objetivo) {
            const prod = productos[Math.floor(Math.random() * productos.length)];
            const cant = 1 + Math.floor(Math.random() * 4);   // 1 a 4 unidades
            const subtotal = prod.precio * cant;

            // Si ya casi llegamos al objetivo, paramos
            if (acumulado > 0 && acumulado + subtotal > objetivo * 1.08) break;

            const hora = 8 + Math.floor(Math.random() * 13);  // 8am a 8pm
            const min  = Math.floor(Math.random() * 60);
            const fechaTx = new Date(fecha);
            fechaTx.setHours(hora, min, 0, 0);

            ventas.push({
                id: 'V-' + String(contador).padStart(4, '0'),
                fecha: fechaTx.toISOString(),
                productoId: prod.id,
                productoNombre: prod.nombre,
                cantidad: cant,
                precioUnitario: prod.precio,
                costoUnitario: prod.costo,
                metodoPago: ['Efectivo', 'Nequi', 'PSE'][Math.floor(Math.random() * 3)],
                total: subtotal
            });
            contador++;
            acumulado += subtotal;
        }
    }
    return ventas;
}

/* --- Helpers de localStorage --- */
const getProductos     = () => JSON.parse(localStorage.getItem('jk_productos')) || [];
const setProductos     = (arr) => localStorage.setItem('jk_productos', JSON.stringify(arr));

const getUsuarios      = () => JSON.parse(localStorage.getItem('jk_usuarios')) || [];
const setUsuarios      = (arr) => localStorage.setItem('jk_usuarios', JSON.stringify(arr));

const getVentas        = () => JSON.parse(localStorage.getItem('jk_ventas')) || [];
const setVentas        = (arr) => localStorage.setItem('jk_ventas', JSON.stringify(arr));

/* --- Sesión --- */
const getUsuarioActual = () => JSON.parse(localStorage.getItem('jk_usuario_actual')) || null;
const setUsuarioActual = (u)  => localStorage.setItem('jk_usuario_actual', JSON.stringify(u));
const esAdmin          = () => {
    const u = getUsuarioActual();
    return u && u.rol && u.rol.toLowerCase().includes('admin');
};

/* --- Utilidades --- */
const formatoCOP = (n) => '$' + Number(n).toLocaleString('es-CO');

const fechaCorta = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

function cerrarSesion() {
    localStorage.removeItem('jk_usuario_actual');
    window.location.href = '../login/index.html';
}

/* --- Protección de páginas --- */
function protegerPagina() {
    const u = getUsuarioActual();
    if (!u) { window.location.href = '../login/index.html'; return null; }
    return u;
}

/* --- Pintar sidebar activo --- */
function marcarActivo() {
    const ruta = window.location.pathname.split('/').slice(-2, -1)[0];
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.includes(ruta)) a.classList.add('activo');
    });
}

/* --- Ocultar elementos solo-admin si no es admin --- */
function aplicarPermisos() {
    if (!esAdmin()) {
        document.querySelectorAll('[data-solo-admin]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.sidebar-nav a[data-solo-admin]').forEach(el => el.remove());
    }
}

/* --- Inicializar al cargar cualquier página --- */
inicializarDatos();