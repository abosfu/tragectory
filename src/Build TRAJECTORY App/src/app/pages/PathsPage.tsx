import { Link } from 'react-router-dom';
import { usePathsQuery } from '../../data/mockData';
import { ArrowRight } from 'lucide-react';

export default function PathsPage() {
  const { data: paths, isLoading } = usePathsQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="font-mono text-xs tracking-[0.3em] uppercase text-black mb-4">
            AVAILABLE PATHS
          </div>
          <h1 className="text-4xl md:text-5xl mb-4 text-black">
            Choose a direction to explore.
          </h1>
          <p className="text-neutral-500 text-base leading-relaxed max-w-2xl">
            Each path includes real case studies from people who successfully navigated similar career transitions. 
            Compare their journeys to find what resonates with you.
          </p>
        </div>

        {/* Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths?.map((path) => (
            <Link
              key={path.id}
              to={`/paths/${path.id}`}
              className="group border border-neutral-200 rounded-lg p-6 hover:border-black transition-colors"
            >
              <h2 className="text-xl mb-3 text-black">
                {path.name}
              </h2>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                {path.description}
              </p>
              <div className="flex items-center text-sm text-black group-hover:translate-x-1 transition-transform">
                <span className="font-mono tracking-wide">View case studies</span>
                <ArrowRight className="ml-2 w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
