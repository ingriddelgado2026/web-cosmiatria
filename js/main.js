/* Web de cosmiatría — JavaScript ligero, sin librerías */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  document.documentElement.classList.add("js");

  /* Año del pie */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* Encabezado con línea al bajar */
  var top = $(".top");
  var marcar = function () { if (top) top.classList.toggle("scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", marcar, { passive: true }); marcar();

  /* Menú del celular */
  var btn = $(".menu-btn"), nav = $("#nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var abierto = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", abierto); btn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); btn.setAttribute("aria-expanded", false); }); });
  }

  /* Aparecer al hacer scroll */
  var rev = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add("visible"); });

  /* Filtros de tratamientos */
  var chips = $$(".chip");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c); });
      $$(".serv").forEach(function (s) { s.hidden = c.dataset.f !== "todos" && s.dataset.cat !== c.dataset.f; if (!s.hidden) s.classList.add("visible"); });
    });
  });

  /* Preguntas: solo una abierta a la vez */
  $$(".faq-list details").forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) $$(".faq-list details").forEach(function (o) { if (o !== d) o.open = false; }); });
  });

  /* Formulario → WhatsApp */
  var f = $("#form-cita");
  if (f) {
    var hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    f.fecha.min = hoy.toISOString().slice(0, 10);
    /* "Agendar este" deja el tratamiento elegido en el formulario */
    $$("[data-servicio]").forEach(function (a) { a.addEventListener("click", function () { f.servicio.value = a.dataset.servicio; }); });
    var msg = $("#form-msg"), textoBase = msg.textContent;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var faltan = $$("input[required],select[required]", f).filter(function (el) {
        var mal = el.type === "checkbox" ? !el.checked : !el.value; el.classList.toggle("campo-error", mal); return mal;
      });
      if (faltan.length) { msg.textContent = "Completa los campos marcados y acepta la política de privacidad."; msg.classList.add("error"); faltan[0].focus(); return; }
      msg.textContent = textoBase; msg.classList.remove("error");
      var p = f.fecha.value.split("-"), fecha = p[1] + "/" + p[2] + "/" + p[0];
      var t = "Hola, quiero agendar una cita.\n\n" +
        "*Nombre:* " + f.nombre.value.trim() + "\n" +
        "*Tratamiento:* " + f.servicio.value + "\n" +
        "*Fecha preferida:* " + fecha + "\n" +
        "*Horario:* " + f.horario.value + "\n" +
        "*Primera cita:* " + f.primera.value +
        (f.comentarios.value.trim() ? "\n*Comentarios:* " + f.comentarios.value.trim() : "");
      if (window.medir) window.medir("generate_lead", { servicio: f.servicio.value });
      window.open("https://wa.me/" + window.WA_NUMERO + "?text=" + encodeURIComponent(t), "_blank", "noopener");
    });
  }

  /* ===== Cookies y Google Analytics (solo se carga si el visitante acepta) ===== */
  var KEY = "cosm-cookies", banner = $("#cookie-banner");
  var leer = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var guardar = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  var GA = window.GA_ID || "", activa = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  function cargarMedicion() {
    if (!GA || activa) return;
    activa = true; window["ga-disable-" + GA] = false;
    var s = document.createElement("script"); s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA; s.async = true; document.head.appendChild(s);
    gtag("js", new Date()); gtag("config", GA);
  }
  function apagarMedicion() {
    if (!GA) return;
    window["ga-disable-" + GA] = true; activa = false;
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (n.indexOf("_ga") === 0) ["", "; domain=" + location.hostname, "; domain=." + location.hostname.replace(/^www\./, "")].forEach(function (d) {
        document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
      });
    });
  }
  window.medir = function (evento, datos) { if (activa) gtag("event", evento, datos || {}); };
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href*="wa.me"]');
    if (a) window.medir("contacto_whatsapp", { ubicacion: a.className.indexOf("wa-float") > -1 ? "boton_flotante" : "pagina" });
  });
  var elegir = function (v) { guardar(v); if (banner) banner.hidden = true; if (v === "todas") cargarMedicion(); else apagarMedicion(); };
  if (banner) {
    var c = leer();
    if (!c) banner.hidden = false; else if (c === "todas") cargarMedicion();
    $$("[data-cookie]", banner).forEach(function (b) { b.addEventListener("click", function () { elegir(b.dataset.cookie); }); });
  }
  $$("[data-cookie-settings]").forEach(function (b) { b.addEventListener("click", function () { if (banner) banner.hidden = false; }); });
})();
