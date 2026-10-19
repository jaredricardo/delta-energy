/* Delta Energy — home-difference section JS
   Mobile comparison tabs swap which competitor column is shown against
   the fixed Delta Energy column (ported from the mock's mSetComp()). */

;(function () {
  var COMPARE = {
    sugary: { label: 'Sugary<br>Energy Drinks', yes: [] },
    coffee: { label: 'Cup of<br>Coffee', yes: [0, 2, 4] },
    soda: { label: 'Soda', yes: [4] },
    noot: { label: 'Nootropics', yes: [0, 2, 3, 4] }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var tabs = document.querySelectorAll('.mtab')
    var tabRow = document.querySelector('.mtabs')
    var colHead = document.getElementById('mColH')
    var cells = document.querySelectorAll('.mcell')
    if (!tabs.length || !colHead) return

    function setComparison (key) {
      tabs.forEach(function (tab) { tab.setAttribute('aria-selected', String(tab.dataset.comp === key)) })

      var spans = colHead.querySelectorAll('span')
      var current = spans[0].classList.contains('out') ? spans[1] : spans[0]
      var next = current === spans[0] ? spans[1] : spans[0]
      next.innerHTML = COMPARE[key].label
      current.classList.add('out')
      next.classList.remove('out')

      cells.forEach(function (cell, i) {
        var yes = COMPARE[key].yes.indexOf(i) !== -1
        cell.classList.toggle('is-yes', yes)
        cell.classList.toggle('is-no', !yes)
      })

      var activeTab = Array.prototype.find.call(tabs, function (t) { return t.dataset.comp === key })
      if (activeTab && tabRow && tabRow.scrollWidth > tabRow.clientWidth) {
        tabRow.scrollTo({
          left: Math.max(0, activeTab.offsetLeft - tabRow.clientWidth / 2 + activeTab.offsetWidth / 2),
          behavior: 'smooth'
        })
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { setComparison(tab.dataset.comp) })
    })

    setComparison('sugary')
  })
})()
