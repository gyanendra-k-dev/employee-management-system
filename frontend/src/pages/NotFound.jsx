import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-teal-700">404</p>
      <h1 className="mt-3 text-xl font-semibold text-stone-900">Page not found</h1>
      <p className="mt-1 text-sm text-stone-500">The page you are looking for doesn't exist or was moved.</p>
      <Link to="/" className="btn-primary mt-6">
        Go to home
      </Link>
    </div>
  );
}
