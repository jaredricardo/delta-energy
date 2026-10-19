/* Delta Energy — cart-drawer.js
   Cart-specific interactions: quantity updates inside the drawer.
   Opening/closing is handled by the shared drawer logic in global.js */

;(function () {
  function debounce (fn, wait) {
    var t
    return function () {
      var args = arguments
      clearTimeout(t)
      t = setTimeout(function () { fn.apply(null, args) }, wait)
    }
  }

  function updateQuantity (line, quantity) {
    fetch(window.Shopify ? '/cart/change.js' : '/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    })
      .then(function (res) { return res.json() })
      .then(function () { window.location.reload() })
      .catch(function (err) { console.error('Cart update failed', err) })
  }

  document.addEventListener('DOMContentLoaded', function () {
    var body = document.querySelector('[data-cart-body]')
    if (!body) return

    body.addEventListener(
      'change',
      debounce(function (e) {
        var input = e.target.closest('[data-cart-qty-input]')
        if (!input) return
        updateQuantity(input.dataset.line, input.value)
      }, 300)
    )
  })
})()
