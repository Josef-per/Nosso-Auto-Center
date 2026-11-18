import { Link } from 'react-router-dom';
export default function CategoryCard({ title, description, icon }) {
  return <Link to="/loja" className="cat"><strong>{title}</strong><small>{description}</small><span className="category-icon" aria-hidden="true">{icon}</span><span className="category-arrow" aria-hidden="true">↗</span></Link>;
}
