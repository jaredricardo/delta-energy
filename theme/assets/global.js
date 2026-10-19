/* Delta Energy — global.js
   Handles slide-out behavior for the mobile nav aside and cart aside,
   including their click-to-close underlays, ESC-to-close and focus handling.
   Shared, store-wide behavior only — section-specific interactions live in
   each section's own asset file. */

document.documentElement.classList.remove('no-js')
document.documentElement.classList.add('js')

window.DE = window.DE || {}

;(function () {
  var OPEN_CLASS = 'is-open'
  var VISIBLE_CLASS = 'is-visible'

  function qs (sel, ctx) {
    return (ctx || document).querySelector(sel)
  }

  function trapFocus (container) {
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (!focusable.length) return
    var first = focusable[0]
    var last = focusable[focusable.length - 1]

    function handleKeydown (e) {
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeydown)
    return function () {
      container.removeEventListener('keydown', handleKeydown)
    }
  }

  function createDrawer (opts) {
    var drawer = qs(opts.drawerSelector)
    var overlay = qs(opts.overlaySelector)
    if (!drawer || !overlay) return null

    var lastFocused = null
    var releaseTrap = null

    function open () {
      lastFocused = document.activeElement
      drawer.classList.add(OPEN_CLASS)
      overlay.classList.add(VISIBLE_CLASS)
      drawer.setAttribute('aria-hidden', 'false')
      overlay.setAttribute('aria-hidden', 'false')
      document.body.classList.add('de-no-scroll')
      releaseTrap = trapFocus(drawer)
      var focusTarget = qs('[data-drawer-close]', drawer) || drawer
      if (focusTarget) focusTarget.focus()
      document.dispatchEvent(new CustomEvent(opts.openEvent))
    }

    function close () {
      drawer.classList.remove(OPEN_CLASS)
      overlay.classList.remove(VISIBLE_CLASS)
      drawer.setAttribute('aria-hidden', 'true')
      overlay.setAttribute('aria-hidden', 'true')
      document.body.classList.remove('de-no-scroll')
      if (releaseTrap) releaseTrap()
      if (lastFocused) lastFocused.focus()
      document.dispatchEvent(new CustomEvent(opts.closeEvent))
    }

    function toggle () {
      if (drawer.classList.contains(OPEN_CLASS)) close()
      else open()
    }

    overlay.addEventListener('click', close)
    drawer.querySelectorAll('[data-drawer-close]').forEach(function (btn) {
      btn.addEventListener('click', close)
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains(OPEN_CLASS)) close()
    })

    document.querySelectorAll(opts.triggerSelector).forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault()
        toggle()
      })
    })

    return { open: open, close: close, toggle: toggle }
  }

  document.addEventListener('DOMContentLoaded', function () {
    DE.mobileNav = createDrawer({
      drawerSelector: '#MobileNav',
      overlaySelector: '#MobileNavOverlay',
      triggerSelector: '[data-mobile-nav-toggle]',
      openEvent: 'mobile-nav:open',
      closeEvent: 'mobile-nav:close'
    })

    DE.cartDrawer = createDrawer({
      drawerSelector: '#CartDrawer',
      overlaySelector: '#CartDrawerOverlay',
      triggerSelector: '[data-cart-toggle]',
      openEvent: 'cart-drawer:open',
      closeEvent: 'cart-drawer:close'
    })

    /* close either drawer if the viewport crosses the desktop breakpoint */
    var desktopMQ = window.matchMedia('(min-width: 1100px)')
    desktopMQ.addEventListener('change', function (e) {
      if (e.matches && DE.mobileNav) DE.mobileNav.close()
    })

    /* fit each 1920px desktop "comp" section to the viewport width */
    var comps = document.querySelectorAll('.de-comp')
    function fitComps () {
      comps.forEach(function (comp) {
        var inner = comp.querySelector('.de-comp__inner')
        if (!inner) return
        var scale = comp.clientWidth / 1920
        comp.style.setProperty('--comp-scale', scale)
        comp.style.height = Math.round(inner.offsetHeight * scale) + 'px'
      })
    }
    fitComps()
    window.addEventListener('resize', fitComps)

    /* ambient scroll parallax: shared across every homepage section.
       Ported from the mock's runPx(), simplified to measure each element's
       own position in the viewport (rather than one shared 7188px page),
       since sections are now independent. Disabled for
       prefers-reduced-motion. */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    var pxEls = Array.prototype.slice.call(document.querySelectorAll('[data-px], [data-mpx]')).map(function (el) {
      return { el: el, speed: parseFloat(el.dataset.px || el.dataset.mpx) || 0 }
    })

    if (pxEls.length && !reduceMotion) {
      var pxQueued = false
      var runPx = function () {
        pxQueued = false
        var vc = window.innerHeight / 2
        pxEls.forEach(function (P) {
          var rect = P.el.getBoundingClientRect()
          if (rect.bottom < -400 || rect.top > window.innerHeight + 400) return
          var cy = rect.top + rect.height / 2
          var t = Math.max(-120, Math.min(120, (cy - vc) * P.speed))
          P.el.style.translate = '0 ' + t.toFixed(1) + 'px'
        })
      }
      var schedulePx = function () {
        if (!pxQueued) {
          pxQueued = true
          requestAnimationFrame(runPx)
        }
      }
      window.addEventListener('scroll', schedulePx, { passive: true })
      window.addEventListener('resize', schedulePx)
      schedulePx()
    }

    /* reveal-on-scroll: shared across every homepage section */
    var revealEls = document.querySelectorAll('.fx-rise, .fx-slide, .fx-pop, .fx-fade, .fx-lines')
    if (revealEls.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('in')
              io.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
      )
      revealEls.forEach(function (el) { io.observe(el) })

    /* smooth-scroll in-page jump links used across the homepage sections
       (desktop uses data-jump, mobile uses data-mjump) */
    document.querySelectorAll('[data-jump], [data-mjump]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.dataset.jump || link.dataset.mjump
        var target = document.getElementById(id) || document.querySelector('#m' + id) || document.querySelector('[id="' + id + '"]')
        if (!target) return
        e.preventDefault()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
    } else {
      revealEls.forEach(function (el) { el.classList.add('in') })
    }
  })
})()
