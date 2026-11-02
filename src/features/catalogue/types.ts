export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Product {
  id: number;
  name: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  images: string[];
  description: string;
  stock: number;
  specifications: Record<string, string>;
}
