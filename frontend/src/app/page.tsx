import Link from "next/link";
import { Vote, Heart, Shield, Zap, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Transparent Voting",
    description: "Every vote is recorded on the blockchain, ensuring complete transparency and immutability.",
  },
  {
    icon: Heart,
    title: "Direct Donations",
    description: "Donate directly to verified charities with full traceability of your contributions.",
  },
  {
    icon: Lock,
    title: "Secure & Trustless",
    description: "Smart contracts eliminate intermediaries, ensuring funds go exactly where intended.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description: "Transactions are processed on Ethereum with near-instant confirmation.",
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Anyone with a wallet can participate from anywhere in the world.",
  },
  {
    icon: Vote,
    title: "Verifiable Results",
    description: "Election results can be independently verified by anyone on the blockchain.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Decentralized Governance for the{" "}
                <span className="text-primary">Future</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Transparent voting and charitable donations powered by blockchain technology. 
                Every transaction is verifiable, every vote counts.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[160px]">
                <Link href="/voting">
                  <Vote className="mr-2 h-5 w-5" />
                  Start Voting
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                <Link href="/charity">
                  <Heart className="mr-2 h-5 w-5" />
                  Donate Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why ChainGov?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on Ethereum, our platform provides unprecedented transparency and security for democratic processes and charitable giving.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-0 shadow-sm bg-card/50">
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <Vote className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Decentralized Voting</CardTitle>
                <CardDescription>
                  Create elections, whitelist voters, and conduct transparent polls with verifiable results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Admin-controlled candidate management
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Whitelist-based voter verification
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Time-bound voting sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Real-time result tracking
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/voting">Enter Voting Portal</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-destructive flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-destructive-foreground" />
                </div>
                <CardTitle className="text-2xl">Charity Donations</CardTitle>
                <CardDescription>
                  Support verified causes with transparent, traceable donations directly to charities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Direct ETH donations to campaigns
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Full donation history tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Secure fund withdrawal for charities
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Transparent contribution records
                  </li>
                </ul>
                <Button asChild variant="destructive" className="w-full">
                  <Link href="/charity">Browse Campaigns</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
