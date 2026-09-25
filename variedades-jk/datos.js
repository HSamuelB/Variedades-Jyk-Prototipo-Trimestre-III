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
    ],

        proveedores: [
        { id: 1, nombre: 'Distribuidora La Economía', contacto: 'Luis Pérez',   telefono: '300 123 4567', categorias: ['Abarrotes', 'Lácteos', 'Papelería'] },
        { id: 2, nombre: 'Bebidas Andinas',           contacto: 'Marcela Ruiz',  telefono: '300 987 6543', categorias: ['Bebidas'] },
        { id: 3, nombre: 'Alimentos del Valle',       contacto: 'Jorge Salas',   telefono: '301 222 3344', categorias: ['Snacks'] },
        { id: 4, nombre: 'Aseo Total',                contacto: 'Diana Gómez',   telefono: '302 555 6677', categorias: ['Aseo'] }
    ],
    sugeridos: [
        {
            id: 'S-001',
            proveedor: 'Bebidas Andinas',
            fecha: new Date(Date.now() - 2 * 86400000).toISOString(),
            items: [
                { productoId: 'P-002', cantidad: 30 },
                { productoId: 'P-008', cantidad: 40 }
            ],
            estado: 'esperando'
        }
    ],
    ingresos: [
        {
            id: 'I-001',
            proveedor: 'Aseo Total',
            fecha: new Date(Date.now() - 4 * 86400000).toISOString(),
            items: [
                { productoId: 'P-003', cantidad: 25 },
                { productoId: 'P-009', cantidad: 20 }
            ],
            totalUnidades: 45
        },
        {
            id: 'I-002',
            proveedor: 'Alimentos del Valle',
            fecha: new Date(Date.now() - 6 * 86400000).toISOString(),
            items: [
                { productoId: 'P-006', cantidad: 60 }
            ],
            totalUnidades: 60,
            ingresoLibre: true
        }
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
    if (!localStorage.getItem('jk_proveedores')) localStorage.setItem('jk_proveedores', JSON.stringify(DATOS_SEMILLA.proveedores));
    if (!localStorage.getItem('jk_sugeridos'))   localStorage.setItem('jk_sugeridos',   JSON.stringify(DATOS_SEMILLA.sugeridos));
    if (!localStorage.getItem('jk_ingresos'))    localStorage.setItem('jk_ingresos',    JSON.stringify(DATOS_SEMILLA.ingresos));
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

const getProveedores = () => JSON.parse(localStorage.getItem('jk_proveedores')) || [];
const setProveedores = (arr) => localStorage.setItem('jk_proveedores', JSON.stringify(arr));

const getSugeridos = () => JSON.parse(localStorage.getItem('jk_sugeridos')) || [];
const setSugeridos = (arr) => localStorage.setItem('jk_sugeridos', JSON.stringify(arr));

const getIngresos = () => JSON.parse(localStorage.getItem('jk_ingresos')) || [];
const setIngresos = (arr) => localStorage.setItem('jk_ingresos', JSON.stringify(arr));

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

/* ============================================================
   MODALES GLOBALES (éxito, aviso, confirmación)
   Se inyectan dinámicamente en el <body> cuando carga la página
   ============================================================ */

function inyectarModales() {
    if (document.getElementById('modalAviso')) return; // ya existen

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <!-- MODAL Éxito -->
        <div class="modal-overlay" id="modalExito">
            <div class="modal modal-exito">
                <div class="exito-icono">✓</div>
                <h2 class="exito-titulo" id="exitoTitulo">¡Listo!</h2>
                <p class="exito-subtitulo" id="exitoSubtitulo">La operación se completó correctamente</p>
                <div class="exito-detalle" id="exitoDetalle"></div>
                <div class="form-acciones">
                    <button type="button" class="btn btn-blanco" onclick="cerrarModal('modalExito')">Cerrar</button>
                    <button type="button" class="btn btn-naranja" id="btnExitoAccion" style="display:none">Continuar</button>
                </div>
            </div>
        </div>

        <!-- MODAL Aviso -->
        <div class="modal-overlay" id="modalAviso">
            <div class="modal modal-aviso">
                <div class="aviso-icono" id="avisoIcono">⚠️</div>
                <h2 class="aviso-titulo" id="avisoTitulo">Atención</h2>
                <p class="aviso-mensaje" id="avisoMensaje">Mensaje</p>
                <div class="aviso-detalle" id="avisoDetalle" style="display:none">
                    <div class="aviso-fila"><span>Total</span><strong id="avisoTotal">$0</strong></div>
                    <div class="aviso-fila"><span>Efectivo recibido</span><strong id="avisoRecibido">$0</strong></div>
                    <div class="aviso-fila aviso-falta"><span>Falta por cubrir</span><strong id="avisoFalta">$0</strong></div>
                </div>
                <div class="form-acciones">
                    <button type="button" class="btn btn-naranja btn-full" onclick="cerrarModal('modalAviso')">Entendido</button>
                </div>
            </div>
        </div>

        <!-- MODAL Confirmación -->
        <div class="modal-overlay" id="modalConfirmar">
            <div class="modal modal-confirmar">
                <div class="confirmar-icono" id="confirmarIcono">🗑️</div>
                <h2 class="confirmar-titulo" id="confirmarTitulo">¿Estás segura?</h2>
                <p class="confirmar-mensaje" id="confirmarMensaje">Esta acción no se puede deshacer.</p>
                <div class="form-acciones">
                    <button type="button" class="btn btn-blanco" onclick="cerrarModal('modalConfirmar')">Cancelar</button>
                    <button type="button" class="btn btn-naranja" id="btnConfirmarAccion">Sí, continuar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(wrapper);
}

/* ============================================================
   FUNCIONES GLOBALES DE MODALES
   ============================================================ */

function cerrarModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('activo');
}

/**
 * Modal de éxito
 * @param {object} opciones
 * @param {string} opciones.titulo      - Título principal
 * @param {string} opciones.subtitulo   - Texto descriptivo
 * @param {Array}  opciones.detalle     - [{label, valor, color?}]
 * @param {object} opciones.accion      - { texto, callback } (opcional)
 */
function mostrarExito({ titulo = '¡Listo!', subtitulo = '', detalle = [], accion = null } = {}) {
    document.getElementById('exitoTitulo').textContent    = titulo;
    document.getElementById('exitoSubtitulo').textContent = subtitulo;

    const contDetalle = document.getElementById('exitoDetalle');
    if (detalle.length) {
        contDetalle.innerHTML = detalle.map(f => `
            <div class="exito-fila">
                <span>${f.label}</span>
                <strong style="${f.color ? `color:${f.color}` : ''}">${f.valor}</strong>
            </div>
        `).join('');
        contDetalle.style.display = 'block';
    } else {
        contDetalle.style.display = 'none';
    }

    const btnAccion = document.getElementById('btnExitoAccion');
    const btnNuevo  = btnAccion.cloneNode(true);
    btnAccion.parentNode.replaceChild(btnNuevo, btnAccion);

    if (accion && typeof accion.callback === 'function') {
        btnNuevo.textContent = accion.texto || 'Continuar';
        btnNuevo.style.display = 'inline-flex';
        btnNuevo.addEventListener('click', () => {
            cerrarModal('modalExito');
            accion.callback();
        });
    } else {
        btnNuevo.style.display = 'none';
    }

    document.getElementById('modalExito').classList.add('activo');
}

/**
 * Modal de aviso (informativo)
 * @param {string} titulo
 * @param {string} mensaje
 * @param {object} detalle - { total, recibido, falta } (opcional)
 */
function mostrarAviso(titulo, mensaje, detalle = null) {
    document.getElementById('avisoTitulo').textContent  = titulo;
    document.getElementById('avisoMensaje').textContent = mensaje;

    const contDetalle = document.getElementById('avisoDetalle');
    if (detalle) {
        document.getElementById('avisoTotal').textContent    = formatoCOP(detalle.total);
        document.getElementById('avisoRecibido').textContent = formatoCOP(detalle.recibido);
        document.getElementById('avisoFalta').textContent    = formatoCOP(detalle.falta);
        contDetalle.style.display = 'block';
    } else {
        contDetalle.style.display = 'none';
    }

    document.getElementById('modalAviso').classList.add('activo');
}

/**
 * Modal de confirmación con 2 botones
 * @param {string}   titulo
 * @param {string}   mensaje
 * @param {function} onConfirm - callback al aceptar
 */
function mostrarConfirmacion(titulo, mensaje, onConfirm) {
    document.getElementById('confirmarTitulo').textContent  = titulo;
    document.getElementById('confirmarMensaje').textContent = mensaje;

    const btnConfirmar = document.getElementById('btnConfirmarAccion');
    const nuevoBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);

    nuevoBtn.addEventListener('click', () => {
        cerrarModal('modalConfirmar');
        if (typeof onConfirm === 'function') onConfirm();
    });

    document.getElementById('modalConfirmar').classList.add('activo');
}

/* --- Inyectar los modales al cargar el body --- */
if (document.body) {
    inyectarModales();
} else {
    document.addEventListener('DOMContentLoaded', inyectarModales);
}