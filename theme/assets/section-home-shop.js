/* Delta Energy — home-shop (PDP) section JS
   Flavor tile pick (can squash-flip + tile-ring + title swap), view thumbs/
   dots (can rotate/scale + ring position), size select, purchase-option
   radios, quantity stepper and add-to-cart feedback — for both the desktop
   and mobile PDP markup. Pricing/variants are still mock data; swap in real
   product/variant IDs when this gets connected to the catalog. */

;(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* Flat flip fallback for when WebGL (DeCanGL, see can-gl.js) isn't
     available: squashes the can to edge-on, swaps the flavor mid-squash,
     then unsquashes — reads as a quick spin. */
  function spin (el, swap) {
    if (!el || reduce || !el.animate) { swap(); return }
    el.animate(
      [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.04) translateY(-14px)', offset: .45 }, { transform: 'scaleX(1)' }],
      { duration: 680, easing: 'cubic-bezier(.45,0,.25,1)' }
    )
    setTimeout(swap, 300)
  }

  function uScale () {
    var landscape = window.innerHeight < 520 && window.matchMedia('(orientation: landscape)').matches
    return Math.min(window.innerWidth, landscape ? 450 : 585) / 390
  }

  function wirePdp (root, opts) {
    if (!root) return
    var pdp = document.getElementById(opts.pdpId)
    var titleWrap = document.getElementById(opts.titleId)
    var tileRing = document.getElementById(opts.tileRingId)
    var can = document.getElementById(opts.canId)
    var canIn = can ? can.querySelector(opts.canInSelector) : null
    var want = pdp ? pdp.dataset.flavor : null
    var canGL = null

    if (window.DeCanGL && opts.gl) {
      var comp = pdp ? pdp.closest('.de-comp') : null
      window.DeCanGL.whenNear(pdp, function () {
        window.DeCanGL.initCanGL({
          cv: document.getElementById(opts.gl.cvId),
          host: pdp,
          can: can,
          shadow: pdp.querySelector(opts.gl.shadowSelector),
          box: opts.gl.box,
          tex: [pdp.dataset.spinCherry, pdp.dataset.spinPine],
          scale: function () { return comp ? parseFloat(getComputedStyle(comp).getPropertyValue('--comp-scale')) || 0 : uScale() },
          want: function () { return want },
          lift: opts.gl.lift,
          shadowOp: opts.gl.shadowOp
        }, function (g) { canGL = g })
      })
    }

    function pick (flavor) {
      if (!pdp || !flavor || flavor === want) return
      want = flavor
      pdp.querySelectorAll('.fset, .wash').forEach(function (x) { x.style.transition = 'none' })
      if (canGL) canGL.to(flavor, reduce)
      else spin(can, function () { pdp.dataset.flavor = flavor })
      requestAnimationFrame(function () {
        pdp.querySelectorAll('.fset, .wash').forEach(function (x) { x.style.transition = '' })
      })

      if (titleWrap) {
        var spans = titleWrap.querySelectorAll('span')
        spans.forEach(function (span, i) {
          var out = (flavor === 'pine' && i === 0) || (flavor === 'cherry' && i === 1)
          span.classList.toggle('out', out)
          span.setAttribute('aria-hidden', String(out))
        })
      }

      if (tileRing) {
        tileRing.style.transition = ''
        tileRing.style.left = opts.tileLeft(flavor)
      }

      root.querySelectorAll(opts.labelSelector).forEach(function (label) {
        var labelFlavor = label.dataset.flbl || label.dataset.mflbl
        label.classList.toggle('dim', labelFlavor !== flavor)
      })
    }

    root.querySelectorAll(opts.pickSelector).forEach(function (btn) {
      btn.addEventListener('click', function () {
        pick(btn.dataset.pick || btn.dataset.mpick)
      })
    })

    /* ---- product views: rotate/scale the can + move the view indicator ---- */
    if (opts.views && opts.views.length && canIn) {
      var viewBtns = root.querySelectorAll(opts.viewSelector)
      var ring = opts.ringId ? document.getElementById(opts.ringId) : null
      var curDot = opts.curDotId ? document.getElementById(opts.curDotId) : null
      var curView = 0

      function setView (i) {
        curView = ((i % opts.views.length) + opts.views.length) % opts.views.length
        var v = opts.views[curView]
        canIn.style.rotate = v.r
        canIn.style.scale = v.s
        if (ring) {
          var btn = viewBtns[curView]
          if (btn) ring.style.top = btn.style.top || getComputedStyle(btn).top
        }
        if (curDot) {
          viewBtns.forEach(function (d, j) { d.setAttribute('aria-pressed', String(j === curView)) })
          curDot.style.left = opts.dotLeft ? opts.dotLeft(curView) : ''
        }
      }

      viewBtns.forEach(function (btn, i) {
        btn.addEventListener('click', function () { setView(opts.viewIndex ? opts.viewIndex(btn) : i) })
      })

      if (opts.swipeHost) {
        var swipeHost = document.getElementById(opts.swipeHost)
        var start = null
        if (swipeHost) {
          swipeHost.addEventListener('pointerdown', function (e) {
            if (e.target.closest('button')) return
            start = { x: e.clientX, y: e.clientY }
          })
          swipeHost.addEventListener('pointerup', function (e) {
            if (!start) return
            var dx = e.clientX - start.x, dy = e.clientY - start.y
            start = null
            if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.3) setView(curView + (dx < 0 ? 1 : -1))
          })
          swipeHost.addEventListener('pointercancel', function () { start = null })
        }
      }
    }

    root.querySelectorAll(opts.sizeSelector).forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll(opts.sizeSelector).forEach(function (b) { b.setAttribute('aria-pressed', 'false') })
        btn.setAttribute('aria-pressed', 'true')
      })
    })

    root.querySelectorAll(opts.optSelector).forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll(opts.optSelector).forEach(function (b) { b.setAttribute('aria-checked', 'false') })
        btn.setAttribute('aria-checked', 'true')
      })
    })

    var qtyEl = document.getElementById(opts.qtyId)
    if (qtyEl) {
      root.querySelectorAll(opts.qtyBtnSelector).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var delta = parseInt(btn.dataset.q || btn.dataset.mqty, 10)
          var next = Math.max(1, parseInt(qtyEl.textContent, 10) + delta)
          qtyEl.textContent = next
        })
      })
    }

    var atc = document.getElementById(opts.atcId)
    if (atc) {
      atc.addEventListener('click', function () {
        atc.classList.add('added')
        setTimeout(function () { atc.classList.remove('added') }, 1800)
      })
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    wirePdp(document.getElementById('shop'), {
      pdpId: 'pdp',
      titleId: 'pdpTitle',
      tileRingId: 'tileRing',
      tileLeft: function (flavor) { return flavor === 'pine' ? '1186px' : '1038px' },
      canId: 'pdpCan',
      canInSelector: '.pdp-can-in',
      pickSelector: '[data-pick]',
      labelSelector: '[data-flbl]',
      sizeSelector: '.size',
      optSelector: '.opt',
      qtyId: 'qty',
      qtyBtnSelector: '[data-q]',
      atcId: 'atc',
      viewSelector: '[data-thumb]',
      viewIndex: function (btn) { return +btn.dataset.thumb },
      ringId: 'thumbRing',
      views: [{ r: '0deg', s: '1' }, { r: '9deg', s: '1.04' }, { r: '-7deg', s: '1.08' }],
      gl: {
        cvId: 'pdpCv',
        shadowSelector: '.pdp-shadow',
        box: { w: 314.5, h: 550.5, px: 157.8, py: 276.6, tilt: 14.32 * Math.PI / 180, k: 2 },
        lift: function () { return 20 },
        shadowOp: .45
      }
    })

    wirePdp(document.getElementById('mshop'), {
      pdpId: 'mpdp',
      titleId: 'mTitle',
      tileRingId: 'mTileRing',
      tileLeft: function (flavor) { return 'calc(' + (flavor === 'pine' ? 147 : 16) + ' * var(--u))' },
      canId: 'mpdpCan',
      canInSelector: '.mpdp-can-in',
      pickSelector: '[data-mpick]',
      labelSelector: '[data-mflbl]',
      sizeSelector: '.msize',
      optSelector: '.mopt',
      qtyId: 'mQty',
      qtyBtnSelector: '[data-mqty]',
      atcId: 'mAtc',
      viewSelector: '[data-mview]',
      viewIndex: function (btn) { return +btn.dataset.mview },
      curDotId: 'mDotCur',
      dotLeft: function (i) { return 'calc(' + [0, 22, 44, 66][i] + ' * var(--u))' },
      swipeHost: 'mpdp',
      views: [{ r: '0deg', s: '1' }, { r: '9deg', s: '1.05' }, { r: '-8deg', s: '1.1' }, { r: '3deg', s: '1.18' }],
      gl: {
        cvId: 'mpdpCv',
        shadowSelector: '.mpdp-shadow',
        box: { w: 154.51, h: 279.6, px: 77.71, py: 140.48, tilt: 11.9 * Math.PI / 180, k: 4.0333 },
        lift: function () { return 14 * uScale() },
        shadowOp: .8
      }
    })
  })
})()
