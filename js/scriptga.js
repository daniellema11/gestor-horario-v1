let calendar;
let calendarioEventos = [];

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendario');

    if (!calendarEl) {
        console.error("No se encontró el contenedor del calendario.");
        return;
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [],
        eventClick: function (info) {
            const [clase, profesorConParentesis] = info.event.title.split(" (");
            const profesor = profesorConParentesis.replace(")", "");
            const fecha = info.event.start.toLocaleDateString("es-CO", {
                weekday: "long", year: "numeric", month: "long", day: "numeric"
            });

            const horaInicio = info.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const horaFin = info.event.end ? info.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            document.getElementById("modalProfesor").textContent = profesor;
            document.getElementById("modalClase").textContent = clase;
            document.getElementById("modalUbicacion").textContent = info.event.extendedProps.ubicacion || '—';
            document.getElementById("modalHorario").textContent = `${horaInicio} a ${horaFin}`;
            document.getElementById("modalFecha").textContent = fecha;

            const modal = new bootstrap.Modal(document.getElementById("modalEvento"));
            modal.show();
        }
    });

    const diasSeleccionados = new Set();

    document.querySelectorAll('.dia-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dia = btn.getAttribute('data-dia');
            if (diasSeleccionados.has(dia)) {
                diasSeleccionados.delete(dia);
                btn.classList.remove('active');
            } else {
                diasSeleccionados.add(dia);
                btn.classList.add('active');
            }

            // Actualizar el campo oculto
            document.getElementById('recurrencia').value = Array.from(diasSeleccionados).join(',');
        });
    });


    calendar.render();

    const alertaClase = document.getElementById("alerta-clase");
    if (alertaClase) {
        alertaClase.style.display = "none"; // Oculta al cargar
    }

    const alertaAula = document.getElementById("alerta-aula");
    if (alertaAula) {
        alertaAula.style.display = "none";
    }


    cargarProfesoresIniciales();
});

// Lista de profesores iniciales
const profesores = [
    "Juan Pérez", "Ana Gómez", "Carlos Ramírez",
    "María Torres", "Luis Fernández", "Sofía Martínez", "Pedro Herrera"
];

// Agregar profesores iniciales
function cargarProfesoresIniciales() {
    const listaProfesores = document.getElementById("lista-profesores");
    const selectProfesores = document.getElementById('profesor');

    profesores.forEach(nombre => {
        agregarProfesorVisual(nombre);
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        selectProfesores.appendChild(option);
    });
}

// Añadir profesor al panel lateral como botón funcional
function agregarProfesorVisual(nombre) {
    const lista = document.getElementById('lista-profesores');
    const btn = document.createElement('div');
    btn.className = 'profesor-item';
    btn.textContent = nombre;
    btn.onclick = () => filtrarPorProfesor(nombre);
    lista.appendChild(btn);
}

// Filtrar eventos por profesor
function filtrarPorProfesor(nombre) {
    const eventosFiltrados = calendarioEventos.filter(ev => ev.title.includes(`(${nombre})`));
    calendar.getEvents().forEach(e => e.remove());

    if (eventosFiltrados.length === 0) {
        alert(`${nombre} no tiene clases asignadas.`);
    } else {
        eventosFiltrados.forEach(ev => calendar.addEvent(ev));
    }
}

// Formulario de agregar horario
document.getElementById('formulario-horario').addEventListener('submit', function (e) {
    e.preventDefault();

    const profesor = document.getElementById('profesor').value;
    const clase = document.getElementById('clase').value;
    const fecha = document.getElementById('fecha').value;
    const horaInicio = document.getElementById('horaInicio').value;
    const horaFin = document.getElementById('horaFin').value;
    const sede = document.getElementById('sede').value;
    const aula = document.getElementById('aula').value;
    const fechaInicioPeriodo = new Date(document.getElementById("periodoInicio").value);
    const fechaFinPeriodo = new Date(document.getElementById("periodoFin").value);

    // ✅ CAMBIO: lectura del campo oculto tipo texto
    const recurrencia = document.getElementById('recurrencia').value
        .split(',')
        .filter(Boolean)
        .map(d => parseInt(d));

    if (!profesor || !clase || !fecha || !horaInicio || !horaFin) {
        alert("Por favor completa todos los campos.");
        return;
    }

    if (recurrencia.length === 0) {
        alert("Selecciona al menos un día de recurrencia.");
        return;
    }

    recurrencia.forEach(dia => {
        let fechaEvento = new Date(fecha);
        let diasDiferencia = dia - fechaEvento.getDay();
        if (diasDiferencia < 0) diasDiferencia += 7;
        fechaEvento.setDate(fechaEvento.getDate() + diasDiferencia);

        while (fechaEvento <= fechaFinPeriodo) {
            if (fechaEvento >= fechaInicioPeriodo) {
                const startStr = `${fechaEvento.toISOString().split("T")[0]}T${horaInicio}`;
                const endStr = `${fechaEvento.toISOString().split("T")[0]}T${horaFin}`;

                const nuevoEvento = {
                    title: `${clase} (${profesor})`,
                    start: startStr,
                    end: endStr,
                    allDay: false,
                    extendedProps: {
                        ubicacion: `${sede} - Aula ${aula}`
                    }
                };

                calendar.addEvent(nuevoEvento);
                calendarioEventos.push(nuevoEvento);
            }
            fechaEvento.setDate(fechaEvento.getDate() + 7);
        }
    });

    alert("Horario agregado correctamente.");
    e.target.reset();

    // ✅ Limpieza visual de los botones de días seleccionados
    document.querySelectorAll('.dia-btn.active').forEach(btn => btn.classList.remove('active'));
    document.getElementById('recurrencia').value = '';
});


// Llenar selects
["Lógica de Programación", "Introducción a la Programacion", "Metodología Ágil"].forEach(c => {
    const option = document.createElement('option');
    option.value = c;
    option.textContent = c;
    document.getElementById('clase').appendChild(option);
});

["Bello", "Medellin", "Rionegro"].forEach(sede => {
    const option = document.createElement('option');
    option.value = sede;
    option.textContent = sede;
    document.getElementById('sede').appendChild(option);
});

["101", "102", "503", "507"].forEach(aula => {
    const option = document.createElement('option');
    option.value = aula;
    option.textContent = aula;
    document.getElementById('aula').appendChild(option);
});

// Formulario para crear nuevo profesor

document.getElementById('formProfesor').addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nombreProfesor').value.trim();
    if (!nombre) return;

    // Añadir a lista visual
    agregarProfesorVisual(nombre);

    // Añadir al select del formulario
    const select = document.getElementById('profesor');
    const nuevaOpcion = document.createElement('option');
    nuevaOpcion.value = nombre;
    nuevaOpcion.textContent = nombre;
    select.appendChild(nuevaOpcion);

    // Ocultar el modal
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCrearProfesor"));
    modal.hide();

    // Mostrar alerta con scroll
    const alerta = document.getElementById("alerta-exito");
    alerta.style.display = "block";
    alerta.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
        alerta.style.display = "none";
    }, 3000);

    // Limpiar campo de nombre
    document.getElementById('nombreProfesor').value = '';
});

// Agregar nueva clase al select

document.getElementById('formClase').addEventListener('submit', function (e) {
    e.preventDefault();

    const nombreClase = document.getElementById('nombreClase').value.trim();
    if (!nombreClase) return;

    const selectClases = document.getElementById('clase');
    const nuevaOpcion = document.createElement('option');
    nuevaOpcion.value = nombreClase;
    nuevaOpcion.textContent = nombreClase;
    selectClases.appendChild(nuevaOpcion);

    // Limpiar campo
    document.getElementById('nombreClase').value = '';

    // Cerrar el modal
    const modalElement = document.getElementById("modalCrearClase");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();

    // Mostrar alerta
    const alerta = document.getElementById("alerta-clase");
    if (alerta) {
        alerta.style.display = "block";
        alerta.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
            alerta.style.display = "none";
        }, 3000);
    }
});

// Agregar nueva aula al select

document.getElementById('formAula').addEventListener('submit', function (e) {
    e.preventDefault();
    const aula = document.getElementById('numeroAula').value.trim();
    if (!aula) return;

    const selectAula = document.getElementById('aula');
    const option = document.createElement('option');
    option.value = aula;
    option.textContent = aula;
    selectAula.appendChild(option);

    // Cerrar el modal
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAula"));
    modal.hide();

    // Limpiar campo
    document.getElementById('numeroAula').value = '';

    // Mostrar alerta
    const alerta = document.getElementById("alerta-aula");
    if (alerta) {
        alerta.style.display = "block";
        alerta.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
            alerta.style.display = "none";
        }, 3000);
    }
});

function cambiarIdioma() {
    alert("Aquí se cambiaría el idioma (puedes implementar selector de 'es', 'en', etc.)");
}

function toggleTema() {
    document.body.classList.toggle("tema-oscuro");
    alert("Tema cambiado (aquí puedes aplicar clases para cambiar colores)");
}

function restablecerHorarios() {
    if (confirm("¿Seguro que deseas borrar todos los horarios?")) {
        calendar.getEvents().forEach(event => event.remove());
        calendarioEventos = [];
        alert("Horarios restablecidos.");
    }
}

function exportarCalendario() {
    alert("Función para exportar en PDF o Excel aún no implementada.");
    // Aquí podrías integrar html2pdf o SheetJS (XLSX)
}
