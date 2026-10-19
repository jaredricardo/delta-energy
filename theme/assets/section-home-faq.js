/* Delta Energy — home-faq section JS
   Simple single-open accordion for the FAQ list (desktop + mobile). */

;(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.qa-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.qa')
        var isOpen = item.classList.contains('open')
        item.classList.toggle('open', !isOpen)
        btn.setAttribute('aria-expanded', String(!isOpen))
      })
    })
  })
})()
