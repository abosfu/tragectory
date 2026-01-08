import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    studying: '',
    roles: '',
    location: '',
    timeline: ''
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate('/paths');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="font-mono text-xs tracking-[0.3em] uppercase text-black mb-6">
            TRAJECTORY
          </div>
          <h1 className="text-4xl md:text-5xl mb-4 text-black">
            Explore different paths your career could take.
          </h1>
          <p className="text-neutral-500 text-base leading-relaxed">
            Discover multiple structured career and co-op paths with real case studies from people 
            who've navigated similar journeys. See what's possible from where you are now.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm text-neutral-500 font-mono tracking-wide">
              Name (optional)
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border-neutral-200 focus:border-black"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="studying" className="block text-sm text-neutral-500 font-mono tracking-wide">
              What are you studying or working on?
            </label>
            <Input
              id="studying"
              type="text"
              value={formData.studying}
              onChange={(e) => setFormData({ ...formData, studying: e.target.value })}
              className="w-full border-neutral-200 focus:border-black"
              placeholder="e.g., Computer Science, Marketing, Self-taught developer"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="roles" className="block text-sm text-neutral-500 font-mono tracking-wide">
              What types of roles are you interested in?
            </label>
            <Textarea
              id="roles"
              value={formData.roles}
              onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
              className="w-full min-h-[100px] border-neutral-200 focus:border-black resize-none"
              placeholder="e.g., Software development, product management, data analysis..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm text-neutral-500 font-mono tracking-wide">
              Where are you located?
            </label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border-neutral-200 focus:border-black"
              placeholder="e.g., Toronto, Remote, San Francisco"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timeline" className="block text-sm text-neutral-500 font-mono tracking-wide">
              What's your rough timeline?
            </label>
            <Input
              id="timeline"
              type="text"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              className="w-full border-neutral-200 focus:border-black"
              placeholder="Next 6-12 months"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-black text-white hover:bg-neutral-800 h-12 text-base"
          >
            See possible paths
          </Button>
        </form>
      </div>
    </div>
  );
}