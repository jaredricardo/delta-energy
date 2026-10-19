/* Delta Energy — header section JS
   On the homepage the header overlays the hero transparently; this scroll
   listener solidifies it with a blurred background past a small threshold
   and hides/reveals it based on scroll direction, ported from the Variant F
   mock's "solid once scrolled, hides on the way down" header behavior. */

;(function () {
  function initStickyHeader () {
    var header = document.getElementById('SiteHeader')
    if (!header || !document.body.classList.contains('template-index')) return

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    var lastY = window.scrollY
    var queued = false

    function update () {
      queued = false
      var y = window.scrollY
      var dy = y - lastY
      lastY = y
      header.classList.toggle('is-solid', y > 8)
      if (!reduceMotion && dy > 4 && y > 160) header.classList.add('is-hidden')
      else if (dy < -4 || y < 160) header.classList.remove('is-hidden')
    }

    function schedule () {
      if (!queued) {
        queued = true
        requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', schedule, { passive: true })
    update()
  }

  document.addEventListener('DOMContentLoaded', initStickyHeader)
})()
