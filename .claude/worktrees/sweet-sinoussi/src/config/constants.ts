// Trackstar configuration constants

export const APP_NAME = 'Trackstar'
export const APP_DESCRIPTION = 'Runner research fulfillment tool'

export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'flagged'] as const
export type OrderStatus = typeof ORDER_STATUSES[number]
