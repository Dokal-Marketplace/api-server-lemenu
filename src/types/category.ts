export interface CreateCategoryInput {
  name: string
  description?: string
  imageUrl?: string
  position?: number
  subDomain: string
  localId: string
}

export interface UpdateCategoryInput {
  rId: string
  name?: string
  description?: string
  imageUrl?: string
  position?: number
  isActive?: boolean
}


