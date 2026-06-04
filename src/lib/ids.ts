export const makeOrderId = () =>
  `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const makeOrderNumber = () =>
  Array.from({ length: 4 }, () => CH[Math.floor(Math.random() * CH.length)]).join('')
