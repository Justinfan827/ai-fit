export interface Category {
  id: string
  name: string
  description: string | null
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CategoryValue {
  id: string
  categoryId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CategoryWithValues extends Category {
  values: CategoryValue[]
}
