import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTier, getPriceForTier, formatPriceForDisplay } from "@/lib/stripe/server";

export default async function PricingPage() {
  const supabase = await createClient();

  // Get current subscriber count
  const { count } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "comped"]);

  const currentTier = getCurrentTier(count || 0);
  const currentPrice = getPriceForTier(currentTier);
  const spotsInTier = 40 - ((count || 0) % 40);

  const features = [
    "Daily TSLA analysis reports after market close",
    "Traffic Light regime system (Green/Yellow/Red)",
    "Key price levels & alerts",
    "Personalized position sizing guidance",
    "Master Eject risk management",
    "AI chat assistant (15 messages/day)",
    "Email alerts when price hits levels",
    "Full report archive access",
    "Performance tracking",
    "Mobile-optimized interface",
  ];

  return (
    <main className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lock in your price today. As our community grows, prices increase for new
            subscribers—but your rate stays the same forever.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary">
            <CardHeader className="text-center pb-2">
              <Badge className="w-fit mx-auto mb-4">
                Tier {currentTier} • {spotsInTier} spots left at this price
              </Badge>
              <CardTitle className="text-3xl">Flacko AI Subscription</CardTitle>
              <CardDescription>
                Full access to all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold">
                  {formatPriceForDisplay(currentPrice)}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/signup" className="block">
                <Button className="w-full" size="lg">
                  Subscribe Now
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground text-center">
                Cancel anytime. Your locked price is guaranteed as long as you
                remain subscribed.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Tiers Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Growth Pricing Model
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">How It Works</h3>
                <p className="text-muted-foreground text-sm">
                  Our pricing increases every 40 subscribers, starting at $29.99
                  and capping at $99.99. This rewards early adopters and ensures
                  sustainable, quality service as we grow.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Price Lock Guarantee</h3>
                <p className="text-muted-foreground text-sm">
                  The price you subscribe at is locked forever. Even if prices
                  rise to $99.99 for new subscribers, you keep your original
                  rate as long as you stay subscribed.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-center">Price Tiers</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Tier</th>
                        <th className="text-left py-2">Subscribers</th>
                        <th className="text-right py-2">Price/mo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((tier) => {
                        const price = getPriceForTier(tier);
                        const isCurrentTier = tier === currentTier;
                        return (
                          <tr
                            key={tier}
                            className={`border-b ${isCurrentTier ? "bg-primary/10" : ""}`}
                          >
                            <td className="py-2">
                              Tier {tier}
                              {isCurrentTier && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Current
                                </Badge>
                              )}
                            </td>
                            <td className="py-2">
                              {(tier - 1) * 40 + 1}-{tier * 40}
                            </td>
                            <td className="py-2 text-right font-medium">
                              {formatPriceForDisplay(price)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td className="py-2">Tier 15+</td>
                        <td className="py-2">561+</td>
                        <td className="py-2 text-right font-medium">$99.99</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">When are reports published?</h3>
              <p className="text-muted-foreground">
                Reports are published daily after market close, typically between
                5-7 PM Eastern.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your access
                continues until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What if I resubscribe later?</h3>
              <p className="text-muted-foreground">
                If you cancel and resubscribe, you keep your original locked
                price—it&apos;s tied to your account permanently.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is this financial advice?</h3>
              <p className="text-muted-foreground">
                No. Flacko AI provides trading intelligence and educational
                content, not financial advice. Always do your own research and
                consult with a qualified financial advisor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
