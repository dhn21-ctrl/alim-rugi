export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  category: string
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem('cart')
  return cart ? JSON.parse(cart) : []
}

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const cart = getCart()
  const existing = cart.find(c => c.id === item.id)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }
  localStorage.setItem('cart', JSON.stringify(cart))
}

export function removeFromCart(id: string) {
  const cart = getCart().filter(c => c.id !== id)
  localStorage.setItem('cart', JSON.stringify(cart))
}

export function updateQuantity(id: string, quantity: number) {
  const cart = getCart().map(c => c.id === id ? { ...c, quantity } : c)
  localStorage.setItem('cart', JSON.stringify(cart))
}

export function clearCart() {
  localStorage.removeItem('cart')
}

export function getCartCount(): number {
  return getCart().reduce((sum, c) => sum + c.quantity, 0)
}