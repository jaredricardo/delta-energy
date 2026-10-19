/* Delta Energy — home-hero section JS
   Flavor-world hover/tap switching: hovering an "Add" tag (desktop) or
   tapping a can (mobile) tints the hero toward that flavor, pulls that
   can's glow forward and nudges the floating fruit art. Simplified from
   the mock's pixel hit-test canvas to direct hover/tap targets on the
   flavor elements themselves, but reuses the mock's FRUIT/GLOW paint
   tables so the glow + fruit motion matches the original design. */

;(function () {
  // Per-fruit reaction to each world: k = scale, dx/dy = offset in px,
  // o = opacity, b = blur (px). Missing world key = no change.
  var FRUIT = {
    cherry: { cherry: { k: 1.14, dx: 30, dy: 30 }, pine: { k: 0.85, dx: -40, dy: -30, o: 0.45, b: 5 } },
    lime: { cherry: { k: 1.12, dx: 25, dy: -10 }, pine: { k: 0.86, dx: -50, dy: 10, o: 0.5, b: 5 } },
    pine: { cherry: { k: 0.86, dx: 70, dy: -20, o: 0.5, b: 5 }, pine: { k: 1.12, dx: -30, dy: -15 } },
    mango: { cherry: { k: 0.82, dx: 50, dy: 10, o: 0.45, b: 5 }, pine: { k: 1.2, dx: -50, dy: -30 } }
  }

  // Per-glow reaction keyed by world, then glow name: s = scale, dx/dy =
  // offset, o = opacity, hot = opacity of the inner ".hot" highlight.
  var GLOW = {
    cherry: { cherry: { s: 1.465, hot: 1 }, lime: { s: 1.2 }, pine: { o: 0.2 } },
    pine: { pine: { s: 1.51, dx: -20, dy: -40, hot: 1 }, cherry: { o: 0.25 }, lime: { o: 0.3 } }
  }

  function buildWorld (stage, glowIdPrefix) {
    var stEls = {}
    stage.querySelectorAll('.st').forEach(function (el) {
      var fruit = el.dataset.fruit
      if (!fruit) return
      stEls[fruit] = el
      var main = el.querySelector('.fl.main')
      if (main) {
        el.style.transformOrigin = (main.offsetLeft + main.offsetWidth / 2) + 'px ' + (main.offsetTop + main.offsetHeight / 2) + 'px'
      }
    })

    var gwEls = {}
    ;['cherry', 'lime', 'pine'].forEach(function (name) {
      var el = stage.querySelector('#' + glowIdPrefix + name)
      if (el) gwEls[name] = el
    })

    function paintWorld (world) {
      Object.keys(stEls).forEach(function (name) {
        var el = stEls[name]
        var p = (FRUIT[name] && FRUIT[name][world]) || {}
        var k = p.k != null ? p.k : 1
        var dx = p.dx || 0
        var dy = p.dy || 0
        var o = p.o != null ? p.o : 1
        var b = p.b || 0
        el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + k + ')'
        el.style.opacity = o
        el.style.filter = b > 0.05 ? 'blur(' + b.toFixed(2) + 'px)' : 'none'
      })

      Object.keys(gwEls).forEach(function (name) {
        var el = gwEls[name]
        var p = (GLOW[world] && GLOW[world][name]) || {}
        var s = p.s != null ? p.s : 1
        var o = p.o != null ? p.o : 1
        el.style.transform = 'translate(' + (p.dx || 0) + 'px, ' + (p.dy || 0) + 'px) scale(' + s + ')'
        el.style.opacity = o
        var hot = el.querySelector('.hot')
        if (hot) hot.style.opacity = Math.min(1, p.hot || 0)
      })
    }

    return paintWorld
  }

  function wireWorldSwitch (stage, triggerSelector, pickAttr, glowIdPrefix, canSelector) {
    if (!stage) return
    var triggers = stage.querySelectorAll(triggerSelector)
    var paintWorld = buildWorld(stage, glowIdPrefix)

    function setWorld (world) {
      if (stage.dataset.world === world) return
      stage.dataset.world = world
      paintWorld(world)
    }

    triggers.forEach(function (trigger) {
      var world = trigger.dataset[pickAttr]
      if (!world) return
      trigger.addEventListener('mouseenter', function () { setWorld(world) })
      trigger.addEventListener('focus', function () { setWorld(world) })
      trigger.addEventListener('click', function () { setWorld(world) })
    })

    // The cans are one image, so hovering/tapping its left vs. right half
    // picks the cherry vs. pine world directly off the art itself, rather
    // than only off the small "Add" tags. Bound on the stage (not the can
    // image) and hit-tested by coordinates, so it isn't blocked by the
    // flavor art layered on top of the can; leaving the can's bounds
    // resets back to neutral.
    var cans = stage.querySelector(canSelector)
    if (cans) {
      var pickFromPoint = function (clientX, clientY) {
        var rect = cans.getBoundingClientRect()
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
          setWorld('neutral')
          return
        }
        setWorld(clientX - rect.left < rect.width / 2 ? 'cherry' : 'pine')
      }
      stage.addEventListener('mousemove', function (e) { pickFromPoint(e.clientX, e.clientY) })
      stage.addEventListener('touchstart', function (e) {
        var touch = e.touches && e.touches[0]
        if (touch) pickFromPoint(touch.clientX, touch.clientY)
      }, { passive: true })
    }

    stage.addEventListener('mouseleave', function () { setWorld('neutral') })
  }

  // Pull the hero's sharp can art into focus once it's decoded, swapping
  // away from the blurred "soft" placeholder (the .prefocus state). Falls
  // back to a timeout so the reveal still happens if decode() stalls, and
  // resolves instantly for prefers-reduced-motion.
  function focusStage (stage, fullSelector) {
    if (!stage) return
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function focusIn () { stage.classList.remove('prefocus') }

    if (reduceMotion) {
      focusIn()
      return
    }

    var imgs = stage.querySelectorAll(fullSelector)
    var decodePromises = Array.prototype.map.call(imgs, function (img) {
      return (img.decode ? img.decode() : Promise.resolve()).catch(function () {})
    })
    Promise.all(decodePromises).then(function () { setTimeout(focusIn, 200) })
    setTimeout(focusIn, 6000)
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireWorldSwitch(document.getElementById('stage'), '[data-flavor-pick]', 'flavorPick', 'gw-', '.cans.full')
    wireWorldSwitch(document.getElementById('mtop'), '[data-mpick]', 'mpick', 'mgw-', '.mcans.full')

    focusStage(document.getElementById('stage'), 'img.full, img.cans-mul')
    focusStage(document.getElementById('mtop'), 'img.full, img.mcans-mul')
  })
})()
