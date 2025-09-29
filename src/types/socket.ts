export type NotificationPayload = {
  _id: string
  message: string
  category: string
  createdAt: string
  subDomain: string
  localId: string
}

export type OrderUpdatePayload = {
  _id: string
  status: string
  orderId: string
  newStatus: string
}

export type NewMessagePayload = {
  _id: string
  content: string
  role: string
  clientPhone: string
  chatbotNumber: string
  createdAt: string
}


