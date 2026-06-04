// 토스 결제용 고유 orderId (내부용, 화면에 안 보임)
export const makeOrderId = () =>
  `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// 화면/주방에 표시되는 주문번호 = "오늘 N번째 주문" (매일 1부터, 이 기기 기준)
const SEQ_KEY = 'mm-order-seq'

export function makeOrderNumber(): string {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD (로컬 날짜)
  let seq = 1
  try {
    const saved = JSON.parse(localStorage.getItem(SEQ_KEY) || '{}')
    if (saved.date === today && Number.isInteger(saved.seq)) seq = saved.seq + 1
  } catch { /* 손상 시 1부터 */ }
  try {
    localStorage.setItem(SEQ_KEY, JSON.stringify({ date: today, seq }))
  } catch { /* 저장 실패해도 번호는 반환 */ }
  return String(seq)
}
