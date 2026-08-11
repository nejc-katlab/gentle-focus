const statusEl = document.getElementById('status')
const hintEl = document.getElementById('hint')
const optionsBtn = document.getElementById('optionsBtn')

optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
})

chrome.runtime.sendMessage({ type: 'GET_STATE' }, state => {
  if (!state) return
  const paused = Date.now() < (state.pause?.expiresAt ?? 0)
  const count = state.blocklist?.length ?? 0
  statusEl.textContent = paused ? 'Paused' : 'Active'
  hintEl.textContent = paused
    ? 'Gating is paused for now.'
    : `${count} site${count === 1 ? '' : 's'} on your blocklist.`
})
