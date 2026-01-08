import { useParams, Link } from 'react-router-dom';
import { usePathsQuery, useCaseStudiesQuery } from '../../data/mockData';
import { ExternalLink, ArrowLeft } from 'lucide-react';

export default function PathDetailPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const { data: paths } = usePathsQuery();
  const { data: caseStudies, isLoading } = useCaseStudiesQuery(pathId || '');

  const currentPath = paths?.find((p) => p.id === pathId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!currentPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Path not found</p>
          <Link to="/paths" className="text-black underline">
            Back to paths
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          to="/paths" 
          className="inline-flex items-center text-sm text-neutral-500 hover:text-black mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="font-mono tracking-wide">Back to all paths</span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl mb-4 text-black">
            {currentPath.name}
          </h1>
          <p className="text-neutral-500 text-base leading-relaxed">
            {currentPath.description}
          </p>
        </div>

        {/* Case Studies */}
        <div className="space-y-6">
          {caseStudies?.map((study) => (
            <div
              key={study.id}
              className="border border-neutral-200 rounded-lg p-6 hover:border-black transition-colors"
            >
              <h3 className="text-xl mb-2 text-black">
                {study.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-500 mb-4">
                <span>{study.roleType}</span>
                {study.tags.map((tag, index) => (
                  <span key={index}>
                    <span className="mx-1">•</span>
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                {study.shortSummary}
              </p>

              <a
                href={study.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-black hover:underline"
              >
                <span className="font-mono tracking-wide">Read full case study</span>
                <ExternalLink className="ml-2 w-4 h-4" />
              </a>
            </div>
          ))}

          {caseStudies?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500">No case studies available for this path yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
