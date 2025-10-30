import { reverseConsume, consumeOneForOrder } from './creditsService'

export async function onOrderCompleted(businessId: string, orderId: string) {
  await consumeOneForOrder(businessId, orderId, 'order_completed')
}

export async function onOrderCancelledWithinGrace(businessId: string, orderId: string) {
  await reverseConsume(businessId, orderId, 'cancel_within_grace')
}


