(() => {
  function render(message) {
    const existing = document.getElementById('gf-toast')
    if (existing) existing.remove()

    const el = document.createElement('div')
    el.id = 'gf-toast'
    el.textContent = message
    el.setAttribute('role', 'status')
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '2147483647',
      maxWidth: '280px',
      padding: '12px 16px',
      borderRadius: '12px',
      background: '#33312e',
      color: '#fffdf8',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4',
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    })
    document.documentElement.appendChild(el)
    requestAnimationFrame(() => { el.style.opacity = '1' })
    setTimeout(() => { el.style.opacity = '0' }, 6000)
    setTimeout(() => { el.remove() }, 6400)
  }

  window.__gfShowToast = () => {
    chrome.runtime.sendMessage({ type: 'GET_TOAST_INFO' }, res => {
      if (chrome.runtime.lastError) return
      if (res && res.message) render(res.message)
    })
  }

  window.__gfShowToast()
})()
