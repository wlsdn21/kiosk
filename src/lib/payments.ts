import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY

export async function mountPaymentWidget(
  methodsSel: string,
  agreementSel: string,
  amount: number,
) {
  const toss = await loadTossPayments(clientKey)
  // widgets() is synchronous — returns TossPaymentsWidgets directly (not a Promise)
  const widgets = toss.widgets({ customerKey: ANONYMOUS })
  await widgets.setAmount({ currency: 'KRW', value: amount })
  await Promise.all([
    widgets.renderPaymentMethods({ selector: methodsSel, variantKey: 'DEFAULT' }),
    widgets.renderAgreement({ selector: agreementSel, variantKey: 'AGREEMENT' }),
  ])
  return widgets
}
