import Link from "next/link";
import { Vote, Heart, ArrowRight } from "lucide-react";

const projects = [
  {
    id: "voting",
    title: "Voting",
    description: "On-chain elections with whitelisted voters and verifiable results.",
    icon: Vote,
    href: "/voting",
  },
  {
    id: "charity",
    title: "Charity",
    description: "Transparent donation tracking with full on-chain traceability.",
    icon: Heart,
    href: "/charity",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <section className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Blockchain Projects
            </h1>
            <p className="text-muted-foreground mb-12">
              A collection of smart contract experiments on Ethereum. Open source, deployed on Sepolia.
            </p>

            <div className="space-y-3">
              {projects.map((project) => {
                const Icon = project.icon;
                return (
                  <Link
                    key={project.id}
                    href={project.href}
                    className="group flex items-center justify-between p-4 -mx-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg border flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground">{project.description}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
