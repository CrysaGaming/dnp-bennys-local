export function isLowStock(p: { stock: number; minStock: number }): boolean {
  return p.stock < p.minStock;
}
