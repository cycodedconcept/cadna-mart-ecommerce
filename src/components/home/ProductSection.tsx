import { formatPrice, type Product } from '../../data/home';
interface Props {
    title: string;
    accent: string;
    products: Product[];
    onAdd: (product: Product) => void;
}
export default function ProductSection({ title, accent, products, onAdd }: Props) {
    return <section className="product-section" aria-label={`${title} ${accent}`}><div className="section-heading"><h2>{title} <span>{accent}</span></h2><a href="#categories">View All ›</a></div>{products.length ? <div className="product-grid">{products.map(p => <button className="product-card" key={p.id} onClick={() => onAdd(p)} aria-label={`Add ${p.name} to demo cart`}><div className="product-image"><img src={`/images/product-${p.id}.png`} alt={p.name} loading="lazy"/><span className="discount">-{Math.round((1 - p.price / p.originalPrice) * 100)}%</span></div><div className="product-copy"><h3>{p.name}</h3><div className="rating"><span aria-label="4.5 out of 5 stars">★★★★★</span> <small>4.5 (20)</small></div><div className="prices"><strong>{formatPrice(p.price)}</strong> <del>{formatPrice(p.originalPrice)}</del></div><p className="saving">Save ~ {formatPrice(p.originalPrice - p.price)}</p></div></button>)}</div> : <p className="empty-state">No products match your search in this section.</p>}</section>;
}
