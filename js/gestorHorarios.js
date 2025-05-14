document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendario');
    const eventListEl = document.getElementById('eventList');
    let misEventos = JSON.parse(localStorage.getItem('misEventos')) || [];

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        timeZone: 'America/Bogota',  // Establece la zona horaria a la hora de Colombia
        height: '100vh',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: misEventos,
        dateClick: function (info) {
            document.getElementById('fecha').value = info.dateStr;
            document.getElementById('eventoId').value = '';
            abrirPopup();
        },
        eventClick: function (info) {
            const evento = info.event;
            document.getElementById('eventoId').value = evento.id;
            document.getElementById('materia').value = evento.title;
            document.getElementById('fecha').value = evento.startStr.split('T')[0];
            document.getElementById('horaInicio').value = evento.startStr.split('T')[1]?.substring(0, 5) || '';
            document.getElementById('horaFin').value = evento.endStr?.split('T')[1]?.substring(0, 5) || '';
            document.getElementById('instituto').value = evento.extendedProps.instituto || '';
            abrirPopup();
        }
    });

    calendar.render();

    function guardarEventosLocal() {
        localStorage.setItem('misEventos', JSON.stringify(misEventos));
    }

    function abrirPopup() {
        document.getElementById('formPopup').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }

    window.cerrarPopup = function () {
        document.getElementById('formPopup').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    window.agregarEvento = function () {
        const materia = document.getElementById('materia').value;
        const fecha = document.getElementById('fecha').value;
        const horaInicio = document.getElementById('horaInicio').value;
        const horaFin = document.getElementById('horaFin').value;
        const instituto = document.getElementById('instituto').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const diasSeleccionados = Array.from(document.querySelectorAll('#recurrencia input:checked')).map(cb => parseInt(cb.value));

        if (!materia || !fecha || !horaInicio || !horaFin) return;

        const fechaInicio = new Date(fecha + 'T' + horaInicio + ':00');
        const limite = fechaFin ? new Date(fechaFin + 'T' + horaFin + ':00') : fechaInicio;

        // Convertir la hora a hora de Colombia (UTC-5)
        fechaInicio.setHours(fechaInicio.getHours() - 5); // Ajuste de -5 horas para Colombia
        limite.setHours(limite.getHours() - 5); // Ajuste de -5 horas para Colombia

        while (fechaInicio <= limite) {
            if (diasSeleccionados.includes(fechaInicio.getDay())) {
                const fechaStr = fechaInicio.toISOString().split('T')[0];
                const nuevo = {
                    id: String(Date.now()) + Math.random(),
                    title: materia,
                    start: `${fechaStr}T${horaInicio}`,
                    end: `${fechaStr}T${horaFin}`,
                    instituto: instituto
                };
                misEventos.push(nuevo);
                calendar.addEvent(nuevo);
            }
            fechaInicio.setDate(fechaInicio.getDate() + 1);
        }

        mostrarEventos(misEventos);
        guardarEventosLocal();
        mostrarToast("Horario agregado correctamente", "success");
        cerrarPopup();
    };

    window.modificarEvento = function () {
        const id = document.getElementById('eventoId').value;
        const materia = document.getElementById('materia').value;
        const fecha = document.getElementById('fecha').value;
        const horaInicio = document.getElementById('horaInicio').value;
        const horaFin = document.getElementById('horaFin').value;
        const instituto = document.getElementById('instituto').value;

        if (!id) return;

        const evento = calendar.getEventById(id);
        if (evento) {
            evento.setProp('title', materia);
            evento.setStart(`${fecha}T${horaInicio}`);
            evento.setEnd(`${fecha}T${horaFin}`);
            evento.setExtendedProp('instituto', instituto);

            const index = misEventos.findIndex(ev => ev.id === id);
            if (index !== -1) {
                misEventos[index].title = materia;
                misEventos[index].start = `${fecha}T${horaInicio}`;
                misEventos[index].end = `${fecha}T${horaFin}`;
                misEventos[index].instituto = instituto;
            }

            mostrarEventos(misEventos);
            guardarEventosLocal();
            mostrarToast("Horario modificado correctamente", "success");
            cerrarPopup();
        }
    };

    window.eliminarEvento = function () {
        const id = document.getElementById('eventoId').value;
        const evento = calendar.getEventById(id);
        if (evento) {
            evento.remove();
            misEventos = misEventos.filter(ev => ev.id !== id);
            mostrarEventos(misEventos);
            guardarEventosLocal();
            mostrarToast("Horario eliminado correctamente", "success");
            cerrarPopup();
        }
    };

    function mostrarEventos(eventos) {
        const hoy = new Date();
        const eventosFuturos = eventos.filter(ev => new Date(ev.start) >= hoy)
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        eventListEl.innerHTML = "<h2>Próximos Eventos</h2>";

        eventosFuturos.forEach(ev => {
            const item = document.createElement('div');
            item.className = 'event-card';

            const fecha = new Date(ev.start);
            const dia = fecha.getDate();
            const mes = fecha.toLocaleString('es-ES', { month: 'long' });
            const horaInicio = fecha.toTimeString().slice(0, 5);
            const horaFin = ev.end ? new Date(ev.end).toTimeString().slice(0, 5) : '';

            item.innerHTML = `
        <div class="event-info">
          <h3>${ev.title}</h3>
          <p>Instituto: ${ev.instituto || ''}</p>
          <p>Hora: ${horaInicio} - ${horaFin}</p>
        </div>
        <div class="event-date">
          <strong>${dia}</strong>
          <span>${mes}</span>
        </div>
      `;

            eventListEl.appendChild(item);
        });
    }

    mostrarEventos(misEventos);

    // Función para mostrar el toast y hacer que desaparezca después de 3 segundos
    function mostrarToast(mensaje, tipo = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = mensaje;
        toast.className = 'toast';
  
  // Aplica la clase de estilo (success o error) y la animación
  toast.classList.add(tipo);
  toast.classList.add('show');

  // Después de 3 segundos, oculta el toast
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
  }, 3000);
    }

});
