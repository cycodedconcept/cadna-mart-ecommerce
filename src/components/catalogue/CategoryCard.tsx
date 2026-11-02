import type { Category } from "../../features/catalogue/types";
export default function CategoryCard({ category }: { category: Category }) {
  return (
    <a className="category" href={`/categories/${category.id}`}>
      <img src={category.image} alt="" loading="lazy" />
      <span>{category.name}</span>
    </a>
  );
}
