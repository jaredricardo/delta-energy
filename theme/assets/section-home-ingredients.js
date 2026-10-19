/* Delta Energy — home-ingredients section JS
   Flavor toggle (cherry/pine) for the desktop + mobile ingredient clusters,
   the mobile accordion for the functional-ingredient callouts, and the
   muted line-art pattern that draws itself behind the can on first sight /
   toggle (ported from the mock's makePat()/spin()). */

;(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---------------- image / JSON loaders (with a couple of retries) ---------------- */
  function loadImg (src, n) {
    n = n || 0
    return new Promise(function (ok, no) {
      var im = new Image()
      im.onload = function () {
        (im.decode ? im.decode().catch(function () {}) : Promise.resolve()).then(function () { ok(im) })
      }
      im.onerror = function () {
        if (n < 2) setTimeout(function () { loadImg(src, n + 1).then(ok, no) }, 600 * (n + 1))
        else no(new Error('image load failed'))
      }
      im.src = src
    })
  }

  function loadJSON (src, n) {
    n = n || 0
    return fetch(src).then(function (r) {
      if (!r.ok) throw new Error(r.status)
      return r.json()
    }).catch(function (e) {
      if (n < 2) return new Promise(function (ok) { setTimeout(ok, 600 * (n + 1)) }).then(function () { return loadJSON(src, n + 1) })
      return Promise.reject(e)
    })
  }

  /* ---------------- pattern line-art drawing engine ----------------
     Each flavor's art is traced into pen strokes (centreline points + pen
     width). A hidden mask canvas draws the strokes outward over `total`ms,
     then the real artwork is clipped through that mask so the finished
     drawing matches the source line art exactly. */
  var patData = {}
  function loadPat (sources, flavor) {
    if (!patData[flavor]) {
      patData[flavor] = Promise.all([loadImg(sources.img), loadJSON(sources.strokes)]).then(function (res) {
        var art = res[0]
        var J = res[1]
        var strokes = J.s.map(function (a) {
          var P = new Float32Array(a.slice(3))
          var n = P.length / 2
          var cum = new Float32Array(n)
          for (var k = 1; k < n; k++) cum[k] = cum[k - 1] + Math.hypot(P[2 * k] - P[2 * k - 2], P[2 * k + 1] - P[2 * k - 1])
          return { w: a[0], t0: a[1], t1: a[2], P: P, n: n, cum: cum, len: cum[n - 1] }
        })
        return { art: art, W: J.w, H: J.h, strokes: strokes }
      })
    }
    return patData[flavor]
  }

  function penTo (m, s, from, to) {
    var k = 0
    while (k < s.n - 2 && s.cum[k + 1] < from) k++
    function at (L, j) {
      var seg = (s.cum[j + 1] - s.cum[j]) || 1
      var u = Math.min(1, Math.max(0, (L - s.cum[j]) / seg))
      return [s.P[2 * j] + (s.P[2 * j + 2] - s.P[2 * j]) * u, s.P[2 * j + 1] + (s.P[2 * j + 3] - s.P[2 * j + 1]) * u]
    }
    var a = at(from, k)
    m.beginPath()
    m.moveTo(a[0], a[1])
    while (k < s.n - 2 && s.cum[k + 1] < to) { k++; m.lineTo(s.P[2 * k], s.P[2 * k + 1]) }
    var b = at(to, k)
    m.lineTo(b[0], b[1])
    m.lineWidth = s.w
    m.stroke()
  }

  function makePat (wrap, sources, sc, total) {
    if (!wrap) return { show: function () {}, preload: function () {} }
    var cvs = { pine: wrap.querySelector('.patcv.pine'), cherry: wrap.querySelector('.patcv.cherry') }
    var st = {}
    var cur = null

    function prep (f) {
      return loadPat(sources[f], f).then(function (d) {
        if (st[f]) return st[f]
        var cv = cvs[f]
        var w = Math.round(d.W * sc)
        var h = Math.round(d.H * sc)
        cv.width = w
        cv.height = h
        var mask = document.createElement('canvas')
        mask.width = w
        mask.height = h
        var mctx = mask.getContext('2d')
        mctx.setTransform(sc, 0, 0, sc, 0, 0)
        mctx.strokeStyle = mctx.fillStyle = '#000'
        mctx.lineCap = mctx.lineJoin = 'round'
        var n = d.strokes.length
        var start = new Float32Array(n)
        var dur = new Float32Array(n)
        d.strokes.forEach(function (s, i) { start[i] = s.t0 * total; dur[i] = Math.max(1, (s.t1 - s.t0) * total) })
        var order = Object.keys(d.strokes).map(Number).sort(function (a, b) { return start[a] - start[b] })
        st[f] = { d: d, ctx: cv.getContext('2d'), mask: mask, mctx: mctx, w: w, h: h, start: start, dur: dur, order: order, done: new Float32Array(n), raf: 0 }
        return st[f]
      })
    }

    function full (S) {
      var c = S.ctx
      c.globalCompositeOperation = 'copy'
      c.drawImage(S.d.art, 0, 0, S.w, S.h)
      c.globalCompositeOperation = 'source-over'
    }

    function frame (S, t) {
      var d = S.d, mctx = S.mctx, start = S.start, dur = S.dur, order = S.order, done = S.done
      var busy = false
      for (var oi = 0; oi < order.length; oi++) {
        var i = order[oi]
        if (t < start[i]) { busy = true; break }
        var s = d.strokes[i]
        if (done[i] < 0) { mctx.beginPath(); mctx.arc(s.P[0], s.P[1], s.w / 2, 0, 7); mctx.fill(); done[i] = 0 }
        if (done[i] >= s.len) continue
        var p = Math.min(1, (t - start[i]) / dur[i])
        var to = p * s.len
        if (to > done[i]) { penTo(mctx, s, done[i], to); done[i] = to }
        if (p < 1) busy = true
      }
      var c = S.ctx
      c.globalCompositeOperation = 'copy'
      c.drawImage(S.mask, 0, 0)
      c.globalCompositeOperation = 'source-in'
      c.drawImage(d.art, 0, 0, S.w, S.h)
      c.globalCompositeOperation = 'source-over'
      return busy
    }

    function draw (f, instant) {
      prep(f).then(function (S) {
        if (cur !== f) return
        cancelAnimationFrame(S.raf)
        S.mctx.save(); S.mctx.setTransform(1, 0, 0, 1, 0, 0); S.mctx.clearRect(0, 0, S.w, S.h); S.mctx.restore()
        S.done.fill(-1)
        if (instant) { full(S); return }
        S.ctx.clearRect(0, 0, S.w, S.h)
        var t0 = performance.now()
        var step = function (now) {
          if (cur !== f) return
          if (frame(S, now - t0)) S.raf = requestAnimationFrame(step)
          else full(S)
        }
        S.raf = requestAnimationFrame(step)
      })
    }

    return {
      show: function (f, instant) {
        if (cur === f || !cvs[f]) return
        cur = f
        if (st[f]) { cancelAnimationFrame(st[f].raf); st[f].ctx.clearRect(0, 0, st[f].w, st[f].h) }
        wrap.dataset.pat = f
        draw(f, instant)
      },
      preload: function () { prep('pine'); prep('cherry') }
    }
  }

  function patSources (wrap) {
    if (!wrap) return null
    return {
      pine: { img: wrap.dataset.pineImg, strokes: wrap.dataset.pineStrokes },
      cherry: { img: wrap.dataset.cherryImg, strokes: wrap.dataset.cherryStrokes }
    }
  }

  function firstSight (el, fn) {
    if (!el) return
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting })) { io.disconnect(); fn() }
    }, { threshold: .25 })
    io.observe(el)
  }

  /* ---------------- can "spin" swap ----------------
     Squashes the can flat then back out; the flavor swap (handled by the
     [data-flavor] CSS opacity rules on .can-pine/.can-cherry) happens at
     the midpoint while the can is edge-on, so it reads as the can spinning
     around to its other side. */
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

  /* ---------------- wiring ---------------- */
  function wireIngredients (section, toggleBtn, labelSelector, canSelector, patWrapSelector, patScale, patTotal, cluster, glOpts) {
    if (!section || !toggleBtn) return
    var labels = section.querySelectorAll(labelSelector)
    var can = section.querySelector(canSelector)
    var patWrap = section.querySelector(patWrapSelector)
    var sets = section.querySelectorAll('.cl-set, .tl')
    var tint = section.querySelector('.ing-tint, .ming-tint')
    var pat = makePat(patWrap, patSources(patWrap), patScale, patTotal)
    var want = section.dataset.flavor
    var canGL = null

    if (window.DeCanGL && cluster && glOpts) {
      var comp = section.closest('.de-comp')
      window.DeCanGL.whenNear(section, function () {
        window.DeCanGL.initCanGL({
          cv: can.querySelector('.ing-cv'),
          host: section,
          can: can,
          shadow: null,
          box: glOpts.box,
          meta: window.DeCanGL.ING_SPIN,
          front: 'pine',
          tex: [cluster.dataset.spinPine, cluster.dataset.spinCherry],
          scale: function () { return comp ? parseFloat(getComputedStyle(comp).getPropertyValue('--comp-scale')) || 0 : uScale() },
          want: function () { return want },
          lift: glOpts.lift,
          shadowOp: 1
        }, function (g) { canGL = g })
      })
    }

    firstSight(patWrap, function () { pat.show(want, reduce) })

    function setFlavor (flavor) {
      if (want === flavor) return
      want = flavor
      var instant = reduce
      pat.show(flavor, instant)
      var transEls = []
      if (instant) {
        transEls = Array.prototype.slice.call(sets).concat(tint ? [tint] : [])
        transEls.forEach(function (x) { x.style.transition = 'none' })
      }
      if (canGL) canGL.to(flavor, instant)
      else spin(can, function () { section.dataset.flavor = flavor })
      if (instant) {
        requestAnimationFrame(function () { transEls.forEach(function (x) { x.style.transition = '' }) })
      }
      var isPine = flavor === 'pine'
      toggleBtn.setAttribute('aria-checked', String(isPine))
      toggleBtn.setAttribute('aria-label', isPine ? 'Show Cherry Limeade' : 'Show Pineapple Mango')
    }

    toggleBtn.addEventListener('click', function () {
      setFlavor(section.dataset.flavor === 'pine' ? 'cherry' : 'pine')
    })

    labels.forEach(function (label) {
      var flavor = label.dataset.ing || label.dataset.ming
      if (flavor) label.addEventListener('click', function () { setFlavor(flavor) })
    })
  }

  function wireAccordion (section) {
    if (!section) return
    section.querySelectorAll('.mli-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.mli')
        var isOpen = item.classList.contains('open')
        item.classList.toggle('open', !isOpen)
        btn.setAttribute('aria-expanded', String(!isOpen))
      })
    })
  }

  document.addEventListener('DOMContentLoaded', function () {
    var how = document.getElementById('how')
    var mhow = document.getElementById('mhow')
    wireIngredients(how, document.getElementById('ingToggle'), '[data-ing]', '#clCan', '#patWrap', 1, 1400,
      document.getElementById('cluster'),
      { box: { w: 248.5, h: 528.5, px: 123.215, py: 262.495, tilt: 0, k: 2 }, lift: function () { return 14 } })
    wireIngredients(mhow, document.getElementById('mIngToggle'), '[data-ming]', '#mclCan', '#mPatWrap', .75, 1300,
      mhow ? mhow.querySelector('.mcluster') : null,
      { box: { w: 140.12, h: 262.12, px: 69.69, py: 128.16, tilt: 0, k: 4.17 }, lift: function () { return 14 * uScale() } })
    wireAccordion(mhow)
  })
})()
