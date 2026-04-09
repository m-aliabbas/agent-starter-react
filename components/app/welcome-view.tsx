import { ArrowRight, BarChart3, Building2, CheckSquare, MessageSquareMore } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const features = [
    {
      icon: MessageSquareMore,
      title: 'AI Property Advisor',
      description: 'Ask questions naturally and get fast guidance for renting or buying.',
    },
    {
      icon: CheckSquare,
      title: 'Smart Checklists',
      description: 'Keep track of the practical details that matter before you commit.',
    },
    {
      icon: BarChart3,
      title: 'Property Comparisons',
      description: 'Compare options with a calmer, more structured decision flow.',
    },
    {
      icon: Building2,
      title: 'Rent vs Buy',
      description: 'Use the assistant to think through tradeoffs with confidence.',
    },
  ];

  return (
    <div ref={ref} className="min-h-svh px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#5f52f6_0%,#4338ca_45%,#35289f_100%)] px-6 py-16 text-center text-white shadow-[0_30px_100px_rgba(79,70,229,0.35)] md:px-12 md:py-24">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.55),rgba(255,255,255,0)_70%)] blur-2xl" />
          <div className="relative mx-auto max-w-3xl">
            <span className="mb-5 inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-1 text-xs font-semibold tracking-[0.24em] uppercase text-white/80">
              Property Advisor
            </span>
            <h1 className="text-4xl leading-none font-semibold tracking-tight text-balance md:text-6xl">
              Your AI-Powered
              <span className="mt-2 block text-[#96f0c3]">UK Property Advisor</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/82 md:text-lg">
              Whether you&apos;re renting your first flat or weighing up a home purchase, chat
              with your assistant and get clearer next steps without leaving the page.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={onStartCall}
                className="h-12 min-w-52 rounded-xl bg-white px-6 text-sm font-semibold text-[#4438ca] hover:bg-white/92"
              >
                {startButtonText}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={onStartCall}
                className="h-12 min-w-52 rounded-xl border border-white/10 bg-white/12 px-6 text-sm font-semibold text-white hover:bg-white/18"
              >
                Continue With Chat
              </Button>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-white/70">
              Ask AI to help decide <ArrowRight className="size-4" />
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-white/70 bg-white/90 p-6 shadow-[0_10px_35px_rgba(76,61,176,0.08)] backdrop-blur"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(95,82,246,0.14),rgba(150,240,195,0.22))] text-[#4f46e5]">
                <Icon className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-[#241b55]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#665f85]">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};
