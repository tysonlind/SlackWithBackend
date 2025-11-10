const API = 'https://slackclonebackendapi.onrender.com'

const channelList = document.querySelector('.channel-list')
const messagesEl = document.getElementById('chat-messages')
const titleEl = document.getElementById('channel-title')
const inputEl = document.getElementById('message-input')
const sendBtn = document.querySelector('#chat-form button')

let currentChannelId = null

function changeChannel(e) {
  const prev = document.querySelector('.channel-list .active')
  if (prev) prev.classList.remove('active')
  e.currentTarget.classList.add('active')
  currentChannelId = e.currentTarget.getAttribute('data-channel')
  titleEl.innerText = e.currentTarget.innerText
  populateMessages(currentChannelId)
}

function populateMessages(chat) {
  document.querySelectorAll('.message').forEach(m => m.remove())

  fetch(`${API}/messages?channelId=${chat}`)
    .then(r => r.json())
    .then(list => {
      const msgs = (list || [])
        .filter(m => Number(m.channelId) === Number(chat))
        .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))

      // get all unique senderIds
      const ids = [...new Set(msgs.map(m => m.senderId))]
      const userMap = {}

      //fetch all the users before we try to populate anything so we get the correct message order by timestamp
      Promise.all(ids.map(id =>
        fetch(`${API}/users?id=${id}`)
          .then(r => r.json())
          .then(arr => {
            if (arr && arr[0]) userMap[id] = arr[0].name
          })
      )).then(() => {
        msgs.forEach(m => {
          const row = document.createElement('div')
          row.className = 'message'
          const s = document.createElement('span')
          s.className = 'sender'
          s.textContent = (userMap[m.senderId] || `User ${m.senderId}`) + ':'
          const t = document.createElement('span')
          t.className = 'text'
          t.textContent = m.content || m.text || ''
          row.appendChild(s)
          row.appendChild(t)
          messagesEl.appendChild(row)
        })
        messagesEl.scrollTop = messagesEl.scrollHeight
      })
    })
}

function init() {
  fetch(`${API}/channels`)
    .then(r => r.json())
    .then(channels => {
      channels.forEach(ch => {
        const btn = document.createElement('button')
        btn.className = 'channel'
        btn.setAttribute('data-channel', ch.id)
        btn.innerText = ch.name
        channelList.appendChild(btn)
      })

      document.querySelectorAll('.channel').forEach(btn => {
        btn.addEventListener('click', changeChannel)
      })

      const first = document.querySelector('.channel')
      if (first) first.click()
    })

  function sendMessage() {
    const txt = inputEl.value.trim()
    if (!txt || !currentChannelId) return
    const payload = {
      channelId: Number(currentChannelId),
      senderId: Math.floor(Math.random() * 3) + 1,
      content: txt,
      timestamp: new Date().toISOString()
    }
    inputEl.value = ''
    fetch(`${API}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => populateMessages(currentChannelId))
  }

  sendBtn.addEventListener('click', sendMessage)
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage()
  })
}

init()
