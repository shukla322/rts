import type { Category, CategoryId, Product } from './types'

// Illustrative catalogue — fictional products and prices.
export const CATEGORIES: Category[] = [
  { id: 'audio', name: 'Audio Devices' },
  { id: 'sarees', name: 'Sarees' },
  { id: 'footwear', name: 'Footwear' },
  { id: 'decor', name: 'Home Decor' },
]

export const PRODUCTS: Product[] = [
  { id: 'p-headphones', name: 'Wireless Headphones', categoryId: 'audio', price: 449, sellerId: 's-audionest', image: '/product_image_earphones.avif' },
  { id: 'p-earbuds', name: 'Wireless Earbuds', categoryId: 'audio', price: 269, sellerId: 's-audionest', image: '/products/audio.svg' },
  { id: 'p-silk-saree', name: 'Silk Blend Saree', categoryId: 'sarees', price: 599, sellerId: 's-silkroute', image: '/products/sarees.svg' },
  { id: 'p-cotton-saree', name: 'Cotton Handloom Saree', categoryId: 'sarees', price: 349, sellerId: 's-tarang', image: '/products/sarees.svg' },
  { id: 'p-running-shoes', name: 'Running Shoes', categoryId: 'footwear', price: 499, sellerId: 's-strideco', image: '/products/footwear.svg' },
  { id: 'p-sandals', name: 'Leather Sandals', categoryId: 'footwear', price: 299, sellerId: 's-urbansoles', image: '/products/footwear.svg' },
  { id: 'p-cushions', name: 'Cushion Cover Set', categoryId: 'decor', price: 199, sellerId: 's-silkroute', image: '/products/decor.svg' },
  { id: 'p-vase', name: 'Ceramic Table Vase', categoryId: 'decor', price: 399, sellerId: 's-hearth', image: '/products/decor.svg' },
]

export const DEFAULT_PRODUCT_ID = 'p-headphones'

export function getProduct(id: string): Product {
  const product = PRODUCTS.find((p) => p.id === id)
  if (!product) throw new Error(`Unknown product ${id}`)
  return product
}

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((c) => c.id === id)
  if (!category) throw new Error(`Unknown category ${id}`)
  return category
}
