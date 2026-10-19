/* Delta Energy — home-what section JS
   Product card tilt-toward-cursor effect, ported from the mock's
   `[data-card]` pointermove handler: the card rotates slightly on its 3D
   perspective, the can inside drifts/tilts, and the shadow shifts to match. */

;(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-card]').forEach(function (wrap) {
      var card = wrap.querySelector('.pcard')
      var can = wrap.querySelector('.pcan')
      var sh = wrap.querySelector('.pshadow')
      if (!card || !can || !sh) return

      wrap.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return
        var r = wrap.getBoundingClientRect()
        var rx = ((e.clientX - r.left) / r.width) * 2 - 1
        var ry = ((e.clientY - r.top) / r.height) * 2 - 1
        wrap.classList.add('hovering')
        card.style.transform = 'rotateX(' + (-ry * 6).toFixed(2) + 'deg) rotateY(' + (rx * 8).toFixed(2) + 'deg)'
        can.style.translate = (rx * 16).toFixed(1) + 'px ' + (ry * 10 - 14).toFixed(1) + 'px'
        can.style.rotate = (rx * 4).toFixed(2) + 'deg'
        sh.style.translate = (rx * 10).toFixed(1) + 'px 0'
        sh.style.scale = '0.85'
      })

      wrap.addEventListener('pointerleave', function () {
        wrap.classList.remove('hovering')
        card.style.transform = ''
        can.style.translate = ''
        can.style.rotate = ''
        sh.style.translate = ''
        sh.style.scale = ''
      })
    })
  })
})()
