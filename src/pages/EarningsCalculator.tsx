import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, MoneyRecive, Clock, Calendar, TrendUp } from 'iconsax-react';

const EarningsCalculator = () => {
  const [hourlyRate, setHourlyRate] = useState(200);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [weeksPerMonth, setWeeksPerMonth] = useState(4);

  const dailyEarnings = hourlyRate * hoursPerDay;
  const weeklyEarnings = dailyEarnings * daysPerWeek;
  const monthlyEarnings = weeklyEarnings * weeksPerMonth;
  const yearlyEarnings = monthlyEarnings * 12;

  // Platform fee estimation (10%)
  const platformFee = 0.10;
  const netMonthlyEarnings = monthlyEarnings * (1 - platformFee);

  return (
    <Layout title="Earnings Calculator">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Earnings Calculator</h2>
          <p className="text-sm text-muted-foreground">Estimate your potential earnings on WorkNexus</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator size={20} />
                Calculate Your Earnings
              </CardTitle>
              <CardDescription>Adjust the values to see your potential earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hourly Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Hourly Rate</Label>
                  <span className="text-lg font-semibold text-primary">₹{hourlyRate}/hr</span>
                </div>
                <Slider
                  value={[hourlyRate]}
                  onValueChange={([value]) => setHourlyRate(value)}
                  min={50}
                  max={1000}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹50</span>
                  <span>₹1000</span>
                </div>
              </div>

              {/* Hours Per Day */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Hours Per Day</Label>
                  <span className="text-lg font-semibold text-primary">{hoursPerDay} hrs</span>
                </div>
                <Slider
                  value={[hoursPerDay]}
                  onValueChange={([value]) => setHoursPerDay(value)}
                  min={1}
                  max={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 hr</span>
                  <span>12 hrs</span>
                </div>
              </div>

              {/* Days Per Week */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Days Per Week</Label>
                  <span className="text-lg font-semibold text-primary">{daysPerWeek} days</span>
                </div>
                <Slider
                  value={[daysPerWeek]}
                  onValueChange={([value]) => setDaysPerWeek(value)}
                  min={1}
                  max={7}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 day</span>
                  <span>7 days</span>
                </div>
              </div>

              {/* Weeks Per Month */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Weeks Per Month</Label>
                  <span className="text-lg font-semibold text-primary">{weeksPerMonth} weeks</span>
                </div>
                <Slider
                  value={[weeksPerMonth]}
                  onValueChange={([value]) => setWeeksPerMonth(value)}
                  min={1}
                  max={4}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 week</span>
                  <span>4 weeks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Earnings Breakdown */}
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <MoneyRecive size={20} variant="Bold" />
                  Estimated Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Daily</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      ₹{dailyEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Weekly</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      ₹{weeklyEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Monthly</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      ₹{monthlyEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Yearly</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      ₹{yearlyEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Earnings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp size={20} />
                  Net Earnings (After Platform Fee)
                </CardTitle>
                <CardDescription>Platform fee: 10%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gross Monthly</span>
                    <span className="font-medium">₹{monthlyEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-500">
                    <span>Platform Fee (10%)</span>
                    <span>-₹{(monthlyEarnings * platformFee).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-semibold">Net Monthly</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{netMonthlyEarnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={20} />
                  Work Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-muted-foreground" />
                    <span>{hoursPerDay * daysPerWeek * weeksPerMonth} hours/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>{daysPerWeek * weeksPerMonth} days/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">💡 Tips to Maximize Earnings</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete your profile to get more job offers</li>
                  <li>• Maintain a high rating for priority access to premium jobs</li>
                  <li>• Apply for urgent jobs - they often pay more</li>
                  <li>• Get verified to stand out from other applicants</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EarningsCalculator;
