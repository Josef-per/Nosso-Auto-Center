import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function CategoryCard({ title, description, icon }) {
  return (
    <Link to={`/loja?categoria=${encodeURIComponent(title)}`} className="cat">
      <span className="category-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      <small>{description}</small>
      <ArrowUpRight className="category-arrow" size={20} aria-hidden="true" />
    </Link>
  );
}
