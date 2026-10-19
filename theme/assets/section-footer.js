/* Delta Energy — footer section JS
   Handles the (prototype) newsletter signup confirmation note. */

;(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('[data-footer-email]')
    if (!form) return

    form.addEventListener('submit', function (e) {
      e.preventDefault()
      form.classList.add('is-sent')
    })
  })
})()
