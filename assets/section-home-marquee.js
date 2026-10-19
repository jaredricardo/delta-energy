/* Delta Energy — home-marquee section JS
   Scroll-velocity boost for the CSS marquee loop, ported from the mock's
   mqBoost()/mqLoop(): scrolling speeds the marquee up and can reverse its
   direction, easing back to a steady 1x rate at rest. Respects
   prefers-reduced-motion (the base CSS animation is disabled there too). */

;(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) return

  document.addEventListener('DOMContentLoaded', function () {
    var tracks = document.querySelectorAll('.mq-track, .mmq-track')
    if (!tracks.length) return

    var anims = Array.prototype.map.call(tracks, function (track) {
      return track.getAnimations ? track.getAnimations()[0] : null
    }).filter(Boolean)

    if (!anims.length) return

    var dir = 1
    var rate = 1
    var target = 1
    var lastRate = null
    var lastY = window.scrollY

    // NOTE: this must not reassign the outer `rate` (magnitude) variable —
    // it only applies the already-signed value to the animations. Reusing
    // `rate` here previously corrupted the easing loop below, so reversing
    // scroll direction made the marquee stall instead of reversing.
    function setRate (signedRate) {
      if (lastRate !== null && Math.abs(signedRate - lastRate) < 0.004) return
      lastRate = signedRate
      anims.forEach(function (anim) { anim.playbackRate = signedRate })
    }

    function onScroll () {
      var y = window.scrollY
      var velocity = y - lastY
      lastY = y
      if (velocity) dir = velocity > 0 ? 1 : -1
      target = 1 + Math.min(4, Math.abs(velocity) / 18)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    ;(function loop () {
      rate += (target - rate) * 0.08
      target += (1 - target) * 0.06
      setRate(dir * rate)
      requestAnimationFrame(loop)
    })()
  })
})()
